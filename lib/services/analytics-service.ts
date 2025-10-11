import { db } from "@/db";
import {
    analyticsSnapshots,
    orders,
    orderItems,
    products,
    vendors,
    users
} from "@/db/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

export interface AnalyticsMetrics {
    revenue: number;
    orders: number;
    customers: number;
    averageOrderValue: number;
    conversionRate: number;
    topProducts: Array<{ id: string; name: string; sales: number; revenue: number }>;
    newCustomers: number;
    returningCustomers: number;
}

export interface DateRange {
    startDate: Date;
    endDate: Date;
}

/**
 * Creates a daily analytics snapshot for a vendor
 */
export async function createAnalyticsSnapshot(vendorId: string, date: Date) {
    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const metrics = await calculateVendorMetrics(vendorId, {
            startDate: startOfDay,
            endDate: endOfDay,
        });

        // Check if snapshot already exists for this day
        const [existing] = await db
            .select()
            .from(analyticsSnapshots)
            .where(
                and(
                    eq(analyticsSnapshots.vendorId, vendorId),
                    sql`DATE(${analyticsSnapshots.snapshotDate}) = DATE(${startOfDay.toISOString()})`
                )
            )
            .limit(1);

        if (existing) {
            // Update existing snapshot
            const [updated] = await db
                .update(analyticsSnapshots)
                .set({
                    metricsData: metrics,
                })
                .where(eq(analyticsSnapshots.id, existing.id))
                .returning();

            return { success: true, snapshot: updated };
        }

        // Create new snapshot
        const [snapshot] = await db
            .insert(analyticsSnapshots)
            .values({
                vendorId,
                snapshotDate: startOfDay,
                metricsData: metrics,
            })
            .returning();

        return { success: true, snapshot };
    } catch (error) {
        console.error("Error creating analytics snapshot:", error);
        return {
            success: false,
            error: "Failed to create analytics snapshot",
        };
    }
}

/**
 * Calculates vendor metrics for a date range
 */
export async function calculateVendorMetrics(
    vendorId: string,
    dateRange: DateRange
): Promise<AnalyticsMetrics> {
    const { startDate, endDate } = dateRange;

    // Revenue and orders
    const [revenueData] = await db
        .select({
            revenue: sql<number>`COALESCE(SUM(${orders.total}::numeric), 0)`,
            orderCount: sql<number>`COUNT(DISTINCT ${orders.id})`,
        })
        .from(orders)
        .where(
            and(
                eq(orders.vendorId, vendorId),
                eq(orders.paymentStatus, "succeeded"),
                gte(orders.createdAt, startDate),
                lte(orders.createdAt, endDate)
            )
        );

    const revenue = Number(revenueData?.revenue || 0);
    const orderCount = Number(revenueData?.orderCount || 0);
    const averageOrderValue = orderCount > 0 ? revenue / orderCount : 0;

    // Customer metrics
    const [customerData] = await db
        .select({
            totalCustomers: sql<number>`COUNT(DISTINCT COALESCE(${orders.userId}::text, ${orders.guestEmail}))`,
        })
        .from(orders)
        .where(
            and(
                eq(orders.vendorId, vendorId),
                eq(orders.paymentStatus, "succeeded"),
                gte(orders.createdAt, startDate),
                lte(orders.createdAt, endDate)
            )
        );

    // New vs returning customers
    const customersList = await db
        .select({
            userId: orders.userId,
            guestEmail: orders.guestEmail,
            orderDate: orders.createdAt,
        })
        .from(orders)
        .where(
            and(
                eq(orders.vendorId, vendorId),
                eq(orders.paymentStatus, "succeeded"),
                gte(orders.createdAt, startDate),
                lte(orders.createdAt, endDate)
            )
        )
        .orderBy(orders.createdAt);

    let newCustomers = 0;
    const seenCustomers = new Set<string>();

    for (const order of customersList) {
        const customerId = order.userId || order.guestEmail;
        if (!customerId) continue;

        // Check if this customer had orders before this period
        const previousOrders = await db
            .select({ count: sql<number>`count(*)` })
            .from(orders)
            .where(
                and(
                    eq(orders.vendorId, vendorId),
                    order.userId
                        ? eq(orders.userId, order.userId)
                        : eq(orders.guestEmail, order.guestEmail!),
                    sql`${orders.createdAt} < ${startDate.toISOString()}`,
                    eq(orders.paymentStatus, "succeeded")
                )
            );

        if ((previousOrders[0]?.count || 0) === 0 && !seenCustomers.has(customerId)) {
            newCustomers++;
        }

        seenCustomers.add(customerId);
    }

    const totalCustomers = customerData?.totalCustomers || 0;
    const returningCustomers = totalCustomers - newCustomers;

    // Top products
    const topProducts = await db
        .select({
            productId: orderItems.productId,
            productName: products.name,
            totalSales: sql<number>`SUM(${orderItems.quantity})`,
            revenue: sql<number>`SUM(${orderItems.quantity} * ${orderItems.price}::numeric)`,
        })
        .from(orderItems)
        .leftJoin(orders, eq(orderItems.orderId, orders.id))
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(
            and(
                eq(orders.vendorId, vendorId),
                eq(orders.paymentStatus, "succeeded"),
                gte(orders.createdAt, startDate),
                lte(orders.createdAt, endDate)
            )
        )
        .groupBy(orderItems.productId, products.name)
        .orderBy(desc(sql`SUM(${orderItems.quantity})`))
        .limit(10);

    const topProductsFormatted = topProducts.map(p => ({
        id: p.productId,
        name: p.productName || "Unknown",
        sales: Number(p.totalSales),
        revenue: Number(p.revenue),
    }));

    // Conversion rate (placeholder - would need page view tracking)
    const conversionRate = 0; // TODO: Implement with page view tracking

    return {
        revenue,
        orders: orderCount,
        customers: totalCustomers,
        averageOrderValue,
        conversionRate,
        topProducts: topProductsFormatted,
        newCustomers,
        returningCustomers,
    };
}

