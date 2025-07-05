import Stripe from 'stripe';

// Sanitize the API key to remove any whitespace or newline characters
const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

// Validate the API key format (should start with sk_)
if (!stripeSecretKey.startsWith('sk_')) {
  console.error('Invalid STRIPE_SECRET_KEY format - should start with sk_');
  throw new Error('Invalid STRIPE_SECRET_KEY format');
}

// Log key info for debugging (without exposing the actual key)
if (process.env.NODE_ENV === 'development') {
  console.log('Stripe key validation:', {
    length: stripeSecretKey.length,
    prefix: stripeSecretKey.substring(0, 7),
    suffix: '...',
    hasWhitespace: stripeSecretKey !== stripeSecretKey.trim(),
    hasNewlines: stripeSecretKey.includes('\n') || stripeSecretKey.includes('\r'),
  });
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-05-28.basil' as const,
  typescript: true,
});

export async function createPaymentIntent(amount: number, vendorId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'mxn',
      metadata: {
        vendorId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

export async function createStripeCustomer(email: string, name: string) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
    });

    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
}

export async function createSubscription(customerId: string, priceId: string) {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}