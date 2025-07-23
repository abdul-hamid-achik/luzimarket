"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  vendors,
  orders,
  orderItems,
  products,
  transactions,
  payouts,
  platformFees,
  vendorBalances,
} from "@/db/schema";
import { eq, and, gte, lte, sum, count, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { endOfDay, startOfDay, subDays, format } from "date-fns";
import {
  ApiResponse,
  SalesReportData,
  RevenueReportData,
  ProductsReportData,
  PayoutsReportData,
  PlatformOverviewData,
  DownloadReportData,
  salesReportDataSchema,
  revenueReportDataSchema,
  productsReportDataSchema,
  payoutsReportDataSchema,
  platformOverviewDataSchema,
  downloadReportDataSchema,
} from "@/lib/types/api";

// Schema for report parameters
const reportParamsSchema = z.object({
  vendorId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  reportType: z.enum([
    "sales",
    "revenue",
    "products",
    "payouts",
    "platform_overview",
  ]),
});

export async function generateReport(
  params: z.infer<typeof reportParamsSchema>
): Promise<ApiResponse<SalesReportData | RevenueReportData | ProductsReportData | PayoutsReportData | PlatformOverviewData>> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedParams = reportParamsSchema.parse(params);

    // Default date range: last 30 days
    const endDate = validatedParams.endDate
      ? new Date(validatedParams.endDate)
      : endOfDay(new Date());
    const startDate = validatedParams.startDate
      ? new Date(validatedParams.startDate)
      : startOfDay(subDays(endDate, 30));

    // Check permissions
    if (session.user.role === "vendor") {
      if (!validatedParams.vendorId || validatedParams.vendorId !== session.user.id) {
        return { success: false, error: "Unauthorized" };
      }
    } else if (session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    switch (validatedParams.reportType) {
      case "sales":
        return await generateSalesReport({ ...validatedParams, startDate, endDate });
      case "revenue":
        return await generateRevenueReport({ ...validatedParams, startDate, endDate });
      case "products":
        return await generateProductsReport({ ...validatedParams, startDate, endDate });
      case "payouts":
        return await generatePayoutsReport({ ...validatedParams, startDate, endDate });
      case "platform_overview":
        if (session.user.role !== "admin") {
          return { success: false, error: "Admin only report" };
        }
        return await generatePlatformOverviewReport({ startDate, endDate });
      default:
        return { success: false, error: "Invalid report type" };
    }
  } catch (error: any) {
    console.error("Generate report error:", error);
    return { success: false, error: error.message || "Failed to generate report" };
  }
}