/**
 * Gets trend data for a vendor
 */
export async function getVendorTrends(
    vendorId: string,
    days: number = 30
) {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get daily snapshots
        const snapshots = await db
            .select()
            .from(analyticsSnapshots)
            .where(
                and(
                    eq(analyticsSnapshots.vendorId, vendorId),
                    gte(analyticsSnapshots.snapshotDate, startDate),
                    lte(analyticsSnapshots.snapshotDate, endDate)
                )
            )
            .orderBy(analyticsSnapshots.snapshotDate);

        // If no snapshots, calculate current metrics
        if (snapshots.length === 0) {
            const currentMetrics = await calculateVendorMetrics(vendorId, {
                startDate,
                endDate,
            });

            return {
                success: true,
                trends: {
                    daily: [],
                    summary: currentMetrics,
                },
            };
        }

        // Calculate summary from snapshots
        const summary = snapshots.reduce(
            (acc, snapshot) => {
                const metrics = snapshot.metricsData as AnalyticsMetrics;
                return {
                    revenue: acc.revenue + metrics.revenue,
                    orders: acc.orders + metrics.orders,
                    customers: acc.customers + metrics.customers,
                    averageOrderValue: 0, // Will calculate after
                    conversionRate: 0,
                    topProducts: [],
                    newCustomers: acc.newCustomers + metrics.newCustomers,
                    returningCustomers: acc.returningCustomers + metrics.returningCustomers,
                };
            },
            {
                revenue: 0,
                orders: 0,
                customers: 0,
                averageOrderValue: 0,
                conversionRate: 0,
                topProducts: [],
                newCustomers: 0,
                returningCustomers: 0,
            } as AnalyticsMetrics
        );

        summary.averageOrderValue = summary.orders > 0 ? summary.revenue / summary.orders : 0;

        return {
            success: true,
            trends: {
                daily: snapshots.map(s => ({
                    date: s.snapshotDate,
                    metrics: s.metricsData as AnalyticsMetrics,
                })),
                summary,
            },
        };
    } catch (error) {
        console.error("Error fetching vendor trends:", error);
        return {
            success: false,
            error: "Failed to fetch trends",
        };
    }
}

/**
 * Gets platform-wide analytics (admin only)
 */
