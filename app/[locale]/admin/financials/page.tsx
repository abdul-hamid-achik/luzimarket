import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { vendors, vendorBalances, platformFees, transactions, payouts } from "@/db/schema";
import { desc, sum, eq, and, gte, lte } from "drizzle-orm";
import { AdminFinancialsClient } from "./admin-financials-client";

export default async function AdminFinancialsPage() {
  const t = await getTranslations("admin.financials");

  // Get platform statistics
  const [totalRevenue] = await db
    .select({ 
      total: sum(platformFees.feeAmount) 
    })
    .from(platformFees)
    .where(eq(platformFees.status, "collected"));

  const [pendingFees] = await db
    .select({ 
      total: sum(platformFees.feeAmount) 
    })
    .from(platformFees)
    .where(eq(platformFees.status, "pending"));

  // Get vendor balances summary
  const vendorBalancesSummary = await db
    .select({
      vendor: vendors,
      balance: vendorBalances,
    })
    .from(vendors)
    .leftJoin(vendorBalances, eq(vendors.id, vendorBalances.vendorId))
    .orderBy(desc(vendorBalances.availableBalance));

  // Get recent platform fees
  const recentPlatformFees = await db
    .select({
      fee: platformFees,
      vendor: vendors,
    })
    .from(platformFees)
    .leftJoin(vendors, eq(platformFees.vendorId, vendors.id))
    .orderBy(desc(platformFees.createdAt))
    .limit(20);

  // Get recent payouts
  const recentPayouts = await db
    .select({
      payout: payouts,
      vendor: vendors,
    })
    .from(payouts)
    .leftJoin(vendors, eq(payouts.vendorId, vendors.id))
    .orderBy(desc(payouts.createdAt))
    .limit(20);

  // Calculate total vendor balances
  const [totalVendorBalances] = await db
    .select({
      available: sum(vendorBalances.availableBalance),
      pending: sum(vendorBalances.pendingBalance),
    })
    .from(vendorBalances);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-univers text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-600 font-univers mt-1">
          {t("description")}
        </p>
      </div>

      <AdminFinancialsClient
        platformStats={{
          totalRevenue: totalRevenue?.total || "0",
          pendingFees: pendingFees?.total || "0",
          totalVendorBalances: {
            available: totalVendorBalances?.available || "0",
            pending: totalVendorBalances?.pending || "0",
          },
        }}
        vendorBalances={vendorBalancesSummary}
        platformFees={recentPlatformFees}
        payouts={recentPayouts}
      />
    </div>
  );
}