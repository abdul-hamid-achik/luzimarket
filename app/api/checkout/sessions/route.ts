import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, shippingAddress, billingAddress, paymentMethod } = body;

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

    // Add shipping if applicable
    if (shipping > 0) {
      lineItems.push({
        price_data: {
          currency: 'mxn',
          product_data: {
            name: 'Envío',
          },
          unit_amount: Math.round(shipping * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'oxxo'], // Support OXXO for Mexico
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
      customer_email: shippingAddress.email,
      shipping_address_collection: {
        allowed_countries: ['MX'],
      },
      metadata: {
        customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        customerPhone: shippingAddress.phone || '',
        shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : '',
        billingAddress: billingAddress ? JSON.stringify(billingAddress) : '',
        paymentMethod: paymentMethod || 'card',
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