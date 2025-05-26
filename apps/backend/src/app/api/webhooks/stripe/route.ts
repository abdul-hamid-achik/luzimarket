import { NextRequest, NextResponse } from 'next/server';
import { dbService, eq } from '@/db/service';
import { orders } from '@/db/schema';
import fs from 'fs';
import path from 'path';

// Import Stripe - you'll need to install this: npm install stripe
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = STRIPE_SECRET_KEY ? require('stripe')(STRIPE_SECRET_KEY) : null;

// Get webhook secret - prioritize test secret for local development
function getWebhookSecret(): string | null {
    // 1. Check for CI environment with static test secret
    if (process.env.CI === 'true' && process.env.STRIPE_WEBHOOK_SECRET) {
        console.log('🔑 Using CI static webhook secret for testing');
        return process.env.STRIPE_WEBHOOK_SECRET;
    }

    // 2. Check for test secret from Stripe CLI (for local testing)
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
        // Try environment variable first
        if (process.env.STRIPE_WEBHOOK_SECRET_TEST) {
            return process.env.STRIPE_WEBHOOK_SECRET_TEST;
        }

        // Try reading from file (written by Playwright config)
        try {
            const secretPath = path.join(process.cwd(), '../../tmp/stripe-webhook-secret.txt');
            if (fs.existsSync(secretPath)) {
                const secret = fs.readFileSync(secretPath, 'utf8').trim();
                if (secret) {
                    console.log('🔑 Using Stripe CLI webhook secret for testing');
                    return secret;
                }
            }
        } catch (error: unknown) {
            console.warn('Could not read Stripe CLI webhook secret file:', (error as Error).message);
        }
    }

    // 3. Fall back to production webhook secret
    const productionSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (productionSecret) {
        console.log('🔑 Using production webhook secret');
        return productionSecret;
    }

    return null;
}

export async function POST(request: NextRequest) {
    if (!stripe) {
        return NextResponse.json(
            { error: 'Stripe not configured' },
            { status: 503 }
        );
    }

    try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature');

        if (!signature) {
            console.error('Missing Stripe signature');
            return NextResponse.json({ error: 'Webhook Error: Missing Stripe signature' }, { status: 400 });
        }

        const webhookSecret = getWebhookSecret();

        let event;

        // Handle test environment with test signatures
        const isTestEnvironment = process.env.NODE_ENV === 'test' ||
            process.env.DATABASE_URL?.includes('tmp/');

        if (isTestEnvironment) {
            if (signature === 'test_signature') {
                // In test environment, 'test_signature' should be rejected for validation testing
                console.error('Test mode: test_signature should be rejected for validation testing');
                return NextResponse.json({ error: 'Webhook Error: Invalid signature in test mode' }, { status: 400 });
            }

            if (signature === 'invalid_signature' || !signature.includes('t=') || !signature.includes('v1=')) {
                // Handle invalid signature formats in test mode
                console.error('Test mode: Invalid signature format received');
                return NextResponse.json({ error: 'Webhook Error: Invalid signature format' }, { status: 400 });
            }
        }

        // Production/real webhook verification
        if (!webhookSecret) {
            console.error('Webhook secret not configured');
            return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
        }

        try {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                webhookSecret
            );
        } catch (err) {
            console.error('Webhook signature verification failed:', err);
            return NextResponse.json({ error: 'Webhook Error: Invalid signature' }, { status: 400 });
        }

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentIntentSucceeded(event.data.object);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentIntentFailed(event.data.object);
                break;

            case 'payment_intent.created':
                await handlePaymentIntentCreated(event.data.object);
                break;

            case 'charge.succeeded':
                await handleChargeSucceeded(event.data.object);
                break;

            case 'charge.failed':
                await handleChargeFailed(event.data.object);
                break;

            case 'charge.dispute.created':
                await handleChargeDisputeCreated(event.data.object);
                break;

            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object);
                break;

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object);
                break;

            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}

