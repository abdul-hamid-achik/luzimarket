import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { validateCartStock, type CartItem } from "@/lib/actions/inventory";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, shippingAddress, billingAddress, isGuest, selectedShipping } = body;

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
    const tax = subtotal * 0.16; // 16% IVA
    
    // Use selected shipping or default
    let shipping = 99; // Default fallback
    let shippingDescription = '📦 Envío estándar en México';
    let shippingDays = { min: 3, max: 5 };
    
    if (selectedShipping && selectedShipping.total !== undefined) {
      shipping = selectedShipping.total;
      // Get the first shipping option details for display
      if (selectedShipping.options && selectedShipping.options.length > 0) {
        const firstOption = selectedShipping.options[0].option;
        shippingDescription = firstOption.name || shippingDescription;
        shippingDays = firstOption.estimatedDays || shippingDays;
      }
    }
    
    const total = subtotal + tax + shipping;

    // Create line items for Stripe
    const lineItems = [
      ...items.map((item: any) => ({
        price_data: {
          currency: 'mxn',
          product_data: {
            name: item.name,
            images: item.image && item.image.startsWith('/') 
              ? [`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${item.image}`]
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
    const orderNumber = `LM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // For multi-vendor orders, we'll create separate orders per vendor
    const vendorGroups = items.reduce((groups: any, item: any) => {
      const vendorId = item.vendorId;
      if (!groups[vendorId]) {
        groups[vendorId] = [];
      }
      groups[vendorId].push(item);
      return groups;
    }, {});

    const orderIds: string[] = [];
    
    // Create orders for each vendor
    for (const [vendorId, vendorItems] of Object.entries(vendorGroups)) {
      const vendorSubtotal = (vendorItems as any[]).reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const vendorTax = vendorSubtotal * 0.16;
      const vendorShipping = vendorSubtotal > 1000 ? 0 : 99;
      const vendorTotal = vendorSubtotal + vendorTax + vendorShipping;

      const [order] = await db.insert(orders).values({
        orderNumber: `${orderNumber}-${vendorId.slice(-4)}`,
        vendorId: vendorId,
        status: "pending",
        subtotal: vendorSubtotal.toString(),
        tax: vendorTax.toString(),
        shipping: vendorShipping.toString(),
        total: vendorTotal.toString(),
        currency: "MXN",
        // Guest order fields
        ...(isGuest ? {
          guestEmail: shippingAddress.email,
          guestName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          guestPhone: shippingAddress.phone,
        } : {}),
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
      }).returning({ id: orders.id });

      // Create order items
      const orderItemsData = (vendorItems as any[]).map(item => ({
        orderId: order.id,
        productId: item.id,
        quantity: item.quantity,
        price: item.price.toString(),
        total: (item.price * item.quantity).toString(),
      }));

      await db.insert(orderItems).values(orderItemsData);
      orderIds.push(order.id);
    }

    // Create Stripe checkout session
    try {
      const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'oxxo'], // Support OXXO for Mexico
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
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