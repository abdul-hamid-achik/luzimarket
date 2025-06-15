import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { orders, orderItems, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get("stripe-signature")!;

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
        
        // Update order status to paid
        if (session.metadata?.orderId) {
          await db
            .update(orders)
            .set({
              status: "processing",
              stripePaymentIntentId: session.payment_intent as string,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, session.metadata.orderId));

          // TODO: Send order confirmation email
          console.log("Order paid:", session.metadata.orderId);
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
        console.log("Payment succeeded:", paymentIntent.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update order status to failed
        const order = await db.query.orders.findFirst({
          where: eq(orders.stripePaymentIntentId, paymentIntent.id),
        });

        if (order) {
          await db
            .update(orders)
            .set({
              status: "cancelled",
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id));

          // TODO: Send payment failed email
          console.log("Payment failed for order:", order.id);
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
        if (invoice.subscription && invoice.billing_reason === "subscription_cycle") {
          console.log("Subscription invoice paid:", invoice.id);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Handle failed invoice payment
        if (invoice.subscription) {
          console.log("Subscription invoice payment failed:", invoice.id);
          // TODO: Send payment failed email
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
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