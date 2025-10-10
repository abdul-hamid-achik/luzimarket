"use server";

import { db } from "@/db";
import { orders, vendorBalances, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { restoreStock } from "@/lib/actions/inventory";
import { AuditLogger } from "@/lib/middleware/security";
import { logOrderEvent } from "@/lib/audit-helpers";

/**
 * Refund Service
 * Handles manual refund approval workflow for e-commerce orders
 */

/**
 * Request a refund (customer initiates)
 * Updates order to request cancellation - requires vendor approval
 */
export async function requestRefund(
    orderId: string,
    reason: string,
    requestedBy?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const order = await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
        });

        if (!order) {
            return { success: false, error: "Orden no encontrada" };
        }

        // Check if order can be cancelled
        if (['shipped', 'delivered', 'cancelled', 'refunded'].includes(order.status)) {
            return {
                success: false,
                error: `No se puede cancelar una orden con estado: ${order.status}`,
            };
        }

        // Update order to request cancellation
        await db
            .update(orders)
            .set({
                cancellationStatus: "requested",
                cancellationReason: reason,
                cancelledBy: requestedBy || null,
                updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

        // Log cancellation request
        await logOrderEvent({
            action: 'cancellation_requested',
            orderId: order.id,
            orderNumber: order.orderNumber,
            userId: order.userId,
            userEmail: order.guestEmail || undefined,
            vendorId: order.vendorId,
            details: {
                reason,
                requestedBy,
            },
        });

        // TODO: Send notification to vendor about cancellation request

        return { success: true, message: "Solicitud de cancelación enviada al vendedor" };
    } catch (error) {
        console.error('Error requesting refund:', error);
        return { success: false, error: "Error al solicitar la cancelación" };
    }
}

/**
 * Approve refund (vendor/admin approves)
 * Processes Stripe refund and updates all related records
 */
export async function approveRefund(
    orderId: string,
    approvedBy: string,
    approvalNotes?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const order = await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
            with: {
                vendor: true,
            },
        });

        if (!order) {
            return { success: false, error: "Orden no encontrada" };
        }

        if (order.cancellationStatus !== 'requested') {
            return { success: false, error: "No hay solicitud de cancelación pendiente" };
        }

        // Process Stripe refund if payment exists
        let refundId: string | null = null;
        if (order.paymentIntentId) {
            try {
                const refund = await stripe.refunds.create({
                    payment_intent: order.paymentIntentId,
                    amount: Math.round(Number(order.total) * 100), // Full refund in cents
                    reason: 'requested_by_customer',
                    metadata: {
                        orderId: order.id,
                        orderNumber: order.orderNumber,
                        approvedBy,
                    },
                });

                refundId = refund.id;
            } catch (stripeError) {
                console.error('Stripe refund failed:', stripeError);
                return {
                    success: false,
                    error: "Error al procesar el reembolso con Stripe",
                };
            }
        }

        // Update order status
        await db
            .update(orders)
            .set({
                status: "refunded",
                paymentStatus: "refunded",
                cancellationStatus: "approved",
                cancelledAt: new Date(),
                refundId: refundId,
                refundStatus: "pending",
                notes: approvalNotes || order.notes,
                updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

        // Restore stock
        await restoreStock(orderId);

        // Reverse vendor balance (subtract the amount)
        await reverseVendorBalance(order.vendorId, parseFloat(order.total), orderId, order.orderNumber, refundId);

        // Log refund approval
        await logOrderEvent({
            action: 'refund_approved',
            orderId: order.id,
            orderNumber: order.orderNumber,
            userId: order.userId,
            userEmail: order.guestEmail || undefined,
            vendorId: order.vendorId,
            details: {
                approvedBy,
                approvalNotes,
                refundId,
                amount: order.total,
            },
        });

        // TODO: Send refund approved email to customer
        // TODO: Send refund notification to vendor

        return {
            success: true,
            message: `Reembolso aprobado. ID: ${refundId || 'N/A'}`,
        };
    } catch (error) {
        console.error('Error approving refund:', error);
        return { success: false, error: "Error al aprobar el reembolso" };
    }
}

/**
 * Reject refund request (vendor/admin rejects)
 */
