"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { payouts, vendorBalances, transactions, vendors, vendorStripeAccounts } from "@/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { z } from "zod";

const requestPayoutSchema = z.object({
  vendorId: z.string().uuid(),
  amount: z.number().positive(),
});

export async function requestPayout(data: z.infer<typeof requestPayoutSchema>) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "vendor") {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = requestPayoutSchema.parse(data);

    // Verify vendor owns this account
    if (session.user.id !== validatedData.vendorId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get vendor balance
    const [balance] = await db
      .select()
      .from(vendorBalances)
      .where(eq(vendorBalances.vendorId, validatedData.vendorId));

    if (!balance) {
      return { success: false, error: "Balance not found" };
    }

    // Check if amount is available
    const availableBalance = parseFloat(balance.availableBalance);
    if (validatedData.amount > availableBalance) {
      return { success: false, error: "Insufficient available balance" };
    }

    // Get vendor Stripe account
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, validatedData.vendorId));

    if (!vendor) {
      return { success: false, error: "Vendor not found" };
    }

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Create payout record
      const [payout] = await tx
        .insert(payouts)
        .values({
          vendorId: validatedData.vendorId,
          amount: validatedData.amount.toString(),
          currency: "MXN",
          status: "pending",
          method: "bank_transfer",
        })
        .returning();

      // Update vendor balance
      const newAvailableBalance = availableBalance - validatedData.amount;
      const newReservedBalance = parseFloat(balance.reservedBalance) + validatedData.amount;

      await tx
        .update(vendorBalances)
        .set({
          availableBalance: newAvailableBalance.toString(),
          reservedBalance: newReservedBalance.toString(),
          lastUpdated: new Date(),
        })
        .where(eq(vendorBalances.vendorId, validatedData.vendorId));

      // Create transaction record
      await tx.insert(transactions).values({
        vendorId: validatedData.vendorId,
        type: "payout",
        amount: validatedData.amount.toString(),
        currency: "MXN",
        status: "pending",
        description: `Payout request #${payout.id.slice(-8)}`,
        metadata: { payoutId: payout.id },
        balanceTransaction: {
          before: {
            available: availableBalance,
            pending: parseFloat(balance.pendingBalance),
            reserved: parseFloat(balance.reservedBalance),
          },
          after: {
            available: newAvailableBalance,
            pending: parseFloat(balance.pendingBalance),
            reserved: newReservedBalance,
          },
        },
      });

      return payout;
    });

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Payout request error:", error);
    return { success: false, error: error.message || "Failed to request payout" };
  }
}

export async function getPayoutRequests(vendorId: string) {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    // Allow vendors to see their own payouts, admins to see all
    if (session.user.role === "vendor" && session.user.id !== vendorId) {
      return { success: false, error: "Unauthorized" };
    }

    const payoutsList = await db
      .select()
      .from(payouts)
      .where(eq(payouts.vendorId, vendorId))
      .orderBy(desc(payouts.createdAt));

    return { success: true, data: payoutsList };
  } catch (error: any) {
    console.error("Get payouts error:", error);
    return { success: false, error: error.message || "Failed to get payouts" };
  }
}

export async function processPayoutRequest(payoutId: string) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    // Get payout details
    const [payout] = await db
      .select({
        payout: payouts,
        vendor: vendors,
      })
      .from(payouts)
      .leftJoin(vendors, eq(payouts.vendorId, vendors.id))
      .where(eq(payouts.id, payoutId));

    if (!payout) {
      return { success: false, error: "Payout not found" };
    }

    if (payout.payout.status !== "pending") {
      return { success: false, error: "Payout already processed" };
    }

    // Get vendor's Stripe account ID from the vendorStripeAccounts table
    const [vendorStripeAccount] = await db
      .select()
      .from(vendorStripeAccounts)
      .where(eq(vendorStripeAccounts.vendorId, payout.payout.vendorId));

    if (!vendorStripeAccount || !vendorStripeAccount.stripeAccountId) {
      return { success: false, error: "Vendor Stripe account not found" };
    }

    try {
      // Create Stripe payout
      const stripePayout = await stripe.payouts.create(
        {
          amount: Math.round(parseFloat(payout.payout.amount) * 100), // Convert to cents
          currency: "mxn",
          description: `Payout for vendor ${payout.vendor?.businessName}`,
          metadata: {
            payoutId: payout.payout.id,
            vendorId: payout.payout.vendorId,
          },
        },
        {
          stripeAccount: vendorStripeAccount.stripeAccountId,
        }
      );

      // Update payout status
      await db.transaction(async (tx) => {
        await tx
          .update(payouts)
          .set({
            status: "processing",
            stripePayoutId: stripePayout.id,
            processedAt: new Date(),
          })
          .where(eq(payouts.id, payoutId));

        // Update transaction status
        await tx
          .update(transactions)
          .set({
            status: "processing",
          })
          .where(eq(transactions.metadata, { payoutId }));
      });

      return { success: true, data: stripePayout };
    } catch (stripeError: any) {
      console.error("Stripe payout error:", stripeError);
      
      // Update payout as failed
      await db
        .update(payouts)
        .set({
          status: "failed",
          failureReason: stripeError.message,
        })
        .where(eq(payouts.id, payoutId));

      return { success: false, error: stripeError.message };
    }
  } catch (error: any) {
    console.error("Process payout error:", error);
    return { success: false, error: error.message || "Failed to process payout" };
  }
}

export async function getMinimumPayoutAmount() {
  // Stripe minimum payout for Mexico is 10 MXN
  return 10;
}

export async function getPayoutFee() {
  // Platform can charge a fee for payouts if desired
  return 0; // No fee for now
}