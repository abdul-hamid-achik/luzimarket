"use server";

import { db } from "@/db";
import { vendors, vendorStripeAccounts, vendorBalances, transactions, payouts, platformFees, vendorBankAccounts } from "@/db/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { createConnectedAccount, createAccountLink, retrieveAccount, getBalance, createPayout, getAccountLoginLink } from "@/lib/stripe";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { 
  stripeRequirementsSchema, 
  stripeCapabilitiesSchema, 
  stripeBusinessProfileSchema,
  type ApiResponse
} from "@/lib/types/api";

// Schema for creating Stripe Connect account
const createStripeAccountSchema = z.object({
  vendorId: z.string().uuid(),
  email: z.string().email(),
  businessName: z.string(),
  country: z.string().default("MX"),
  type: z.enum(["express", "standard", "custom"]).default("express"),
});

// Schema for creating account link
const createAccountLinkSchema = z.object({
  vendorId: z.string().uuid(),
  refreshUrl: z.string().url(),
  returnUrl: z.string().url(),
});

// Schema for updating account status
const updateAccountStatusSchema = z.object({
  vendorId: z.string().uuid(),
});

// Schema for creating payout
const createPayoutSchema = z.object({
  vendorId: z.string().uuid(),
  amount: z.number().positive(),
});

// Create Stripe Connect account for vendor
export async function createVendorStripeAccount(input: z.infer<typeof createStripeAccountSchema>) {
  try {
    const validatedInput = createStripeAccountSchema.parse(input);
    
    // Check if vendor already has a Stripe account
    const existingAccount = await db.query.vendorStripeAccounts.findFirst({
      where: eq(vendorStripeAccounts.vendorId, validatedInput.vendorId),
    });

    if (existingAccount) {
      return {
        success: false,
        error: "Vendor already has a Stripe Connect account",
      };
    }

    // Create Stripe Connect account
    const stripeAccount = await createConnectedAccount({
      email: validatedInput.email,
      country: validatedInput.country,
      type: validatedInput.type,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
        ...(validatedInput.country === "MX" && {
          oxxo_payments: { requested: true },
        }),
      },
    });

    // Save Stripe account to database
    await db.transaction(async (tx) => {
      // Parse and validate Stripe data with schemas
      const requirements = stripeRequirementsSchema.parse(stripeAccount.requirements || {});
      
      const capabilities = stripeCapabilitiesSchema.parse(stripeAccount.capabilities || {});
      
      const businessProfile = stripeBusinessProfileSchema.parse(stripeAccount.business_profile || {});

      // Create vendor Stripe account record
      await tx.insert(vendorStripeAccounts).values({
        vendorId: validatedInput.vendorId,
        stripeAccountId: stripeAccount.id,
        accountType: validatedInput.type,
        onboardingStatus: "pending",
        chargesEnabled: stripeAccount.charges_enabled || false,
        payoutsEnabled: stripeAccount.payouts_enabled || false,
        detailsSubmitted: stripeAccount.details_submitted || false,
        requirements,
        capabilities,
        businessProfile,
      });

      // Create vendor balance record
      await tx.insert(vendorBalances).values({
        vendorId: validatedInput.vendorId,
        availableBalance: "0",
        pendingBalance: "0",
        reservedBalance: "0",
        currency: "MXN",
      });
    });

    revalidatePath("/vendor");

    return {
      success: true,
      data: {
        stripeAccountId: stripeAccount.id,
      },
    };
  } catch (error) {
    console.error("Error creating Stripe account:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create Stripe account",
    };
  }
}

// Create Stripe Connect onboarding link
export async function createVendorOnboardingLink(input: z.infer<typeof createAccountLinkSchema>) {
  try {
    const validatedInput = createAccountLinkSchema.parse(input);
    
    // Get vendor's Stripe account
    const vendorAccount = await db.query.vendorStripeAccounts.findFirst({
      where: eq(vendorStripeAccounts.vendorId, validatedInput.vendorId),
    });

    if (!vendorAccount) {
      return {
        success: false,
        error: "Vendor does not have a Stripe Connect account",
      };
    }

    // Create account link
    const accountLink = await createAccountLink({
      accountId: vendorAccount.stripeAccountId,
      refreshUrl: validatedInput.refreshUrl,
      returnUrl: validatedInput.returnUrl,
      type: "account_onboarding",
    });

    // Update onboarding status
    await db
      .update(vendorStripeAccounts)
      .set({
        onboardingStatus: "in_progress",
        updatedAt: new Date(),
      })
      .where(eq(vendorStripeAccounts.vendorId, validatedInput.vendorId));

    return {
      success: true,
      data: {
        url: accountLink.url,
      },
    };
  } catch (error) {
    console.error("Error creating onboarding link:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create onboarding link",
    };
  }
}