export async function rejectRefund(
    orderId: string,
    rejectedBy: string,
    rejectionReason: string
): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const order = await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
        });

        if (!order) {
            return { success: false, error: "Orden no encontrada" };
        }

        if (order.cancellationStatus !== 'requested') {
            return { success: false, error: "No hay solicitud de cancelación pendiente" };
        }

        // Update order
        await db
            .update(orders)
            .set({
                cancellationStatus: "rejected",
                notes: `Cancelación rechazada: ${rejectionReason}`,
                updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

        // Log rejection
        await logOrderEvent({
            action: 'refund_rejected',
            orderId: order.id,
            orderNumber: order.orderNumber,
            userId: order.userId,
            userEmail: order.guestEmail || undefined,
            vendorId: order.vendorId,
            details: {
                rejectedBy,
                rejectionReason,
            },
        });

        // TODO: Send rejection email to customer

        return { success: true, message: "Solicitud de cancelación rechazada" };
    } catch (error) {
        console.error('Error rejecting refund:', error);
        return { success: false, error: "Error al rechazar la cancelación" };
    }
}

/**
 * Process refund webhook from Stripe (confirmation)
 */
export async function processRefundWebhook(refundId: string): Promise<void> {
    try {
        // Find order by refund ID
        const order = await db.query.orders.findFirst({
            where: eq(orders.refundId, refundId),
        });

        if (!order) {
            console.log(`No order found for refund ${refundId}`);
            return;
        }

        // Update refund status to succeeded
        await db
            .update(orders)
            .set({
                refundStatus: "succeeded",
                refundedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id));

        // Update transaction status
        await db
            .update(transactions)
            .set({
                status: "completed",
                completedAt: new Date(),
            })
            .where(eq(transactions.stripeRefundId, refundId));

        // TODO: Send refund completed email

    } catch (error) {
        console.error('Error processing refund webhook:', error);
    }
}

/**
 * Handle failed refund from Stripe
 */
export async function handleRefundFailure(
    refundId: string,
    failureReason?: string | null
): Promise<void> {
    try {
        const order = await db.query.orders.findFirst({
            where: eq(orders.refundId, refundId),
        });

        if (!order) {
            console.log(`No order found for failed refund ${refundId}`);
            return;
        }

        // Update refund status
        await db
            .update(orders)
            .set({
                refundStatus: "failed",
                notes: `Reembolso fallido: ${failureReason || 'Razón desconocida'}`,
                updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id));

        // Log failure
        await AuditLogger.log({
            action: "refund.failed",
            category: "payment",
            severity: "error",
            userId: order.userId || undefined,
            userType: order.userId ? "user" : "guest",
            userEmail: order.guestEmail || undefined,
            ip: "stripe-webhook",
            resourceType: "order",
            resourceId: order.id,
            details: {
                refundId,
                failureReason,
            },
            errorMessage: failureReason || undefined,
        });

        // TODO: Notify admin of refund failure

    } catch (error) {
        console.error('Error handling refund failure:', error);
    }
}

/**
 * Reverse vendor balance when refund is processed
 */
async function reverseVendorBalance(
    vendorId: string,
    refundAmount: number,
    orderId: string,
    orderNumber: string,
    refundId: string | null
): Promise<void> {
    try {
        const vendorBalance = await db.query.vendorBalances.findFirst({
            where: eq(vendorBalances.vendorId, vendorId),
        });

        if (!vendorBalance) {
            console.error(`Vendor balance not found for vendor ${vendorId}`);
            return;
        }

        const newAvailableBalance = parseFloat(vendorBalance.availableBalance) - refundAmount;

        await db
            .update(vendorBalances)
            .set({
                availableBalance: newAvailableBalance.toString(),
                lastUpdated: new Date(),
            })
            .where(eq(vendorBalances.vendorId, vendorId));

        // Create refund transaction record
        await db.insert(transactions).values({
            vendorId: vendorId,
            orderId: orderId,
            type: "refund",
            amount: (-refundAmount).toString(), // Negative amount for refund
            currency: "MXN",
            status: "pending",
            description: `Reembolso - Orden #${orderNumber}`,
            metadata: {
                orderNumber: orderNumber,
                refundId: refundId,
            },
            stripeRefundId: refundId,
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
        });
    } catch (error) {
        console.error('Error reversing vendor balance:', error);
    }
}

