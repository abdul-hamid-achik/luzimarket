"use server";

import { db } from "@/db";
import { orders, vendorBalances, transactions, platformFees } from "@/db/schema";
import { eq } from "drizzle-orm";
import { reduceStock, restoreStock } from "@/lib/actions/inventory";
import { sendOrderConfirmation, sendVendorNotification } from "@/lib/email";
import { sendPaymentFailedEmail } from "@/lib/email/payment-failed";
import { AuditLogger } from "@/lib/middleware/security";
import { logOrderEvent } from "@/lib/audit-helpers";
import Stripe from "stripe";

/**
 * Payment Service
 * Centralizes payment processing logic to eliminate duplication between
 * webhook handlers and checkout flows
 */

interface ProcessPaymentOptions {
    orderId: string;
    paymentIntentId: string;
    sessionId?: string;
    customerEmail?: string;
    customerName?: string;
}

/**
 * Process successful order payment
 * Called from: checkout.session.completed webhook
 */
export async function processOrderPayment(options: ProcessPaymentOptions): Promise<boolean> {
    const { orderId, paymentIntentId, sessionId, customerEmail, customerName } = options;

    try {
        // Fetch order with all details
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

        if (!order) {
            console.error(`Order ${orderId} not found for payment processing`);
            return false;
        }

        // 1. Update order status
        await db
            .update(orders)
            .set({
                status: "processing",
                paymentStatus: "succeeded",
                paymentIntentId: paymentIntentId,
                updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

        // 2. Handle vendor balance & platform fees (if Stripe Connect)
        const platformFee = await db.query.platformFees.findFirst({
            where: eq(platformFees.orderId, orderId),
        });

        if (platformFee) {
            await syncVendorBalance(
                order.vendorId,
                parseFloat(platformFee.vendorEarnings),
                orderId,
                order.orderNumber,
                paymentIntentId
            );

            // Update platform fee status
            await db
                .update(platformFees)
                .set({
                    status: "collected",
                    stripeApplicationFeeId: paymentIntentId,
                    collectedAt: new Date(),
                })
                .where(eq(platformFees.orderId, orderId));
        }

        // 3. Reduce stock
        const stockReduced = await reduceStock(orderId);
        if (!stockReduced) {
            console.error(`Failed to reduce stock for order ${orderId}`);
            // Continue processing - this will be caught in inventory reconciliation
        }

        // 4. Send email notifications
        await sendPaymentNotifications(order, customerEmail, customerName);

        // 5. Log order payment completion
        await logOrderEvent({
            action: 'payment_completed',
            orderId: order.id,
            orderNumber: order.orderNumber,
            userId: order.userId,
            userEmail: order.guestEmail || undefined,
            vendorId: order.vendorId,
            details: {
                sessionId: sessionId || paymentIntentId,
                paymentIntentId: paymentIntentId,
                amount: order.total,
                currency: order.currency,
            },
        });

        return true;
    } catch (error) {
        console.error('Error processing order payment:', error);
        return false;
    }
}

/**
 * Sync vendor balance after successful payment
 */
async function syncVendorBalance(
    vendorId: string,
    earningsAmount: number,
    orderId: string,
    orderNumber: string,
    paymentIntentId: string
): Promise<void> {
    const vendorBalance = await db.query.vendorBalances.findFirst({
        where: eq(vendorBalances.vendorId, vendorId),
    });

    if (!vendorBalance) {
        console.error(`Vendor balance not found for vendor ${vendorId}`);
        return;
    }

    const newAvailableBalance = parseFloat(vendorBalance.availableBalance) + earningsAmount;

    await db
        .update(vendorBalances)
        .set({
            availableBalance: newAvailableBalance.toString(),
            lastUpdated: new Date(),
        })
        .where(eq(vendorBalances.vendorId, vendorId));

    // Create transaction record
    await db.insert(transactions).values({
        vendorId: vendorId,
        orderId: orderId,
        type: "sale",
        amount: earningsAmount.toString(),
        currency: "MXN",
        status: "completed",
        description: `Venta - Orden #${orderNumber}`,
        metadata: {
            orderNumber: orderNumber,
            paymentIntentId: paymentIntentId,
        },
        stripeChargeId: paymentIntentId,
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
}

/**
 * Send payment confirmation emails to customer and vendor
 */
async function sendPaymentNotifications(
    order: any,
    customerEmail?: string,
    customerName?: string
): Promise<void> {
    try {
        const email = customerEmail || order.guestEmail;
        const name = customerName || order.guestName || 'Cliente';

        if (email) {
            // Send customer confirmation
            await sendOrderConfirmation({
                orderNumber: order.orderNumber,
                customerEmail: email,
                customerName: name,
                items: order.items.map((item: any) => ({
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
                    customerName: name,
                    items: order.items.map((item: any) => ({
                        name: item.product?.name || 'Producto',
                        quantity: item.quantity,
                        price: parseFloat(item.price),
                    })),
                    total: parseFloat(order.total),
                    shippingAddress: order.shippingAddress as any,
                });
            }
        }
    } catch (error) {
        console.error('Failed to send payment notifications:', error);
        // Don't throw - email failures shouldn't fail payment processing
    }
}

/**
 * Handle payment failure
 * Called from: payment_intent.payment_failed webhook
 */
export async function handlePaymentFailure(
    orderId: string,
    error?: Stripe.PaymentIntent.LastPaymentError | null
): Promise<boolean> {
    try {
        const order = await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
        });

        if (!order) {
            console.error(`Order ${orderId} not found for payment failure handling`);
            return false;
        }

        // 1. Update order status
        await db
            .update(orders)
            .set({
                status: "cancelled",
                paymentStatus: "failed",
                updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

        // 2. Restore stock since payment failed
        await restoreStock(orderId);

        // 3. Log payment failure
        await AuditLogger.log({
            action: "payment.failed",
            category: "payment",
            severity: "warning",
            userId: order.userId || undefined,
            userType: order.userId ? "user" : "guest",
            userEmail: order.guestEmail || undefined,
            ip: "stripe-webhook",
            resourceType: "order",
            resourceId: order.id,
            details: {
                orderNumber: order.orderNumber,
                amount: parseFloat(order.total),
                currency: order.currency,
                failureCode: error?.code,
                failureMessage: error?.message,
            },
            errorMessage: error?.message,
        });

        // 4. Send payment failed email
        await sendPaymentFailedEmail({ orderId: order.id });

        return true;
    } catch (err) {
        console.error('Error handling payment failure:', err);
        return false;
    }
}

/**
 * Log successful payment intent (for audit trail)
 */
export async function logPaymentSuccess(paymentIntentId: string): Promise<void> {
    try {
        const order = await db.query.orders.findFirst({
            where: eq(orders.paymentIntentId, paymentIntentId),
        });

        if (order) {
            await AuditLogger.log({
                action: "payment.succeeded",
                category: "payment",
                severity: "info",
                userId: order.userId || undefined,
                userType: order.userId ? "user" : "guest",
                userEmail: order.guestEmail || undefined,
                ip: "stripe-webhook",
                resourceType: "order",
                resourceId: order.id,
                details: {
                    orderNumber: order.orderNumber,
                    paymentIntentId: paymentIntentId,
                },
            });
        }
    } catch (error) {
        console.error('Error logging payment success:', error);
    }
}