async function generateSalesReport({
  vendorId,
  startDate,
  endDate,
}: {
  vendorId?: string;
  startDate: Date;
  endDate: Date;
}): Promise<ApiResponse<SalesReportData>> {
  const conditions = [
    gte(orders.createdAt, startDate),
    lte(orders.createdAt, endDate),
    eq(orders.status, "paid"),
  ];

  if (vendorId) {
    // Get vendor's products
    const vendorProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.vendorId, vendorId));

    const productIds = vendorProducts.map((p) => p.id);

    // Get orders containing vendor's products
    const vendorOrders = await db
      .selectDistinct({ orderId: orderItems.orderId })
      .from(orderItems)
      .where(sql`${orderItems.productId} IN ${productIds}`);

    const orderIds = vendorOrders.map((o) => o.orderId);
    conditions.push(sql`${orders.id} IN ${orderIds}`);
  }

  // Get order data
  const ordersData = await db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`,
      orderCount: count(orders.id),
      totalRevenue: sum(orders.total),
    })
    .from(orders)
    .where(and(...conditions))
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(sql`DATE(${orders.createdAt})`);

  // Get top products
  const topProducts = await db
    .select({
      productId: orderItems.productId,
      productName: products.name,
      quantitySold: sum(orderItems.quantity),
      revenue: sum(sql`${orderItems.price} * ${orderItems.quantity}`),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(
      and(
        ...conditions,
        vendorId ? eq(products.vendorId, vendorId) : undefined
      )
    )
    .groupBy(orderItems.productId, products.name)
    .orderBy(desc(sql`sum(${orderItems.price} * ${orderItems.quantity})`))
    .limit(10);

  // Calculate summary
  const summary = ordersData.reduce(
    (acc, day) => ({
      totalOrders: acc.totalOrders + Number(day.orderCount),
      totalRevenue: acc.totalRevenue + Number(day.totalRevenue || 0),
    }),
    { totalOrders: 0, totalRevenue: 0 }
  );

  // Transform and validate data
  const reportData = {
    summary,
    dailyData: ordersData.map(day => ({
      date: day.date,
      orderCount: Number(day.orderCount),
      totalRevenue: Number(day.totalRevenue || 0),
    })),
    topProducts: topProducts.map(product => ({
      productId: product.productId,
      productName: product.productName,
      quantitySold: Number(product.quantitySold || 0),
      revenue: Number(product.revenue || 0),
    })),
    dateRange: {
      start: format(startDate, "yyyy-MM-dd"),
      end: format(endDate, "yyyy-MM-dd"),
    },
  };

  // Validate with schema
  const validatedData = salesReportDataSchema.parse(reportData);

  return {
    success: true,
    data: validatedData,
  };
}

async function generateRevenueReport({
  vendorId,
  startDate,
  endDate,
}: {
  vendorId?: string;
  startDate: Date;
  endDate: Date;
}): Promise<ApiResponse<RevenueReportData>> {
  if (!vendorId) {
    return { success: false, error: "Vendor ID required for revenue report" };
  }

  // Get transactions
  const transactionsData = await db
    .select({
      type: transactions.type,
      status: transactions.status,
      totalAmount: sum(transactions.amount),
      count: count(transactions.id),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.vendorId, vendorId),
        gte(transactions.createdAt, startDate),
        lte(transactions.createdAt, endDate)
      )
    )
    .groupBy(transactions.type, transactions.status);

  // Get current balance
  const [balance] = await db
    .select()
    .from(vendorBalances)
    .where(eq(vendorBalances.vendorId, vendorId));

  // Get payouts
  const payoutsData = await db
    .select({
      status: payouts.status,
      totalAmount: sum(payouts.amount),
      count: count(payouts.id),
    })
    .from(payouts)
    .where(
      and(
        eq(payouts.vendorId, vendorId),
        gte(payouts.createdAt, startDate),
        lte(payouts.createdAt, endDate)
      )
    )
    .groupBy(payouts.status);

  // Transform and validate data
  const reportData = {
    currentBalance: balance || {
      availableBalance: "0",
      pendingBalance: "0",
      reservedBalance: "0",
    },
    transactions: transactionsData.map(t => ({
      type: t.type,
      status: t.status,
      totalAmount: Number(t.totalAmount || 0),
      count: Number(t.count),
    })),
    payouts: payoutsData.map(p => ({
      status: p.status,
      totalAmount: Number(p.totalAmount || 0),
      count: Number(p.count),
    })),
    dateRange: {
      start: format(startDate, "yyyy-MM-dd"),
      end: format(endDate, "yyyy-MM-dd"),
    },
  };

  // Validate with schema
  const validatedData = revenueReportDataSchema.parse(reportData);

  return {
    success: true,
    data: validatedData,
  };
}

async function generateProductsReport({
  vendorId,
  startDate,
  endDate,
}: {
  vendorId?: string;
  startDate: Date;
  endDate: Date;
}): Promise<ApiResponse<ProductsReportData>> {
  if (!vendorId) {
    return { success: false, error: "Vendor ID required for products report" };
  }

  // Get product performance
  const productPerformance = await db
    .select({
      productId: products.id,
      productName: products.name,
      currentStock: products.stock,
      price: products.price,
      quantitySold: sum(orderItems.quantity),
      revenue: sum(sql`${orderItems.price} * ${orderItems.quantity}`),
      orderCount: count(orderItems.orderId),
    })
    .from(products)
    .leftJoin(orderItems, eq(products.id, orderItems.productId))
    .leftJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(products.vendorId, vendorId),
        eq(products.isActive, true),
        orders.createdAt
          ? and(
              gte(orders.createdAt, startDate),
              lte(orders.createdAt, endDate),
              eq(orders.status, "paid")
            )
          : undefined
      )
    )
    .groupBy(
      products.id,
      products.name,
      products.stock,
      products.price
    );

  // Transform and validate data
  const transformedPerformance = productPerformance.map(product => ({
    productId: product.productId,
    productName: product.productName,
    currentStock: Number(product.currentStock || 0),
    price: product.price,
    quantitySold: Number(product.quantitySold || 0),
    revenue: Number(product.revenue || 0),
    orderCount: Number(product.orderCount || 0),
  }));

  // Calculate inventory value
  const inventoryValue = transformedPerformance.reduce(
    (total, product) =>
      total + product.currentStock * Number(product.price),
    0
  );

  // Low stock products
  const lowStockProducts = transformedPerformance
    .filter(p => p.currentStock < 10)
    .map(p => ({
      productId: p.productId,
      productName: p.productName,
      currentStock: p.currentStock,
    }));

  const reportData = {
    productPerformance: transformedPerformance,
    inventoryValue,
    lowStockCount: lowStockProducts.length,
    lowStockProducts,
    totalProducts: transformedPerformance.length,
    dateRange: {
      start: format(startDate, "yyyy-MM-dd"),
      end: format(endDate, "yyyy-MM-dd"),
    },
  };

  // Validate with schema
  const validatedData = productsReportDataSchema.parse(reportData);

  return {
    success: true,
    data: validatedData,
  };
}

async function generatePayoutsReport({
  vendorId,
  startDate,
  endDate,
}: {
  vendorId?: string;
  startDate: Date;
  endDate: Date;
}): Promise<ApiResponse<PayoutsReportData>> {
  const conditions = [
    gte(payouts.createdAt, startDate),
    lte(payouts.createdAt, endDate),
  ];

  if (vendorId) {
    conditions.push(eq(payouts.vendorId, vendorId));
  }

  // Get payout data
  const payoutData = await db
    .select({
      id: payouts.id,
      vendorId: payouts.vendorId,
      amount: payouts.amount,
      status: payouts.status,
      method: payouts.method,
      createdAt: payouts.createdAt,
      processedAt: payouts.processedAt,
      arrivalDate: payouts.arrivalDate,
      failureReason: payouts.failureReason,
    })
    .from(payouts)
    .where(and(...conditions))
    .orderBy(desc(payouts.createdAt));

  // Calculate summary with proper types
  const summary = payoutData.reduce(
    (acc, payout) => {
      const amount = Number(payout.amount);
      acc.total += amount;
      acc[payout.status as keyof typeof acc] = (acc[payout.status as keyof typeof acc] || 0) + amount;
      const countKey = `${payout.status}Count` as keyof typeof acc;
      acc[countKey] = (acc[countKey] || 0) + 1;
      return acc;
    },
    {
      total: 0,
      pending: 0,
      processing: 0,
      paid: 0,
      failed: 0,
      pendingCount: 0,
      processingCount: 0,
      paidCount: 0,
      failedCount: 0,
    }
  );

  const reportData = {
    summary,
    payouts: payoutData,
    dateRange: {
      start: format(startDate, "yyyy-MM-dd"),
      end: format(endDate, "yyyy-MM-dd"),
    },
  };

  // Validate with schema
  const validatedData = payoutsReportDataSchema.parse(reportData);

  return {
    success: true,
    data: validatedData,
  };
}

async function generatePlatformOverviewReport({
  startDate,
  endDate,
}: {
  startDate: Date;
  endDate: Date;
}): Promise<ApiResponse<PlatformOverviewData>> {
  // Get platform fees
  const [platformRevenue] = await db
    .select({
      total: sum(platformFees.feeAmount),
    })
    .from(platformFees)
    .where(
      and(
        eq(platformFees.status, "collected"),
        gte(platformFees.createdAt, startDate),
        lte(platformFees.createdAt, endDate)
      )
    );

  // Get total sales
  const [totalSales] = await db
    .select({
      total: sum(orders.total),
      count: count(orders.id),
    })
    .from(orders)
    .where(
      and(
        eq(orders.status, "paid"),
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate)
      )
    );

  // Get vendor stats
  const vendorStats = await db
    .select({
      totalVendors: count(vendors.id),
      activeVendors: count(
        sql`CASE WHEN ${vendors.isActive} = true THEN 1 END`
      ),
    })
    .from(vendors);

  // Get top vendors by revenue
  const topVendors = await db
    .select({
      vendorId: products.vendorId,
      vendorName: vendors.businessName,
      revenue: sum(sql`${orderItems.price} * ${orderItems.quantity}`),
      orderCount: count(orders.id),
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .innerJoin(vendors, eq(products.vendorId, vendors.id))
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orders.status, "paid"),
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate)
      )
    )
    .groupBy(products.vendorId, vendors.businessName)
    .orderBy(desc(sql`sum(${orderItems.price} * ${orderItems.quantity})`))
    .limit(10);

  // Transform and validate data
  const reportData = {
    platformRevenue: String(platformRevenue?.total || "0"),
    totalSales: {
      amount: String(totalSales?.total || "0"),
      count: Number(totalSales?.count || 0),
    },
    vendorStats: {
      totalVendors: Number(vendorStats[0]?.totalVendors || 0),
      activeVendors: Number(vendorStats[0]?.activeVendors || 0),
    },
    topVendors: topVendors.map(vendor => ({
      vendorId: vendor.vendorId,
      vendorName: vendor.vendorName,
      revenue: String(vendor.revenue || "0"),
      orderCount: Number(vendor.orderCount || 0),
    })),
    dateRange: {
      start: format(startDate, "yyyy-MM-dd"),
      end: format(endDate, "yyyy-MM-dd"),
    },
  };

  // Validate with schema
  const validatedData = platformOverviewDataSchema.parse(reportData);

  return {
    success: true,
    data: validatedData,
  };
}

export async function downloadReport(
  params: z.infer<typeof reportParamsSchema>
): Promise<ApiResponse<DownloadReportData>> {
  const report = await generateReport(params);
  
  if (!report.success) {
    return report;
  }

  // Convert report data to CSV format - now type-safe
  const csvData = convertReportToCSV(report.data, params.reportType);
  
  const downloadData = {
    content: csvData,
    filename: `${params.reportType}_report_${format(new Date(), "yyyy-MM-dd")}.csv`,
    contentType: "text/csv",
  };

  // Validate with schema
  const validatedData = downloadReportDataSchema.parse(downloadData);
  
  return {
    success: true,
    data: validatedData,
  };
}

function convertReportToCSV(data: SalesReportData | RevenueReportData | ProductsReportData | PayoutsReportData | PlatformOverviewData, reportType: string): string {
  let csv = "";
  
  switch (reportType) {
    case "sales":
      const salesData = data as SalesReportData;
      csv = "Date,Orders,Revenue\\n";
      salesData.dailyData.forEach((row) => {
        csv += `${row.date},${row.orderCount},${row.totalRevenue}\\n`;
      });
      break;
      
    case "products":
      const productsData = data as ProductsReportData;
      csv = "Product,Stock,Sold,Revenue\\n";
      productsData.productPerformance.forEach((row) => {
        csv += `"${row.productName}",${row.currentStock},${row.quantitySold || 0},${row.revenue || 0}\\n`;
      });
      break;
      
    case "payouts":
      const payoutsData = data as PayoutsReportData;
      csv = "Date,Amount,Status,Method\\n";
      payoutsData.payouts.forEach((row) => {
        csv += `${format(new Date(row.createdAt), "yyyy-MM-dd")},${row.amount},${row.status},${row.method}\\n`;
      });
      break;

    case "revenue":
      const revenueData = data as RevenueReportData;
      csv = "Transaction Type,Status,Amount,Count\\n";
      revenueData.transactions.forEach((row) => {
        csv += `${row.type},${row.status},${row.totalAmount},${row.count}\\n`;
      });
      break;

    case "platform_overview":
      const platformData = data as PlatformOverviewData;
      csv = "Vendor,Revenue,Orders\\n";
      platformData.topVendors.forEach((row) => {
        csv += `"${row.vendorName}",${row.revenue},${row.orderCount}\\n`;
      });
      break;
      
    default:
      csv = JSON.stringify(data, null, 2);
  }
  
  return csv;
}