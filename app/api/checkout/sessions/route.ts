import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { validateCartStock, type CartItem } from "@/lib/actions/inventory";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, shippingAddress, billingAddress } = body;

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
        `${error.productName}: solicitado ${error.requestedQuantity}, disponible ${error.availableStock}`
      ).join('; ');
      
      return NextResponse.json(
        { 
          error: 'Stock insuficiente',
          details: errorMessages,
          stockErrors: stockValidation.errors
        },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.16; // 16% IVA
    const shipping = subtotal > 1000 ? 0 : 99;
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
            display_name: 'Envío estándar',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 3,
              },
              maximum: {
                unit: 'business_day',
                value: 5,
              },
            },
          },
        },
      ],
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ['MX'],
      },
      // Pre-fill customer information
      customer_creation: 'if_required',
      payment_intent_data: {
        description: 'Compra en Luzimarket',
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
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
}