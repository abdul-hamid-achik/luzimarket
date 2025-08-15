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

// Intentionally no console logging of key metadata to keep logs clean

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

// Stripe Connect functions
export async function createConnectedAccount({
  email,
  country = 'MX',
  type = 'express' as const,
  capabilities = {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
}: {
  email: string;
  country?: string;
  type?: 'express' | 'standard' | 'custom';
  capabilities?: Stripe.AccountCreateParams.Capabilities;
}) {
  try {
    const account = await stripe.accounts.create({
      type,
      country,
      email,
      capabilities,
      settings: {
        payouts: {
          schedule: {
            interval: 'daily' as const,
          },
        },
      },
    });

    return account;
  } catch (error) {
    console.error('Error creating connected account:', error);
    throw error;
  }
}

export async function createAccountLink({
  accountId,
  refreshUrl,
  returnUrl,
  type = 'account_onboarding' as const,
}: {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
  type?: 'account_onboarding' | 'account_update';
}) {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type,
    });

    return accountLink;
  } catch (error) {
    console.error('Error creating account link:', error);
    throw error;
  }
}

export async function retrieveAccount(accountId: string) {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    return account;
  } catch (error) {
    console.error('Error retrieving account:', error);
    throw error;
  }
}

export async function createPaymentIntentWithConnect({
  amount,
  vendorId,
  vendorStripeAccountId,
  applicationFeeAmount,
  metadata = {},
}: {
  amount: number;
  vendorId: string;
  vendorStripeAccountId: string;
  applicationFeeAmount: number;
  metadata?: Record<string, string>;
}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'mxn',
      application_fee_amount: Math.round(applicationFeeAmount * 100), // Platform fee in cents
      transfer_data: {
        destination: vendorStripeAccountId,
      },
      metadata: {
        vendorId,
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent with connect:', error);
    throw error;
  }
}

export async function createTransfer({
  amount,
  destination,
  transferGroup,
  metadata = {},
}: {
  amount: number;
  destination: string;
  transferGroup?: string;
  metadata?: Record<string, string>;
}) {
  try {
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'mxn',
      destination,
      transfer_group: transferGroup,
      metadata,
    });

    return transfer;
  } catch (error) {
    console.error('Error creating transfer:', error);
    throw error;
  }
}

export async function getBalance(connectedAccountId?: string) {
  try {
    const options = connectedAccountId
      ? { stripeAccount: connectedAccountId }
      : undefined;

    const balance = await stripe.balance.retrieve(options as any);
    return balance;
  } catch (error) {
    console.error('Error getting balance:', error);
    throw error;
  }
}

export async function createPayout({
  amount,
  connectedAccountId,
  metadata = {},
}: {
  amount: number;
  connectedAccountId: string;
  metadata?: Record<string, string>;
}) {
  try {
    const payout = await stripe.payouts.create(
      {
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'mxn',
        metadata,
      },
      {
        stripeAccount: connectedAccountId,
      }
    );

    return payout;
  } catch (error) {
    console.error('Error creating payout:', error);
    throw error;
  }
}

export async function getAccountLoginLink(connectedAccountId: string) {
  try {
    const loginLink = await stripe.accounts.createLoginLink(connectedAccountId);
    return loginLink;
  } catch (error) {
    console.error('Error creating login link:', error);
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

// Webhook signature verification
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
) {
  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Error constructing webhook event:', error);
    throw error;
  }
}