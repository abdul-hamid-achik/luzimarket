import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { orders, orderItems, users, vendorBalances, transactions, platformFees, vendorStripeAccounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Stripe from "stripe";
import { reduceStock, restoreStock } from "@/lib/actions/inventory";
import { sendOrderConfirmation, sendVendorNotification } from "@/lib/email";
import { sendPaymentFailedEmail } from "@/lib/email/payment-failed";

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
          // Update all orders to processing status
          for (const orderId of orderIds) {
            // Fetch order details
            const order = await db.query.orders.findFirst({
              where: eq(orders.id, orderId),
              with: {
                items: {
                  with: {
                    product: true,
                  },
                },
                vendor: true,
              },
            });

            if (!order) continue;

            await db
              .update(orders)
              .set({
                status: "processing",
                paymentStatus: "succeeded",
                paymentIntentId: session.payment_intent as string,
                updatedAt: new Date(),
              })
              .where(eq(orders.id, orderId));

            // Update vendor balance and create transaction if using Stripe Connect
            const platformFee = await db.query.platformFees.findFirst({
              where: eq(platformFees.orderId, orderId),
            });

            if (platformFee) {
              // Update vendor balance
              const vendorBalance = await db.query.vendorBalances.findFirst({
                where: eq(vendorBalances.vendorId, order.vendorId),
              });

              if (vendorBalance) {
                const newAvailableBalance = parseFloat(vendorBalance.availableBalance) + parseFloat(platformFee.vendorEarnings);

                await db
                  .update(vendorBalances)
                  .set({
                    availableBalance: newAvailableBalance.toString(),
                    lastUpdated: new Date(),
                  })
                  .where(eq(vendorBalances.vendorId, order.vendorId));

                // Create transaction record
                await db.insert(transactions).values({
                  vendorId: order.vendorId,
                  orderId: orderId,
                  type: "sale",
                  amount: platformFee.vendorEarnings,
                  currency: "MXN",
                  status: "completed",
                  description: `Venta - Orden #${order.orderNumber}`,
                  metadata: {
                    orderNumber: order.orderNumber,
                    paymentIntentId: session.payment_intent,
                  },
                  stripeChargeId: session.payment_intent as string,
                  balanceTransaction: {
                    before: {
                      available: parseFloat(vendorBalance.availableBalance),
                      pending: parseFloat(vendorBalance.pendingBalance),
                      reserved: parseFloat(vendorBalance.reservedBalance),
                    },
                    after: {
                      available: newAvailableBalance,
                      pending: parseFloat(vendorBalance.pendingBalance),
                      reserved: parseFloat(vendorBalance.reservedBalance),
                    },
                  },
                  completedAt: new Date(),
                });

                // Update platform fee status
                await db
                  .update(platformFees)
                  .set({
                    status: "collected",
                    stripeApplicationFeeId: session.payment_intent as string,
                    collectedAt: new Date(),
                  })
                  .where(eq(platformFees.orderId, orderId));
              }
            }

            // Reduce stock for each order
            const stockReduced = await reduceStock(orderId);
            if (!stockReduced) {
              console.error(`Failed to reduce stock for order ${orderId}`);
              // In a production system, you might want to handle this more gracefully
              // For now, we'll log the error but continue processing
            }

            // Send confirmation emails
            try {
              const customerEmail = order.guestEmail || session.customer_details?.email;
              const customerName = order.guestName || session.customer_details?.name || 'Cliente';

              if (customerEmail) {
                // Send customer confirmation
                await sendOrderConfirmation({
                  orderNumber: order.orderNumber,
                  customerEmail,
                  customerName,
                  items: order.items.map(item => ({
                    name: item.product?.name || 'Producto',
                    quantity: item.quantity,
                    price: parseFloat(item.price),
                  })),
                  total: parseFloat(order.total),
                  vendorName: order.vendor?.businessName || 'Vendedor',
                });

                // Send vendor notification
                if (order.vendor?.email) {
                  await sendVendorNotification({
                    vendorEmail: order.vendor.email,
                    vendorName: order.vendor.businessName || 'Vendedor',
                    orderNumber: order.orderNumber,
                    customerName,
                    items: order.items.map(item => ({
                      name: item.product?.name || 'Producto',
                      quantity: item.quantity,
                      price: parseFloat(item.price),
                    })),
                    total: parseFloat(order.total),
                    shippingAddress: order.shippingAddress as any,
                  });
                }
              }
            } catch (emailError) {
              console.error(`Failed to send confirmation emails for order ${orderId}:`, emailError);
            }

            console.log(`Order ${orderId} processed successfully`);
          }

          console.log("Orders paid:", orderIds.join(', '));

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

                  console.log(`Transfer created for vendor ${split.vendorId}: ${transfer.id}`);

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
          console.log("Legacy order paid:", session.metadata.orderId);
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
        // Optional: persist minimal audit log if needed in the future
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Update order status to failed
        const order = await db.query.orders.findFirst({
          where: eq(orders.paymentIntentId, paymentIntent.id),
        });

        if (order) {
          await db
            .update(orders)
            .set({
              status: "cancelled",
              paymentStatus: "failed",
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id));

          // Restore stock since payment failed
          await restoreStock(order.id);

          // Send payment failed email
          await sendPaymentFailedEmail({ orderId: order.id });
          console.log("Payment failed email sent for order:", order.id);
        }
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
          console.log("Subscription updated for user:", user.id);
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
          console.log("Subscription cancelled for user:", user.id);
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
            console.log("Subscription payment failed for user:", customer.id);
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

          console.log(`Vendor account ${account.id} updated`);
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

        // Handle payout status updates
        // No-op for now
        break;
      }

      case "payout.paid": {
        const payout = event.data.object as Stripe.Payout;

        // Mark payout as completed
        // No-op for now
        break;
      }

      case "payout.failed": {
        const payout = event.data.object as Stripe.Payout;

        // Handle failed payout
        // No-op for now
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