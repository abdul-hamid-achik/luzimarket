import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { orders, users, platformFees, vendorStripeAccounts, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { processOrderPayment, handlePaymentFailure, logPaymentSuccess } from "@/lib/services/payment-service";
import { processRefundWebhook, handleRefundFailure } from "@/lib/services/refund-service";
import { syncPayoutStatus, notifyPayoutCompleted, handlePayoutFailure } from "@/lib/services/payout-service";
import { reduceStock } from "@/lib/actions/inventory";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Handle multiple orders from metadata
        const orderIds = session.metadata?.orderIds?.split(',') || [];

        if (orderIds.length > 0) {
          // Process each order using payment service
          for (const orderId of orderIds) {
            await processOrderPayment({
              orderId,
              paymentIntentId: session.payment_intent as string,
              sessionId: session.id,
              customerEmail: session.customer_details?.email || undefined,
              customerName: session.customer_details?.name || undefined,
            });
          }

          // Handle Stripe Connect transfers for multi-vendor orders
          if (session.metadata?.useStripeConnect === 'true' && session.metadata?.vendorSplits) {
            try {
              const vendorSplits = JSON.parse(session.metadata.vendorSplits);
              const paymentIntentId = session.payment_intent as string;

              // Retrieve the payment intent to get the charge ID
              const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
              const chargeId = paymentIntent.latest_charge as string;

              // Create transfers to each vendor
              for (const split of vendorSplits) {
                try {
                  const transfer = await stripe.transfers.create({
                    amount: Math.round(split.amount * 100), // Convert to cents
                    currency: 'mxn',
                    destination: split.stripeAccountId,
                    source_transaction: chargeId,
                    description: `Pago por orden ${split.orderId}`,
                    metadata: {
                      orderId: split.orderId,
                      vendorId: split.vendorId,
                    },
                  });

                  // Update platform fee status to transferred
                  await db
                    .update(platformFees)
                    .set({
                      status: 'transferred',
                      stripeTransferId: transfer.id,
                      transferredAt: new Date(),
                    })
                    .where(eq(platformFees.orderId, split.orderId));

                } catch (transferError) {
                  console.error(`Failed to create transfer for vendor ${split.vendorId}:`, transferError);
                  // Continue with other transfers even if one fails
                }
              }
            } catch (error) {
              console.error('Error processing vendor splits:', error);
            }
          }
        }

        // Handle legacy single order metadata for backward compatibility
        if (session.metadata?.orderId && !session.metadata?.orderIds) {
          await db
            .update(orders)
            .set({
              status: "processing",
              paymentStatus: "succeeded",
              paymentIntentId: session.payment_intent as string,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, session.metadata.orderId));

          await reduceStock(session.metadata.orderId);
        }

        // Create/update customer if needed
        if (session.customer && session.customer_details?.email) {
          const existingUser = await db.query.users.findFirst({
            where: eq(users.email, session.customer_details.email),
          });

          if (existingUser && !existingUser.stripeCustomerId) {
            await db
              .update(users)
              .set({
                stripeCustomerId: session.customer as string,
              })
              .where(eq(users.id, existingUser.id));
          }
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await logPaymentSuccess(paymentIntent.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        const order = await db.query.orders.findFirst({
          where: eq(orders.paymentIntentId, paymentIntent.id),
        });

        if (order) {
          await handlePaymentFailure(order.id, paymentIntent.last_payment_error);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        // Process refund from charge object
        if (charge.refunds && charge.refunds.data.length > 0) {
          const refund = charge.refunds.data[0];
          await processRefundWebhook(refund.id);
        }
        break;
      }

      case "refund.created": {
        const refund = event.data.object as Stripe.Refund;

        // Find order by payment intent
        const paymentIntent = await stripe.paymentIntents.retrieve(refund.payment_intent as string);
        const order = await db.query.orders.findFirst({
          where: eq(orders.paymentIntentId, paymentIntent.id),
        });

        if (order) {
          // Create refund transaction record
          await db.insert(transactions).values({
            vendorId: order.vendorId,
            orderId: order.id,
            type: "refund",
            amount: (-(refund.amount / 100)).toString(), // Negative for refund
            currency: refund.currency.toUpperCase(),
            status: "pending",
            description: `Reembolso iniciado - Orden #${order.orderNumber}`,
            stripeRefundId: refund.id,
            metadata: {
              orderNumber: order.orderNumber,
              paymentIntentId: paymentIntent.id,
              reason: refund.reason,
            },
          });
        }
        break;
      }

      case "refund.updated": {
        const refund = event.data.object as Stripe.Refund;

        // Update transaction status
        await db
          .update(transactions)
          .set({
            status: refund.status === "succeeded" ? "completed" : refund.status === "failed" ? "failed" : "pending",
            completedAt: refund.status === "succeeded" ? new Date() : undefined,
          })
          .where(eq(transactions.stripeRefundId, refund.id));
        break;
      }

      case "refund.failed": {
        const refund = event.data.object as Stripe.Refund;
        await handleRefundFailure(refund.id, refund.failure_reason);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        // Handle subscription updates
        const user = await db.query.users.findFirst({
          where: eq(users.stripeCustomerId, subscription.customer as string),
        });

        if (user) {
          // Update user subscription status
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // Handle subscription cancellation
        const user = await db.query.users.findFirst({
          where: eq(users.stripeCustomerId, subscription.customer as string),
        });

        if (user) {
          // Update user subscription status
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        // Handle successful invoice payment
        if ((invoice as any).subscription && (invoice as any).billing_reason === "subscription_cycle") {
          // Optional: update any subscription bookkeeping
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        // Handle failed invoice payment
        if ((invoice as any).subscription) {
          // Send payment failed email for subscription
          const customer = await db.query.users.findFirst({
            where: eq(users.stripeCustomerId, invoice.customer as string),
          });

          if (customer) {
            // Note: For subscription failures, you might want a different email template
          }
        }
        break;
      }

      // Stripe Connect specific events
      case "account.updated": {
        const account = event.data.object as Stripe.Account;

        // Update vendor Stripe account status
        const vendorAccount = await db.query.vendorStripeAccounts.findFirst({
          where: eq(vendorStripeAccounts.stripeAccountId, account.id),
        });

        if (vendorAccount) {
          await db
            .update(vendorStripeAccounts)
            .set({
              chargesEnabled: account.charges_enabled || false,
              payoutsEnabled: account.payouts_enabled || false,
              detailsSubmitted: account.details_submitted || false,
              requirements: account.requirements as any,
              capabilities: account.capabilities as any,
              businessProfile: account.business_profile as any,
              onboardingStatus: account.details_submitted ? "completed" : "in_progress",
              updatedAt: new Date(),
            })
            .where(eq(vendorStripeAccounts.stripeAccountId, account.id));
        }
        break;
      }

      case "application_fee.created": {
        const fee = event.data.object as Stripe.ApplicationFee;
        // No-op for now
        break;
      }

      case "transfer.created": {
        const transfer = event.data.object as Stripe.Transfer;

        // Update transaction record with transfer details
        if (transfer.metadata?.orderId && transfer.metadata?.vendorId) {
          // Create or update transaction record for the transfer
          await db.insert(transactions).values({
            vendorId: transfer.metadata.vendorId,
            orderId: transfer.metadata.orderId,
            type: "transfer",
            amount: (transfer.amount / 100).toString(), // Convert from cents
            currency: transfer.currency.toUpperCase(),
            status: "pending",
            description: `Transferencia de Stripe - ${transfer.id}`,
            stripeTransferId: transfer.id,
            metadata: {
              destination: transfer.destination,
              sourceTransaction: transfer.source_transaction,
            },
          });
        }
        break;
      }

      case "transfer.updated": {
        const transfer = event.data.object as Stripe.Transfer;

        // Update transaction status based on transfer status
        if (transfer.metadata?.orderId) {
          const status = transfer.reversed ? "reversed" : "completed";

          await db
            .update(transactions)
            .set({
              status,
              completedAt: new Date(),
            })
            .where(eq(transactions.stripeTransferId, transfer.id));
        }
        break;
      }

      case "payout.created":
      case "payout.updated": {
        const payout = event.data.object as Stripe.Payout;

        // Sync payout status
        const status = payout.status as 'pending' | 'paid' | 'failed' | 'canceled';
        await syncPayoutStatus(payout.id, status);
        break;
      }

      case "payout.paid": {
        const payout = event.data.object as Stripe.Payout;

        // Mark payout as completed and notify vendor
        await syncPayoutStatus(payout.id, "paid");

        // Notify vendor of successful payout
        if (payout.metadata?.vendorId) {
          await notifyPayoutCompleted(
            payout.metadata.vendorId,
            payout.amount / 100
          );
        }
        break;
      }

      case "payout.failed": {
        const payout = event.data.object as Stripe.Payout;

        // Handle failed payout
        await syncPayoutStatus(payout.id, "failed");
        await handlePayoutFailure(payout.id, payout.failure_message);
        break;
      }

      // Add minimal handling for frequent Stripe Connect events to avoid noisy logs
      case "account.application.authorized": {
        // No action needed; authorization granted for the Connect application
        break;
      }

      case "capability.updated": {
        const capability = event.data.object as Stripe.Capability;
        // When capabilities update, fetch the account and sync high-level fields
        try {
          const accountId = capability.account as string;
          const account = await stripe.accounts.retrieve(accountId);
          const vendorAccount = await db.query.vendorStripeAccounts.findFirst({
            where: eq(vendorStripeAccounts.stripeAccountId, account.id),
          });
          if (vendorAccount) {
            await db
              .update(vendorStripeAccounts)
              .set({
                chargesEnabled: account.charges_enabled || false,
                payoutsEnabled: account.payouts_enabled || false,
                capabilities: account.capabilities as any,
                updatedAt: new Date(),
              })
              .where(eq(vendorStripeAccounts.stripeAccountId, account.id));
          }
        } catch (e) {
          // Swallow to avoid webhook failure
        }
        break;
      }

      default:
      // Ignore unhandled events silently to keep logs clean
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// Stripe webhooks require the raw body
export const config = {
  api: {
    bodyParser: false,
  },
};