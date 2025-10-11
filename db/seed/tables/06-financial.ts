import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { faker } from "@faker-js/faker";
import { SeedLogger } from "../utils/logger";

const logger = new SeedLogger();

faker.seed(12345);

/**
 * Seeds financial data: platform fees, transactions, payouts
 */
export async function seedFinancialData(database = db, options?: any) {
  logger.info("Creating financial data", true);

  const orders = await database.query.orders.findMany({
    where: (orders, { eq }) => eq(orders.paymentStatus, "succeeded")
  });

  const vendors = await database.select().from(schema.vendors);
  const vendorStripeAccounts = await database.select().from(schema.vendorStripeAccounts);

  if (orders.length === 0) {
    logger.warn("No successful orders found for financial data");
    return { success: true, message: "No financial data created", data: {} };
  }

  // Create commission map
  const vendorCommissions = new Map();
  for (const account of vendorStripeAccounts) {
    vendorCommissions.set(account.vendorId, parseFloat(account.commissionRate));
  }

  // 1. Create platform fees and transactions for orders
  const platformFees = [];
  const transactions = [];

  for (const order of orders) {
    const orderAmount = parseFloat(order.total);
    const commission = vendorCommissions.get(order.vendorId) || 15;
    const feeAmount = Math.round((orderAmount * commission) / 100);
    const vendorEarnings = orderAmount - feeAmount - parseFloat(order.shipping || "0");

    // Platform fee record
    platformFees.push({
      orderId: order.id,
      vendorId: order.vendorId,
      orderAmount: String(orderAmount),
      feePercentage: String(commission),
      feeAmount: String(feeAmount),
      vendorEarnings: String(vendorEarnings),
      currency: "MXN",
      status: order.status === "delivered" ? "collected" : "pending",
      stripeApplicationFeeId: `fee_${faker.string.alphanumeric(24)}`,
      stripeTransferId: order.status === "delivered" ? `tr_${faker.string.alphanumeric(24)}` : null,
      createdAt: order.createdAt,
      collectedAt: order.status === "delivered" ? order.updatedAt : null
    });

    // Sale transaction
    transactions.push({
      vendorId: order.vendorId,
      orderId: order.id,
      type: "sale",
      amount: String(orderAmount),
      currency: "MXN",
      status: "completed",
      description: `Venta - Orden ${order.orderNumber}`,
      metadata: { orderNumber: order.orderNumber },
      stripeChargeId: `ch_${faker.string.alphanumeric(24)}`,
      createdAt: order.createdAt,
      completedAt: order.createdAt
    });

    // Fee transaction
    transactions.push({
      vendorId: order.vendorId,
      orderId: order.id,
      type: "fee",
      amount: String(-feeAmount), // Negative for fees
      currency: "MXN",
      status: "completed",
      description: `Comisión plataforma (${commission}%) - Orden ${order.orderNumber}`,
      metadata: { commission, orderNumber: order.orderNumber },
      createdAt: order.createdAt,
      completedAt: order.createdAt
    });
  }

  if (platformFees.length > 0) {
    await database.insert(schema.platformFees).values(platformFees);
    await database.insert(schema.transactions).values(transactions);
  }

  // 2. Update vendor balances based on transactions
  const vendorEarnings = new Map();
  for (const order of orders) {
    const orderAmount = parseFloat(order.total);
    const commission = vendorCommissions.get(order.vendorId) || 15;
    const feeAmount = Math.round((orderAmount * commission) / 100);
    const vendorEarning = orderAmount - feeAmount - parseFloat(order.shipping || "0");

    const current = vendorEarnings.get(order.vendorId) || { available: 0, pending: 0, lifetime: 0 };
    current.lifetime += vendorEarning;

    if (order.status === "delivered") {
      current.available += vendorEarning;
    } else {
      current.pending += vendorEarning;
    }

    vendorEarnings.set(order.vendorId, current);
  }

  for (const [vendorId, earnings] of vendorEarnings.entries()) {
    await database.update(schema.vendorBalances)
      .set({
        availableBalance: String(Math.round(earnings.available)),
        pendingBalance: String(Math.round(earnings.pending)),
        lifetimeVolume: String(Math.round(earnings.lifetime)),
        lastUpdated: new Date()
      })
      .where(eq(schema.vendorBalances.vendorId, vendorId));
  }

  // 3. Create bank accounts for top vendors
  const topVendors = Array.from(vendorEarnings.entries())
    .sort((a, b) => b[1].lifetime - a[1].lifetime)
    .slice(0, 15)
    .map(([vendorId]) => vendorId);

  const bankAccounts = [];
  for (const vendorId of topVendors) {
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) continue;

    bankAccounts.push({
      vendorId,
      accountHolderName: vendor.businessName,
      accountHolderType: "company" as const,
      bankName: faker.helpers.arrayElement(["BBVA", "Santander", "Banorte", "HSBC", "Scotiabank"]),
      last4: faker.string.numeric(4),
      currency: "MXN",
      country: "MX",
      isDefault: true,
      stripeExternalAccountId: `ba_${faker.string.alphanumeric(24)}`,
      verifiedAt: faker.date.past()
    });
  }

  if (bankAccounts.length > 0) {
    await database.insert(schema.vendorBankAccounts)
      .values(bankAccounts)
      .onConflictDoNothing({ target: schema.vendorBankAccounts.vendorId });
  }

  // 4. Create payouts for vendors with sufficient balance
  const payouts = [];
  const payoutTransactions = [];

  for (const [vendorId, earnings] of vendorEarnings.entries()) {
    if (earnings.available < 500) continue; // Minimum payout threshold

    const bankAccount = await database.query.vendorBankAccounts.findFirst({
      where: (accounts, { eq }) => eq(accounts.vendorId, vendorId)
    });

    if (!bankAccount) continue;

    // Create 1-3 payouts for this vendor
    const payoutCount = faker.number.int({ min: 1, max: 3 });
    let remainingBalance = earnings.available;

    for (let i = 0; i < payoutCount && remainingBalance > 500; i++) {
      const payoutAmount = Math.min(
        remainingBalance * faker.number.float({ min: 0.3, max: 0.7 }),
        remainingBalance - 100 // Keep at least 100 in balance
      );

      const payoutDate = faker.date.recent({ days: 30 });
      const payoutId = faker.string.uuid();

      payouts.push({
        id: payoutId,
        vendorId,
        amount: String(Math.round(payoutAmount)),
        currency: "MXN",
        status: "paid",
        method: "bank_transfer",
        stripePayoutId: `po_${faker.string.alphanumeric(24)}`,
        bankAccountId: bankAccount.id,
        arrivalDate: new Date(payoutDate.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days later
        createdAt: payoutDate,
        processedAt: payoutDate,
        paidAt: new Date(payoutDate.getTime() + 2 * 24 * 60 * 60 * 1000)
      });

      // Create payout transaction
      payoutTransactions.push({
        vendorId,
        orderId: null,
        type: "payout",
        amount: String(-Math.round(payoutAmount)), // Negative for payouts
        currency: "MXN",
        status: "completed",
        description: `Pago a cuenta bancaria ****${bankAccount.last4}`,
        metadata: { payoutId, bankAccount: bankAccount.last4 },
        createdAt: payoutDate,
        completedAt: payoutDate
      });

      remainingBalance -= payoutAmount;
    }

    // Update vendor balance after payouts
    await database.update(schema.vendorBalances)
      .set({
        availableBalance: String(Math.round(remainingBalance)),
        lastUpdated: new Date()
      })
      .where(eq(schema.vendorBalances.vendorId, vendorId));
  }

  if (payouts.length > 0) {
    await database.insert(schema.payouts).values(payouts);
    await database.insert(schema.transactions).values(payoutTransactions);
  }

  return {
    success: true,
    message: `Created ${platformFees.length} platform fees, ${transactions.length + payoutTransactions.length} transactions, ${payouts.length} payouts`,
    data: {
      platformFees: platformFees.length,
      transactions: transactions.length + payoutTransactions.length,
      payouts: payouts.length,
      bankAccounts: bankAccounts.length
    }
  };
}