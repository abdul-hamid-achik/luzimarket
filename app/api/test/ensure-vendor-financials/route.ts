import { NextResponse } from "next/server";
import { db } from "@/db";
import { vendorStripeAccounts, vendorBalances } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function POST() {
    // Protect: only enable in non-production to avoid misuse
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ success: false, error: "Disabled in production" }, { status: 403 });
    }

    const session = await auth();
    if (!session || session.user?.role !== "vendor") {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const vendorId = session.user.vendor?.id || session.user.id;

    // Ensure Stripe account exists and is enabled
    const existing = await db.query.vendorStripeAccounts.findFirst({
        where: eq(vendorStripeAccounts.vendorId, vendorId),
    });

    if (!existing) {
        await db.insert(vendorStripeAccounts).values({
            vendorId,
            stripeAccountId: `acct_${Math.random().toString(36).slice(2, 10)}`,
            accountType: "express",
            onboardingStatus: "completed",
            chargesEnabled: true,
            payoutsEnabled: true,
            detailsSubmitted: true,
            commissionRate: "15",
        });
    } else {
        await db
            .update(vendorStripeAccounts)
            .set({
                onboardingStatus: "completed",
                chargesEnabled: true,
                payoutsEnabled: true,
                detailsSubmitted: true,
            })
            .where(eq(vendorStripeAccounts.vendorId, vendorId));
    }

    // Ensure balances are non-zero to surface UI elements
    const balance = await db.query.vendorBalances.findFirst({
        where: eq(vendorBalances.vendorId, vendorId),
    });

    if (!balance) {
        await db.insert(vendorBalances).values({
            vendorId,
            availableBalance: "1200",
            pendingBalance: "300",
            reservedBalance: "0",
            lifetimeVolume: "5000",
            currency: "MXN",
            lastUpdated: new Date(),
        } as any);
    } else {
        await db
            .update(vendorBalances)
            .set({
                availableBalance: "1200",
                pendingBalance: "300",
                lifetimeVolume: "5000",
                lastUpdated: new Date(),
            })
            .where(eq(vendorBalances.vendorId, vendorId));
    }

    return NextResponse.json({ success: true });
}


