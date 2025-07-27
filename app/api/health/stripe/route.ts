export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET() {
  try {
    // Check if Stripe key is properly configured
    const keyInfo = {
      hasKey: !!process.env.STRIPE_SECRET_KEY,
      keyLength: process.env.STRIPE_SECRET_KEY?.length || 0,
      keyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7) || 'missing',
      hasWhitespace: process.env.STRIPE_SECRET_KEY !== process.env.STRIPE_SECRET_KEY?.trim(),
      environment: process.env.NODE_ENV,
    };

    // Try to make a simple Stripe API call to test connectivity
    let stripeConnected = false;
    let stripeError = null;
    
    try {
      // This is a read-only operation that doesn't affect anything
      const paymentMethods = await stripe.paymentMethods.list({ limit: 1 });
      stripeConnected = true;
    } catch (error: any) {
      stripeError = {
        type: error.type,
        message: error.message,
        code: error.code,
      };
    }

    return NextResponse.json({
      status: stripeConnected ? 'healthy' : 'unhealthy',
      stripe: {
        connected: stripeConnected,
        error: stripeError,
        keyInfo,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}