export async function getPlatformAnalytics(dateRange: DateRange) {
    try {
        const { startDate, endDate } = dateRange;

        // Total revenue and orders
        const [platformData] = await db
            .select({
                revenue: sql<number>`COALESCE(SUM(${orders.total}::numeric), 0)`,
                orderCount: sql<number>`COUNT(DISTINCT ${orders.id})`,
                vendorCount: sql<number>`COUNT(DISTINCT ${orders.vendorId})`,
            })
            .from(orders)
            .where(
                and(
                    eq(orders.paymentStatus, "succeeded"),
                    gte(orders.createdAt, startDate),
                    lte(orders.createdAt, endDate)
                )
            );

        // Top vendors by revenue
        const topVendors = await db
            .select({
                vendorId: orders.vendorId,
                vendorName: vendors.businessName,
                revenue: sql<number>`SUM(${orders.total}::numeric)`,
                orderCount: sql<number>`COUNT(${orders.id})`,
            })
            .from(orders)
            .leftJoin(vendors, eq(orders.vendorId, vendors.id))
            .where(
                and(
                    eq(orders.paymentStatus, "succeeded"),
                    gte(orders.createdAt, startDate),
                    lte(orders.createdAt, endDate)
                )
            )
            .groupBy(orders.vendorId, vendors.businessName)
            .orderBy(desc(sql`SUM(${orders.total}::numeric)`))
            .limit(10);

        // Top products across platform
        const topProducts = await db
            .select({
                productId: orderItems.productId,
                productName: products.name,
                vendorName: vendors.businessName,
                totalSales: sql<number>`SUM(${orderItems.quantity})`,
                revenue: sql<number>`SUM(${orderItems.quantity} * ${orderItems.price}::numeric)`,
            })
            .from(orderItems)
            .leftJoin(orders, eq(orderItems.orderId, orders.id))
            .leftJoin(products, eq(orderItems.productId, products.id))
            .leftJoin(vendors, eq(products.vendorId, vendors.id))
            .where(
                and(
                    eq(orders.paymentStatus, "succeeded"),
                    gte(orders.createdAt, startDate),
                    lte(orders.createdAt, endDate)
                )
            )
            .groupBy(orderItems.productId, products.name, vendors.businessName)
            .orderBy(desc(sql`SUM(${orderItems.quantity})`))
            .limit(10);

        return {
            success: true,
            analytics: {
                revenue: Number(platformData?.revenue || 0),
                orders: Number(platformData?.orderCount || 0),
                activeVendors: Number(platformData?.vendorCount || 0),
                averageOrderValue: Number(platformData?.orderCount || 0) > 0
                    ? Number(platformData?.revenue || 0) / Number(platformData?.orderCount || 0)
                    : 0,
                topVendors: topVendors.map(v => ({
                    id: v.vendorId,
                    name: v.vendorName || "Unknown",
                    revenue: Number(v.revenue),
                    orders: Number(v.orderCount),
                })),
                topProducts: topProducts.map(p => ({
                    id: p.productId,
                    name: p.productName || "Unknown",
                    vendor: p.vendorName || "Unknown",
                    sales: Number(p.totalSales),
                    revenue: Number(p.revenue),
                })),
            },
        };
    } catch (error) {
        console.error("Error fetching platform analytics:", error);
        return {
            success: false,
            error: "Failed to fetch platform analytics",
        };
    }
}

/**
 * Cron job to create daily snapshots for all active vendors
 */
export async function createDailySnapshots() {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        // Get all active vendors
        const activeVendors = await db
            .select({ id: vendors.id })
            .from(vendors)
            .where(eq(vendors.isActive, true));

        const results = [];

        for (const vendor of activeVendors) {
            const result = await createAnalyticsSnapshot(vendor.id, yesterday);
            results.push({
                vendorId: vendor.id,
                success: result.success,
            });
        }

        const successful = results.filter(r => r.success).length;

        return {
            success: true,
            message: `Created ${successful}/${activeVendors.length} snapshots`,
            results,
        };
    } catch (error) {
        console.error("Error creating daily snapshots:", error);
        return {
            success: false,
            error: "Failed to create daily snapshots",
        };
    }
}

/**
 * Gets revenue forecasting data
 */
export async function getRevenueForecast(vendorId: string, days: number = 30) {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get historical daily revenue
        const dailyRevenue = await db
            .select({
                date: sql<string>`DATE(${orders.createdAt})`,
                revenue: sql<number>`SUM(${orders.total}::numeric)`,
            })
            .from(orders)
            .where(
                and(
                    eq(orders.vendorId, vendorId),
                    eq(orders.paymentStatus, "succeeded"),
                    gte(orders.createdAt, startDate),
                    lte(orders.createdAt, endDate)
                )
            )
            .groupBy(sql`DATE(${orders.createdAt})`)
            .orderBy(sql`DATE(${orders.createdAt})`);

        if (dailyRevenue.length < 7) {
            return {
                success: true,
                forecast: {
                    nextWeek: 0,
                    nextMonth: 0,
                    trend: "insufficient_data",
                },
            };
        }

        // Simple moving average for forecast
        const recentRevenue = dailyRevenue.slice(-7);
        const avgDailyRevenue = recentRevenue.reduce((sum, day) => sum + Number(day.revenue), 0) / 7;

        const nextWeekForecast = avgDailyRevenue * 7;
        const nextMonthForecast = avgDailyRevenue * 30;

        // Calculate trend
        const firstHalf = dailyRevenue.slice(0, Math.floor(dailyRevenue.length / 2));
        const secondHalf = dailyRevenue.slice(Math.floor(dailyRevenue.length / 2));

        const firstHalfAvg = firstHalf.reduce((sum, day) => sum + Number(day.revenue), 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, day) => sum + Number(day.revenue), 0) / secondHalf.length;

        const trend = secondHalfAvg > firstHalfAvg * 1.1 ? "up" :
            secondHalfAvg < firstHalfAvg * 0.9 ? "down" : "stable";

        return {
            success: true,
            forecast: {
                nextWeek: Math.round(nextWeekForecast * 100) / 100,
                nextMonth: Math.round(nextMonthForecast * 100) / 100,
                trend,
                avgDailyRevenue: Math.round(avgDailyRevenue * 100) / 100,
            },
        };
    } catch (error) {
        console.error("Error calculating revenue forecast:", error);
        return {
            success: false,
            error: "Failed to calculate forecast",
        };
    }
}

