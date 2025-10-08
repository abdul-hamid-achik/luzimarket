import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderNumber } = body;

        if (!orderNumber) {
            return NextResponse.json(
                { error: "Order number is required" },
                { status: 400 }
            );
        }

        // Fetch the order
        const order = await db.query.orders.findFirst({
            where: eq(orders.orderNumber, orderNumber),
            with: {
                items: {
                    with: {
                        product: true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Check if order is already paid
        if (order.paymentStatus === "succeeded") {
            return NextResponse.json(
                { error: "Order has already been paid" },
                { status: 400 }
            );
        }

        // Check if the payment failed (not just pending)
        if (order.paymentStatus !== "failed") {
            return NextResponse.json(
                { error: "Order payment is still pending" },
                { status: 400 }
            );
        }

        // Create a new Stripe checkout session for this order
        const lineItems = order.items.map((item) => ({
            price_data: {
                currency: order.currency.toLowerCase(),
                product_data: {
                    name: item.product.name,
                    images: item.product.images && item.product.images.length > 0
                        ? [item.product.images[0]]
                        : [],
                },
                unit_amount: Math.round(parseFloat(item.price) * 100),
            },
            quantity: item.quantity,
        }));

        // Add shipping as a line item if present
        if (order.shipping && parseFloat(order.shipping) > 0) {
            lineItems.push({
                price_data: {
                    currency: order.currency.toLowerCase(),
                    product_data: {
                        name: "Shipping",
                        images: [],
                    },
                    unit_amount: Math.round(parseFloat(order.shipping) * 100),
                },
                quantity: 1,
            });
        }

        // Add tax as a line item if present
        if (order.tax && parseFloat(order.tax) > 0) {
            lineItems.push({
                price_data: {
                    currency: order.currency.toLowerCase(),
                    product_data: {
                        name: "Tax",
                        images: [],
                    },
                    unit_amount: Math.round(parseFloat(order.tax) * 100),
                },
                quantity: 1,
            });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?order_id=${order.orderNumber}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
            metadata: {
                orderId: order.id,
                orderNumber: order.orderNumber,
                isRetry: "true",
            },
            customer_email: order.guestEmail || undefined,
        });

        // Update the order with the new payment intent
        await db
            .update(orders)
            .set({
                paymentIntentId: session.payment_intent as string,
                paymentStatus: "pending",
                updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id));

        return NextResponse.json({
            success: true,
            sessionId: session.id,
            url: session.url,
        });
    } catch (error: any) {
        console.error("Error creating retry checkout session:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create retry session" },
            { status: 500 }
        );
    }
}

// GET endpoint to fetch order details for retry page
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderNumber = searchParams.get("orderNumber");

        if (!orderNumber) {
            return NextResponse.json(
                { error: "Order number is required" },
                { status: 400 }
            );
        }

        const order = await db.query.orders.findFirst({
            where: eq(orders.orderNumber, orderNumber),
            with: {
                items: {
                    with: {
                        product: true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            order: {
                orderNumber: order.orderNumber,
                total: order.total,
                subtotal: order.subtotal,
                tax: order.tax,
                shipping: order.shipping,
                currency: order.currency,
                paymentStatus: order.paymentStatus,
                items: order.items.map(item => ({
                    name: item.product.name,
                    quantity: item.quantity,
                    price: item.price,
                    image: item.product.images && item.product.images.length > 0
                        ? item.product.images[0]
                        : null,
                })),
            },
        });
    } catch (error: any) {
        console.error("Error fetching order for retry:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch order" },
            { status: 500 }
        );
    }
}