// Update vendor Stripe account status
export async function updateVendorStripeAccountStatus(input: z.infer<typeof updateAccountStatusSchema>) {
  try {
    const validatedInput = updateAccountStatusSchema.parse(input);
    
    // Get vendor's Stripe account
    const vendorAccount = await db.query.vendorStripeAccounts.findFirst({
      where: eq(vendorStripeAccounts.vendorId, validatedInput.vendorId),
    });

    if (!vendorAccount) {
      return {
        success: false,
        error: "Vendor does not have a Stripe Connect account",
      };
    }

    // Retrieve latest account status from Stripe
    const stripeAccount = await retrieveAccount(vendorAccount.stripeAccountId);

    // Parse and validate Stripe data with schemas
    const requirements = stripeRequirementsSchema.parse(stripeAccount.requirements || {});
    
    const capabilities = stripeCapabilitiesSchema.parse(stripeAccount.capabilities || {});
    
    const businessProfile = stripeBusinessProfileSchema.parse(stripeAccount.business_profile || {});

    // Update account status in database
    await db
      .update(vendorStripeAccounts)
      .set({
        chargesEnabled: stripeAccount.charges_enabled || false,
        payoutsEnabled: stripeAccount.payouts_enabled || false,
        detailsSubmitted: stripeAccount.details_submitted || false,
        requirements,
        capabilities,
        businessProfile,
        onboardingStatus: stripeAccount.details_submitted ? "completed" : "in_progress",
        updatedAt: new Date(),
      })
      .where(eq(vendorStripeAccounts.vendorId, validatedInput.vendorId));

    revalidatePath("/vendor");

    return {
      success: true,
      data: {
        chargesEnabled: stripeAccount.charges_enabled || false,
        payoutsEnabled: stripeAccount.payouts_enabled || false,
        detailsSubmitted: stripeAccount.details_submitted || false,
      },
    };
  } catch (error) {
    console.error("Error updating account status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update account status",
    };
  }
}

// Get vendor balance
export async function getVendorBalance(vendorId: string) {
  try {
    const balance = await db.query.vendorBalances.findFirst({
      where: eq(vendorBalances.vendorId, vendorId),
    });

    if (!balance) {
      return {
        success: false,
        error: "Vendor balance not found",
      };
    }

    // Get Stripe balance for real-time data
    const vendorAccount = await db.query.vendorStripeAccounts.findFirst({
      where: eq(vendorStripeAccounts.vendorId, vendorId),
    });

    let stripeBalance = null;
    if (vendorAccount?.stripeAccountId) {
      try {
        stripeBalance = await getBalance(vendorAccount.stripeAccountId);
      } catch (error) {
        console.error("Error fetching Stripe balance:", error);
      }
    }

    return {
      success: true,
      data: {
        balance,
        stripeBalance,
      },
    };
  } catch (error) {
    console.error("Error getting vendor balance:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get vendor balance",
    };
  }
}

