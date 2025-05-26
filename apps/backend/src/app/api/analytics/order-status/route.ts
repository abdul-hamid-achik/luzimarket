import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/db/service';
import { orders } from '@/db/schema';
import { sql, and, gte, lte } from 'drizzle-orm';

interface StatusDistributionItem {
    status: string;
    count: number;
    percentage: number;
}

interface _ProgressDataItem {
    name: string;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    total: number;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const period = searchParams.get('period') || 'weekly'; // daily, weekly, monthly

        // Build date filter conditions with validation
        const dateConditions = [];
        if (startDate) {
            const parsedStartDate = new Date(startDate);
            if (isNaN(parsedStartDate.getTime())) {
                return NextResponse.json(
                    { success: false, error: 'Invalid startDate format. Please use YYYY-MM-DD format.' },
                    { status: 400 }
                );
            }
            dateConditions.push(gte(orders.createdAt, parsedStartDate));
        }
        if (endDate) {
            const parsedEndDate = new Date(endDate);
            if (isNaN(parsedEndDate.getTime())) {
                return NextResponse.json(
                    { success: false, error: 'Invalid endDate format. Please use YYYY-MM-DD format.' },
                    { status: 400 }
                );
            }
            dateConditions.push(lte(orders.createdAt, parsedEndDate));
        }

        // Use raw database access for complex queries
        const db = dbService.raw;

        // Get order status distribution
        const statusDistribution = await db
            .select({
                status: orders.status,
                count: sql<number>`COUNT(*)`.as('count'),
                percentage: sql<number>`COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ${orders} WHERE ${and(...dateConditions) || sql`1=1`})`.as('percentage')
            })
            .from(orders)
            .where(dateConditions.length > 0 ? and(...dateConditions) : undefined)
            .groupBy(orders.status)
            .orderBy(orders.status);

        // Get payment status distribution
        const paymentStatusDistribution = await db
            .select({
                paymentStatus: orders.payment_status,
                count: sql<number>`COUNT(*)`.as('count'),
                percentage: sql<number>`COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ${orders} WHERE ${and(...dateConditions) || sql`1=1`})`.as('percentage')
            })
            .from(orders)
            .where(dateConditions.length > 0 ? and(...dateConditions) : undefined)
            .groupBy(orders.payment_status)
            .orderBy(orders.payment_status);

        // Get weekly progress data for charts
        let progressData = [];
        if (period === 'weekly') {
            progressData = await db
                .select({
                    week: sql<string>`strftime('%Y-W%W', ${orders.createdAt})`.as('week'),
                    pending: sql<number>`COUNT(CASE WHEN ${orders.status} = 'pending' THEN 1 END)`.as('pending'),
                    processing: sql<number>`COUNT(CASE WHEN ${orders.status} = 'processing' THEN 1 END)`.as('processing'),
                    shipped: sql<number>`COUNT(CASE WHEN ${orders.status} = 'shipped' THEN 1 END)`.as('shipped'),
                    delivered: sql<number>`COUNT(CASE WHEN ${orders.status} = 'delivered' THEN 1 END)`.as('delivered'),
                    total: sql<number>`COUNT(*)`.as('total')
                })
                .from(orders)
                .where(dateConditions.length > 0 ? and(...dateConditions) : undefined)
                .groupBy(sql`strftime('%Y-W%W', ${orders.createdAt})`)
                .orderBy(sql`strftime('%Y-W%W', ${orders.createdAt})`);
        } else if (period === 'monthly') {
            progressData = await db
                .select({
                    month: sql<string>`strftime('%Y-%m', ${orders.createdAt})`.as('month'),
                    pending: sql<number>`COUNT(CASE WHEN ${orders.status} = 'pending' THEN 1 END)`.as('pending'),
                    processing: sql<number>`COUNT(CASE WHEN ${orders.status} = 'processing' THEN 1 END)`.as('processing'),
                    shipped: sql<number>`COUNT(CASE WHEN ${orders.status} = 'shipped' THEN 1 END)`.as('shipped'),
                    delivered: sql<number>`COUNT(CASE WHEN ${orders.status} = 'delivered' THEN 1 END)`.as('delivered'),
                    total: sql<number>`COUNT(*)`.as('total')
                })
                .from(orders)
                .where(dateConditions.length > 0 ? and(...dateConditions) : undefined)
                .groupBy(sql`strftime('%Y-%m', ${orders.createdAt})`)
                .orderBy(sql`strftime('%Y-%m', ${orders.createdAt})`);
        } else {
            // Daily data
            progressData = await db
                .select({
                    date: sql<string>`DATE(${orders.createdAt})`.as('date'),
                    pending: sql<number>`COUNT(CASE WHEN ${orders.status} = 'pending' THEN 1 END)`.as('pending'),
                    processing: sql<number>`COUNT(CASE WHEN ${orders.status} = 'processing' THEN 1 END)`.as('processing'),
                    shipped: sql<number>`COUNT(CASE WHEN ${orders.status} = 'shipped' THEN 1 END)`.as('shipped'),
                    delivered: sql<number>`COUNT(CASE WHEN ${orders.status} = 'delivered' THEN 1 END)`.as('delivered'),
                    total: sql<number>`COUNT(*)`.as('total')
                })
                .from(orders)
                .where(dateConditions.length > 0 ? and(...dateConditions) : undefined)
                .groupBy(sql`DATE(${orders.createdAt})`)
                .orderBy(sql`DATE(${orders.createdAt})`);
        }

        // Calculate completion rates
        const totalOrders = statusDistribution.reduce((sum: number, item: StatusDistributionItem) => sum + item.count, 0);
        const completedOrders = statusDistribution
            .filter((item: StatusDistributionItem) => ['delivered', 'completed'].includes(item.status))
            .reduce((sum: number, item: StatusDistributionItem) => sum + item.count, 0);
        const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

        // Format progress data with names for chart display
        const formattedProgressData = progressData.map((item: any) => ({
            ...item,
            name: period === 'weekly' ? `Week ${item.week}`
                : period === 'monthly' ? new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    : item.date
        }));

        return NextResponse.json({
            success: true,
            data: {
                statusDistribution,
                paymentStatusDistribution,
                progressData: formattedProgressData,
                summary: {
                    totalOrders,
                    completedOrders,
                    completionRate: Math.round(completionRate * 100) / 100,
                    pendingOrders: statusDistribution.find((s: StatusDistributionItem) => s.status === 'pending')?.count || 0,
                    processingOrders: statusDistribution.find((s: StatusDistributionItem) => s.status === 'processing')?.count || 0
                },
                period,
                dateRange: {
                    startDate,
                    endDate
                }
            }
        });

    } catch (error) {
        console.error('Order status analytics error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch order status analytics' },
            { status: 500 }
        );
    }
} 