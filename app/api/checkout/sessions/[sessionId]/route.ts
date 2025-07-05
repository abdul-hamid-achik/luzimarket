import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer"],
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Check if this was a guest checkout
    const isGuest = session.metadata?.isGuest === 'true';

    // Get order details if available
    let orderInfo = null;
    let allOrderNumbers = [];
    if (session.metadata?.orderIds) {
      const orderIds = session.metadata.orderIds.split(',');
      
      // Fetch all orders
      const ordersData = await db.query.orders.findMany({
        where: (orders, { inArray }) => inArray(orders.id, orderIds),
      });
      
      if (ordersData.length > 0) {
        // Get all order numbers
        allOrderNumbers = ordersData.map(o => o.orderNumber);
        
        // Use first order for guest info
        orderInfo = {
          orderNumber: ordersData[0].orderNumber,
          guestEmail: ordersData[0].guestEmail,
          guestName: ordersData[0].guestName,
        };
      }
    }

    // Return relevant order details
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      customerEmail: session.customer_details?.email || session.customer_email || orderInfo?.guestEmail,
      customerName: session.customer_details?.name || orderInfo?.guestName,
      amount: session.amount_total,
      currency: session.currency,
      paymentStatus: session.payment_status,
      isGuest,
      orderNumber: orderInfo?.orderNumber,
      orderNumbers: allOrderNumbers, // All order numbers for multi-vendor orders
      metadata: session.metadata,
      lineItems: session.line_items?.data.map((item) => ({
        name: item.description,
        quantity: item.quantity,
        amount: item.amount_total,
      })),
    });
  } catch (error) {
    console.error("Error retrieving checkout session:", error);
    return NextResponse.json(
      { error: "Failed to retrieve session details" },
      { status: 500 }
    );
  }
}