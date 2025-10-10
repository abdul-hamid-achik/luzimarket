import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { validateCartStock, type CartItem } from "@/lib/actions/inventory";
import { db } from "@/db";
import { orders, orderItems, vendorStripeAccounts, platformFees, vendors } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { generateOrderNumber } from "@/lib/utils/order-id";
import { auth } from "@/lib/auth";
import { businessConfig, calculateTax, calculateShipping } from "@/lib/config/business";
import crypto from "crypto";
import { calculateTaxForState, getTaxRate } from "@/lib/utils/tax-rates";

export async function POST(request: NextRequest) {
  try {
    // Get the session to check if user is logged in
    const session = await auth();

    const body = await request.json();
    const { items, shippingAddress, billingAddress, isGuest, selectedShipping, selectedShippingByVendor, shippingCostsByVendor } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      );
    }

    if (!shippingAddress || !shippingAddress.email) {
      return NextResponse.json(
        { error: 'Customer email is required' },
        { status: 400 }
      );
    }

    // Validate stock availability before proceeding
    const cartItems: CartItem[] = items.map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      name: item.name,
      price: item.price,
    }));

    const stockValidation = await validateCartStock(cartItems);
    if (!stockValidation.isValid) {
      const errorMessages = stockValidation.errors.map(error =>
        `${error.productName}: ${error.requestedQuantity === 1 ? 'solicitas 1 unidad' : `solicitas ${error.requestedQuantity} unidades`}, ${error.availableStock === 0 ? 'agotado' : error.availableStock === 1 ? 'solo queda 1' : `solo quedan ${error.availableStock}`}`
      ).join('; ');

      return NextResponse.json(
        {
          error: '🚫 No podemos procesar tu compra',
          message: 'Algunos productos en tu carrito no tienen suficiente stock disponible.',
          details: errorMessages,
          stockErrors: stockValidation.errors,
          suggestion: 'Por favor, ajusta las cantidades en tu carrito o elimina los productos agotados.'
        },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const tax = calculateTax(subtotal);

    // Calculate total shipping from all vendors
    const totalShippingFromVendors = shippingCostsByVendor ?
      Object.values(shippingCostsByVendor).reduce((sum: number, cost) => sum + (Number(cost) || 0), 0) : 0;

    let shipping = totalShippingFromVendors || businessConfig.shipping.defaultCost; // Use calculated shipping or fallback
    let shippingDescription = '📦 Envío estándar en México';
    let shippingDays = { min: 3, max: 5 };

    // If we have vendor-specific shipping info, try to get description from the first vendor
    if (selectedShippingByVendor && Object.keys(selectedShippingByVendor).length > 0) {
      const firstVendorShipping = Object.values(selectedShippingByVendor)[0] as any;
      if (firstVendorShipping) {
        shippingDescription = firstVendorShipping.name || shippingDescription;
        shippingDays = firstVendorShipping.estimatedDays || shippingDays;
      }
    }

    const total = subtotal + tax + shipping;

    // Determine base URL for images (same logic as checkout URLs)
    let appUrlForImages: string;

    if (process.env.NEXT_PUBLIC_APP_URL) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
      appUrlForImages = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
    } else if (process.env.VERCEL_URL) {
      appUrlForImages = `https://${process.env.VERCEL_URL}`;
    } else if (process.env.NODE_ENV === 'production') {
      appUrlForImages = 'https://luzimarket.shop';
    } else {
      appUrlForImages = `http://localhost:${process.env.PORT || '3000'}`;
    }

    // Create line items for Stripe
    const lineItems = [
      ...items.map((item: any) => ({
        price_data: {
          currency: 'mxn',
          product_data: {
            name: item.name,
            images: item.image && item.image.startsWith('/')
              ? [`${appUrlForImages}${item.image}`]
              : item.image ? [item.image] : [],
            metadata: {
              vendorId: item.vendorId,
              vendorName: item.vendorName,
            },
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      })),
      // Add tax as a line item
      {
        price_data: {
          currency: 'mxn',
          product_data: {
            name: 'IVA (16%)',
          },
          unit_amount: Math.round(tax * 100),
        },
        quantity: 1,
      },
    ];

    // Shipping is now handled via shipping_options, not as a line item

    // Create order record first
    const orderNumber = generateOrderNumber();

    // For multi-vendor orders, we'll create separate orders per vendor
    const vendorGroups = items.reduce((groups: any, item: any) => {
      const vendorId = item.vendorId;
      if (!groups[vendorId]) {
        groups[vendorId] = [];
      }
      groups[vendorId].push(item);
      return groups;
    }, {});

    // Check if all vendors have Stripe Connect accounts
    const vendorIds = Object.keys(vendorGroups);
    const vendorStripeAccountsData = await db
      .select()
      .from(vendorStripeAccounts)
      .where(inArray(vendorStripeAccounts.vendorId, vendorIds));

    const vendorStripeMap = new Map(
      vendorStripeAccountsData.map(acc => [acc.vendorId, acc])
    );

    // Check if all vendors have active Stripe accounts
    let useStripeConnect = true;
    for (const vendorId of vendorIds) {
      const stripeAccount = vendorStripeMap.get(vendorId);
      if (!stripeAccount || !stripeAccount.chargesEnabled || !stripeAccount.payoutsEnabled) {
        useStripeConnect = false;
        break;
      }
    }

    const orderIds: string[] = [];
    const orderDetailsMap = new Map<string, any>();

    // Generate a single orderGroupId for all orders from this checkout (multi-vendor tracking)
    const orderGroupId = crypto.randomUUID();

    // Create orders for each vendor
    for (const [vendorId, vendorItems] of Object.entries(vendorGroups)) {
      const vendorSubtotal = (vendorItems as any[]).reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Get vendor state to calculate proper tax rate
      const vendorDetails = await db
        .select({ state: vendors.state })
        .from(vendors)
        .where(eq(vendors.id, vendorId))
        .limit(1);

      const vendorState = vendorDetails[0]?.state;
      const taxRate = getTaxRate(vendorState);
      const vendorTax = calculateTaxForState(vendorSubtotal, vendorState);

      // Use calculated shipping cost for this vendor, fallback to default if not provided
      const vendorShipping = shippingCostsByVendor?.[vendorId] ?? calculateShipping(vendorSubtotal);
      const vendorTotal = vendorSubtotal + vendorTax + vendorShipping;

      // Calculate platform fee
      const stripeAccount = vendorStripeMap.get(vendorId);
      const commissionRate = stripeAccount?.commissionRate ? parseFloat(stripeAccount.commissionRate) : (businessConfig.commission.rate * 100);
      const platformFeeAmount = vendorSubtotal * (commissionRate / 100);

      // Ensure decimal values are properly formatted
      const orderData = {
        orderNumber: orderNumber,
        vendorId: vendorId,
        orderGroupId: orderGroupId, // Link all orders from same checkout
        status: "pending" as const,
        subtotal: vendorSubtotal.toFixed(2),
        tax: vendorTax.toFixed(2),
        taxBreakdown: {
          vendorId: vendorId,
          rate: taxRate,
          amount: vendorTax,
          state: vendorState || 'Unknown'
        },
        shipping: vendorShipping.toFixed(2),
        total: vendorTotal.toFixed(2),
        currency: "MXN",
        // Only set userId for customers (who exist in the users table)
        // Vendors and admins have separate tables, so we track them via email
        ...(session?.user?.id && session.user.role === 'customer' ? { userId: session.user.id } : {}),
        // Always store email for order tracking (helps with order lookup for all user types)
        guestEmail: shippingAddress.email,
        guestName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        guestPhone: shippingAddress.phone,
        shippingAddress: {
          street: `${shippingAddress.address} ${shippingAddress.apartment || ''}`.trim(),
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.postalCode,
          country: 'MX',
        },
        billingAddress: billingAddress ? {
          street: `${billingAddress.address} ${billingAddress.apartment || ''}`.trim(),
          city: billingAddress.city,
          state: billingAddress.state,
          postalCode: billingAddress.postalCode,
          country: 'MX',
        } : null,
      };

      const [order] = await db.insert(orders).values(orderData).returning({ id: orders.id });

      // Create order items
      const orderItemsData = (vendorItems as any[]).map(item => ({
        orderId: order.id,
        productId: item.id,
        quantity: item.quantity,
        price: item.price.toFixed(2),
        total: (item.price * item.quantity).toFixed(2),
      }));

      await db.insert(orderItems).values(orderItemsData);
      orderIds.push(order.id);

      // Store order details for later use
      orderDetailsMap.set(vendorId, {
        orderId: order.id,
        total: vendorTotal,
        subtotal: vendorSubtotal,
        platformFee: platformFeeAmount,
        vendorEarnings: vendorTotal - platformFeeAmount,
        stripeAccountId: stripeAccount?.stripeAccountId,
      });

      // Create platform fee record if using Stripe Connect
      if (useStripeConnect && stripeAccount) {
        await db.insert(platformFees).values({
          orderId: order.id,
          vendorId: vendorId,
          orderAmount: vendorTotal.toFixed(2),
          feePercentage: commissionRate.toFixed(2),
          feeAmount: platformFeeAmount.toFixed(2),
          vendorEarnings: (vendorTotal - platformFeeAmount).toFixed(2),
          currency: "MXN",
          status: "pending",
        });
      }
    }

    // E2E/Test bypass: if special cookie is present, skip Stripe and return success URL with order number
    const e2eCookie = request.cookies.get('e2e')?.value;
    if (e2eCookie === '1') {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL
        ? (process.env.NEXT_PUBLIC_APP_URL.startsWith('http') ? process.env.NEXT_PUBLIC_APP_URL : `https://${process.env.NEXT_PUBLIC_APP_URL}`)
        : `http://localhost:${process.env.PORT || '3000'}`;

      const fakeSessionId = `e2e_${Date.now()}`;
      // Include all order IDs for multi-vendor orders
      const orderIdsParam = orderIds.length > 1 ? `&orderIds=${orderIds.join(',')}` : '';
      return NextResponse.json({
        sessionId: fakeSessionId,
        url: `${appUrl}/success?session_id=${fakeSessionId}&order=${orderNumber}${orderIdsParam}`,
        orderIds: orderIds, // Also return orderIds for the test to use
      });
    }

    // Create Stripe checkout session
    try {
      // Determine the base URL based on environment
      let appUrl: string;

      if (process.env.NEXT_PUBLIC_APP_URL) {
        // Use environment variable if set
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
        appUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
      } else if (process.env.VERCEL_URL) {
        // Use Vercel URL in production
        appUrl = `https://${process.env.VERCEL_URL}`;
      } else if (process.env.NODE_ENV === 'production') {
        // Fallback for production
        appUrl = 'https://luzimarket.shop';
      } else {
        // Local development
        appUrl = `http://localhost:${process.env.PORT || '3000'}`;
      }

      // If we're using Stripe Connect and all vendors have accounts, handle payment splitting
      if (useStripeConnect) {
        // For Stripe Connect, we'll use the platform account and create transfers after payment
        // This works for both single and multi-vendor scenarios

        // Calculate total platform fees
        let totalPlatformFees = 0;
        const vendorSplits: any[] = [];

        for (const [vendorId, details] of orderDetailsMap.entries()) {
          totalPlatformFees += details.platformFee;
          vendorSplits.push({
            vendorId,
            stripeAccountId: details.stripeAccountId,
            amount: details.vendorEarnings, // Amount to transfer to vendor
            orderId: details.orderId,
          });
        }

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card', 'oxxo'],
          line_items: lineItems,
          mode: 'payment',
          success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${appUrl}/checkout/cancel`,
          customer_email: shippingAddress.email,
          shipping_options: [
            {
              shipping_rate_data: {
                type: 'fixed_amount',
                fixed_amount: {
                  amount: shipping * 100,
                  currency: 'mxn',
                },
                display_name: shippingDescription,
                delivery_estimate: {
                  minimum: {
                    unit: 'business_day',
                    value: shippingDays.min,
                  },
                  maximum: {
                    unit: 'business_day',
                    value: shippingDays.max,
                  },
                },
              },
            },
          ],
          billing_address_collection: 'auto',
          customer_creation: 'if_required',
          payment_intent_data: {
            description: '🇲🇽 Compra de productos únicos mexicanos - Luzimarket',
            // Platform keeps all funds initially, transfers happen in webhook
            shipping: {
              name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
              phone: shippingAddress.phone,
              address: {
                line1: shippingAddress.address,
                line2: shippingAddress.apartment || undefined,
                city: shippingAddress.city,
                state: shippingAddress.state,
                postal_code: shippingAddress.postalCode,
                country: 'MX',
              },
            },
          },
          metadata: {
            customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
            customerPhone: shippingAddress.phone || '',
            shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : '',
            billingAddress: billingAddress ? JSON.stringify(billingAddress) : '',
            orderIds: orderIds.join(','),
            isGuest: isGuest ? 'true' : 'false',
            selectedShipping: selectedShipping ? JSON.stringify(selectedShipping) : '',
            selectedShippingByVendor: selectedShippingByVendor ? JSON.stringify(selectedShippingByVendor) : '',
            shippingCostsByVendor: shippingCostsByVendor ? JSON.stringify(shippingCostsByVendor) : '',
            useStripeConnect: 'true',
            vendorSplits: JSON.stringify(vendorSplits), // Store vendor split details
            totalPlatformFees: totalPlatformFees.toString(),
          },
          payment_method_options: {
            oxxo: {
              expires_after_days: 3,
            },
          },
          locale: 'es',
        });

        return NextResponse.json({
          sessionId: session.id,
          url: session.url
        });
      } else {
        // For multi-vendor or vendors without Stripe Connect, use regular checkout
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card', 'oxxo'], // Support OXXO for Mexico
          line_items: lineItems,
          mode: 'payment',
          success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${appUrl}/checkout/cancel`,
          customer_email: shippingAddress.email,
          // Pre-fill shipping information
          shipping_options: [
            {
              shipping_rate_data: {
                type: 'fixed_amount',
                fixed_amount: {
                  amount: shipping * 100, // Convert to cents
                  currency: 'mxn',
                },
                display_name: shippingDescription,
                delivery_estimate: {
                  minimum: {
                    unit: 'business_day',
                    value: shippingDays.min,
                  },
                  maximum: {
                    unit: 'business_day',
                    value: shippingDays.max,
                  },
                },
              },
            },
          ],
          billing_address_collection: 'auto',
          // Pre-fill customer information
          customer_creation: 'if_required',
          payment_intent_data: {
            description: '🇲🇽 Compra de productos únicos mexicanos - Luzimarket',
            shipping: {
              name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
              phone: shippingAddress.phone,
              address: {
                line1: shippingAddress.address,
                line2: shippingAddress.apartment || undefined,
                city: shippingAddress.city,
                state: shippingAddress.state,
                postal_code: shippingAddress.postalCode,
                country: 'MX',
              },
            },
          },
          metadata: {
            customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
            customerPhone: shippingAddress.phone || '',
            shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : '',
            billingAddress: billingAddress ? JSON.stringify(billingAddress) : '',
            orderIds: orderIds.join(','),
            isGuest: isGuest ? 'true' : 'false',
            selectedShipping: selectedShipping ? JSON.stringify(selectedShipping) : '',
            selectedShippingByVendor: selectedShippingByVendor ? JSON.stringify(selectedShippingByVendor) : '',
            shippingCostsByVendor: shippingCostsByVendor ? JSON.stringify(shippingCostsByVendor) : '',
          },
          // OXXO specific settings
          payment_method_options: {
            oxxo: {
              expires_after_days: 3, // OXXO voucher expires in 3 days
            },
          },
          locale: 'es', // Spanish for Mexico
        });

        return NextResponse.json({
          sessionId: session.id,
          url: session.url
        });
      }
    } catch (stripeError: any) {
      console.error('Stripe session creation error:', {
        type: stripeError.type,
        message: stripeError.message,
        code: stripeError.code,
        detail: stripeError.detail,
        raw: stripeError.raw,
      });

      // If it's a connection error, it might be due to invalid API key
      if (stripeError.type === 'StripeConnectionError') {
        console.error('Stripe connection error - check STRIPE_SECRET_KEY for invalid characters');
      }

      throw stripeError;
    }
  } catch (error: any) {
    console.error('Checkout session error:', error);

    // Provide more detailed error message
    const errorMessage = error.type === 'StripeConnectionError'
      ? 'Failed to connect to Stripe. Please check your API configuration.'
      : error.message || 'Error creating checkout session';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}