// Handler functions for different event types
async function handlePaymentIntentSucceeded(paymentIntent: any) {
    console.log('💰 Payment succeeded:', paymentIntent.id);

    // Extract order ID from metadata (you'll need to set this when creating the payment intent)
    const orderId = paymentIntent.metadata?.order_id;

    if (orderId) {
        try {
            // Update order status to 'paid' or 'processing'
            const updateData: any = {
                status: 'processing',
                payment_status: 'succeeded',
                payment_intent_id: paymentIntent.id,
                updatedAt: new Date(),
            };

            // Only include stripe_customer_id if it has a valid value
            if (paymentIntent.customer && paymentIntent.customer.trim() !== '') {
                updateData.stripe_customer_id = paymentIntent.customer;
            }

            await dbService.update(orders, updateData, eq(orders.id, orderId));

            console.log(`✅ Order ${orderId} updated to processing status`);
        } catch (error) {
            console.error('❌ Error updating order:', error);
            throw error;
        }
    } else {
        console.warn('⚠️ No order ID found in payment intent metadata');
    }
}

async function handlePaymentIntentFailed(paymentIntent: any) {
    console.log('❌ Payment failed:', paymentIntent.id);

    const orderId = paymentIntent.metadata?.order_id;

    if (orderId) {
        try {
            const updateData: any = {
                status: 'payment_failed',
                payment_status: 'failed',
                payment_intent_id: paymentIntent.id,
                updatedAt: new Date(),
            };

            // Only include stripe_customer_id if it has a valid value
            if (paymentIntent.customer && paymentIntent.customer.trim() !== '') {
                updateData.stripe_customer_id = paymentIntent.customer;
            }

            await dbService.update(orders, updateData, eq(orders.id, orderId));

            console.log(`✅ Order ${orderId} marked as payment failed`);
        } catch (error) {
            console.error('❌ Error updating failed order:', error);
            throw error;
        }
    }
}

async function handlePaymentIntentCreated(paymentIntent: any) {
    console.log('🆕 Payment intent created:', paymentIntent.id);

    const orderId = paymentIntent.metadata?.order_id;

    if (orderId) {
        try {
            await dbService.update(orders, {
                payment_intent_id: paymentIntent.id,
                payment_status: 'processing',
                updatedAt: new Date(),
            }, eq(orders.id, orderId));

            console.log(`✅ Order ${orderId} linked to payment intent`);
        } catch (error) {
            console.error('❌ Error linking payment intent to order:', error);
            throw error;
        }
    }
}

async function handleChargeSucceeded(charge: any) {
    console.log('💳 Charge succeeded:', charge.id);

    // Additional charge-specific logic can go here
    // This event fires after payment_intent.succeeded for most payment methods
}

async function handleChargeFailed(charge: any) {
    console.log('💳 Charge failed:', charge.id);

    // Additional charge failure logic can go here
}

async function handleChargeDisputeCreated(dispute: any) {
    console.log('Charge dispute created:', dispute.id);

    // You might want to add a disputes table or flag orders with disputes
    // const chargeId = dispute.charge;

    // Additional logic:
    // - Notify admin team
    // - Flag order for review
    // - Gather evidence for dispute response
}

async function handleInvoicePaymentSucceeded(invoice: any) {
    console.log('Invoice payment succeeded:', invoice.id);

    // Handle subscription or recurring payment success
    // const customerId = invoice.customer;

    // Additional logic for subscription orders
}

async function handleInvoicePaymentFailed(invoice: any) {
    console.log('Invoice payment failed:', invoice.id);

    // Handle subscription payment failure
    // const customerId = invoice.customer;

    // Additional logic:
    // - Retry payment
    // - Notify customer
    // - Update subscription status
}

async function handleSubscriptionCreated(subscription: any) {
    console.log('Subscription created:', subscription.id);

    // Handle new subscription
    // const customerId = subscription.customer;

    // Additional logic:
    // - Create subscription record
    // - Send welcome email
}

async function handleSubscriptionUpdated(subscription: any) {
    console.log('Subscription updated:', subscription.id);

    // Handle subscription changes
    // const customerId = subscription.customer;

    // Additional logic:
    // - Update subscription record
    // - Handle plan changes
}

async function handleSubscriptionDeleted(subscription: any) {
    console.log('Subscription deleted:', subscription.id);

    // Handle subscription cancellation
    // const customerId = subscription.customer;

    // Additional logic:
    // - Update subscription status
    // - Send cancellation confirmation
} 