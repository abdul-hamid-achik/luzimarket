"use server";

import { db } from "@/db";
import { payouts, vendorBalances, vendors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AuditLogger } from "@/lib/middleware/security";
import { sendPayoutCompletedEmail, sendPayoutFailedEmail } from "@/lib/services/email-service";

/**
 * Payout Service
 * Tracks vendor payout status and sends notifications
 */

/**
 * Sync payout status from Stripe webhook
 */
export async function syncPayoutStatus(
    stripePayoutId: string,
    status: 'pending' | 'paid' | 'failed' | 'canceled'
): Promise<void> {
    try {
        // Find payout record
        const payout = await db.query.payouts.findFirst({
            where: eq(payouts.stripePayoutId, stripePayoutId),
        });

        if (!payout) {
            console.log(`No payout record found for Stripe payout ${stripePayoutId}`);
            return;
        }

        // Map Stripe status to our status
        const mappedStatus = status === 'paid' ? 'completed' : status;

        // Update payout status
        await db
            .update(payouts)
            .set({
                status: mappedStatus,
                paidAt: status === 'paid' ? new Date() : undefined,
                failureReason: status === 'failed' ? 'Payout failed' : undefined,
            })
            .where(eq(payouts.id, payout.id));

        // Log payout status change
        await AuditLogger.log({
            action: `payout.${status}`,
            category: "payout",
            severity: status === 'failed' ? 'warning' : 'info',
            userId: undefined,
            userType: "system",
            ip: "stripe-webhook",
            resourceType: "payout",
            resourceId: payout.id,
            details: {
                stripePayoutId,
                vendorId: payout.vendorId,
                amount: payout.amount,
                status: mappedStatus,
            },
        });

    } catch (error) {
        console.error('Error syncing payout status:', error);
    }
}

/**
 * Notify vendor when payout is completed
 */
export async function notifyPayoutCompleted(
    vendorId: string,
    amount: number
): Promise<void> {
    try {
        const vendor = await db.query.vendors.findFirst({
            where: eq(vendors.id, vendorId),
        });

        if (!vendor?.email) {
            console.log(`No vendor found or email missing for vendor ${vendorId}`);
            return;
        }

        await sendPayoutCompletedEmail(
            { email: vendor.email, businessName: vendor.businessName },
            amount
        );
    } catch (error) {
        console.error('Error sending payout notification:', error);
    }
}

/**
 * Handle payout failure and notify vendor
 */
export async function handlePayoutFailure(
    stripePayoutId: string,
    failureMessage?: string | null
): Promise<void> {
    try {
        const payout = await db.query.payouts.findFirst({
            where: eq(payouts.stripePayoutId, stripePayoutId),
            with: {
                vendor: true,
            },
        });

        if (!payout) {
            console.log(`No payout record found for Stripe payout ${stripePayoutId}`);
            return;
        }

        // Send failure notification to vendor
        if (payout.vendor?.email) {
            await sendPayoutFailedEmail(
                { email: payout.vendor.email, businessName: payout.vendor.businessName },
                Number(payout.amount),
                failureMessage || undefined
            );
        }

        // Log payout failure
        await AuditLogger.log({
            action: "payout.failed",
            category: "payout",
            severity: "error",
            userId: undefined,
            userType: "system",
            ip: "stripe-webhook",
            resourceType: "payout",
            resourceId: payout.id,
            details: {
                stripePayoutId,
                vendorId: payout.vendorId,
                amount: payout.amount,
                failureMessage,
            },
            errorMessage: failureMessage || undefined,
        });

    } catch (error) {
        console.error('Error handling payout failure:', error);
    }
}

/**
 * Reverse vendor balance (for refunds)
 */
async function reverseVendorBalance(
    vendorId: string,
    amount: number,
    orderId: string,
    orderNumber: string,
    refundId: string | null
): Promise<void> {
    const vendorBalance = await db.query.vendorBalances.findFirst({
        where: eq(vendorBalances.vendorId, vendorId),
    });

    if (!vendorBalance) {
        console.error(`Vendor balance not found for vendor ${vendorId}`);
        return;
    }

    const newAvailableBalance = parseFloat(vendorBalance.availableBalance) - amount;

    await db
        .update(vendorBalances)
        .set({
            availableBalance: newAvailableBalance.toString(),
            lastUpdated: new Date(),
        })
        .where(eq(vendorBalances.vendorId, vendorId));
}