// Get vendor transactions
export async function getVendorTransactions(
  vendorId: string,
  options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    type?: string;
    status?: string;
  }
) {
  try {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    let query = db
      .select()
      .from(transactions)
      .where(eq(transactions.vendorId, vendorId))
      .$dynamic();

    if (options?.startDate) {
      query = query.where(gte(transactions.createdAt, options.startDate));
    }

    if (options?.endDate) {
      query = query.where(lte(transactions.createdAt, options.endDate));
    }

    if (options?.type) {
      query = query.where(eq(transactions.type, options.type));
    }

    if (options?.status) {
      query = query.where(eq(transactions.status, options.status));
    }

    const [transactionList, totalCount] = await Promise.all([
      query
        .orderBy(desc(transactions.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(eq(transactions.vendorId, vendorId)),
    ]);

    return {
      success: true,
      data: {
        transactions: transactionList,
        total: totalCount[0]?.count || 0,
        limit,
        offset,
      },
    };
  } catch (error) {
    console.error("Error getting vendor transactions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get vendor transactions",
    };
  }
}

// Get vendor payouts
export async function getVendorPayouts(
  vendorId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }
) {
  try {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    let query = db
      .select()
      .from(payouts)
      .where(eq(payouts.vendorId, vendorId))
      .$dynamic();

    if (options?.status) {
      query = query.where(eq(payouts.status, options.status));
    }

    const [payoutList, totalCount] = await Promise.all([
      query
        .orderBy(desc(payouts.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(payouts)
        .where(eq(payouts.vendorId, vendorId)),
    ]);

    return {
      success: true,
      data: {
        payouts: payoutList,
        total: totalCount[0]?.count || 0,
        limit,
        offset,
      },
    };
  } catch (error) {
    console.error("Error getting vendor payouts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get vendor payouts",
    };
  }
}

// Create manual payout
export async function createManualPayout(input: z.infer<typeof createPayoutSchema>) {
  try {
    const validatedInput = createPayoutSchema.parse(input);
    
    // Get vendor's Stripe account and balance
    const [vendorAccount, balance] = await Promise.all([
      db.query.vendorStripeAccounts.findFirst({
        where: eq(vendorStripeAccounts.vendorId, validatedInput.vendorId),
      }),
      db.query.vendorBalances.findFirst({
        where: eq(vendorBalances.vendorId, validatedInput.vendorId),
      }),
    ]);

    if (!vendorAccount || !balance) {
      return {
        success: false,
        error: "Vendor account or balance not found",
      };
    }

    // Check if vendor has sufficient balance
    const availableBalance = parseFloat(balance.availableBalance);
    if (availableBalance < validatedInput.amount) {
      return {
        success: false,
        error: "Insufficient balance for payout",
      };
    }

    // Create Stripe payout
    const stripePayout = await createPayout({
      amount: validatedInput.amount,
      connectedAccountId: vendorAccount.stripeAccountId,
      metadata: {
        vendorId: validatedInput.vendorId,
      },
    });

    // Record payout in database
    await db.transaction(async (tx) => {
      // Create payout record
      await tx.insert(payouts).values({
        vendorId: validatedInput.vendorId,
        amount: validatedInput.amount.toString(),
        currency: "MXN",
        status: "processing",
        method: "bank_transfer",
        stripePayoutId: stripePayout.id,
        arrivalDate: stripePayout.arrival_date ? new Date(stripePayout.arrival_date * 1000) : undefined,
      });

      // Update vendor balance
      await tx
        .update(vendorBalances)
        .set({
          availableBalance: (availableBalance - validatedInput.amount).toString(),
          lastUpdated: new Date(),
        })
        .where(eq(vendorBalances.vendorId, validatedInput.vendorId));

      // Create transaction record
      await tx.insert(transactions).values({
        vendorId: validatedInput.vendorId,
        type: "payout",
        amount: (-validatedInput.amount).toString(), // Negative for payout
        currency: "MXN",
        status: "completed",
        description: `Manual payout - ${stripePayout.id}`,
        metadata: {
          stripePayoutId: stripePayout.id,
        },
        balanceTransaction: {
          before: {
            available: availableBalance,
            pending: parseFloat(balance.pendingBalance),
            reserved: parseFloat(balance.reservedBalance),
          },
          after: {
            available: availableBalance - validatedInput.amount,
            pending: parseFloat(balance.pendingBalance),
            reserved: parseFloat(balance.reservedBalance),
          },
        },
      });
    });

    revalidatePath("/vendor");

    return {
      success: true,
      data: {
        payoutId: stripePayout.id,
      },
    };
  } catch (error) {
    console.error("Error creating payout:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create payout",
    };
  }
}

// Get Stripe Connect dashboard link
export async function getVendorStripeDashboardLink(vendorId: string) {
  try {
    // Get vendor's Stripe account
    const vendorAccount = await db.query.vendorStripeAccounts.findFirst({
      where: eq(vendorStripeAccounts.vendorId, vendorId),
    });

    if (!vendorAccount) {
      return {
        success: false,
        error: "Vendor does not have a Stripe Connect account",
      };
    }

    // Create login link
    const loginLink = await getAccountLoginLink(vendorAccount.stripeAccountId);

    return {
      success: true,
      data: {
        url: loginLink.url,
      },
    };
  } catch (error) {
    console.error("Error creating dashboard link:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create dashboard link",
    };
  }
}

// Get vendor Stripe account details
export async function getVendorStripeAccount(vendorId: string) {
  try {
    const account = await db.query.vendorStripeAccounts.findFirst({
      where: eq(vendorStripeAccounts.vendorId, vendorId),
      with: {
        vendor: true,
      },
    });

    if (!account) {
      return {
        success: false,
        error: "Vendor does not have a Stripe Connect account",
      };
    }

    return {
      success: true,
      data: account,
    };
  } catch (error) {
    console.error("Error getting vendor Stripe account:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get vendor Stripe account",
    };
  }
}