import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/db/service';
import { orders } from '@/db/schema';
import { sql, and, gte, lte, eq } from 'drizzle-orm';

interface WeeklyData {
    date: string;
    totalRevenue: number;
    orderCount: number;
    averageOrderValue: number;
    weekNumber: number;
}

interface MonthlyData {
    date: string;
    totalRevenue: number;
    orderCount: number;
    averageOrderValue: number;
    month: string;
}

interface RevenueItem {
    date: string;
    totalRevenue: number;
    orderCount: number;
    averageOrderValue: number;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const period = searchParams.get('period') || 'daily'; // daily, weekly, monthly

        // Build date filter conditions with validation
        const dateConditions = [eq(orders.payment_status, 'succeeded')];
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

        // Use raw database access for complex queries with SQL functions
        const db = dbService.raw;

        // Get revenue trends over time
        const revenueData = await db
            .select({
                date: sql<string>`DATE(${orders.createdAt})`.as('date'),
                totalRevenue: sql<number>`COALESCE(SUM(${orders.total}), 0)`.as('totalRevenue'),
                orderCount: sql<number>`COUNT(${orders.id})`.as('orderCount'),
                averageOrderValue: sql<number>`COALESCE(AVG(${orders.total}), 0)`.as('averageOrderValue'),
            })
            .from(orders)
            .where(and(...dateConditions))
            .groupBy(sql`DATE(${orders.createdAt})`)
            .orderBy(sql`DATE(${orders.createdAt})`);

        // Get summary statistics
        const summaryResult = await db
            .select({
                totalRevenue: sql<number>`COALESCE(SUM(${orders.total}), 0)`.as('totalRevenue'),
                totalOrders: sql<number>`COUNT(${orders.id})`.as('totalOrders'),
                averageOrderValue: sql<number>`COALESCE(AVG(${orders.total}), 0)`.as('averageOrderValue'),
                completedOrders: sql<number>`COUNT(CASE WHEN ${orders.payment_status} = 'succeeded' THEN 1 END)`.as('completedOrders'),
            })
            .from(orders)
            .where(and(...dateConditions));

        const summary = summaryResult[0];

        // Format revenue data based on period
        let formattedData: any[] = revenueData;
        if (period === 'weekly') {
            // Group by week
            const weeklyData = revenueData.reduce((acc: Record<string, WeeklyData>, item: RevenueItem) => {
                const date = new Date(item.date);
                const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
                const weekKey = weekStart.toISOString().split('T')[0];

                if (!acc[weekKey]) {
                    acc[weekKey] = {
                        date: weekKey,
                        totalRevenue: 0,
                        orderCount: 0,
                        averageOrderValue: 0,
                        weekNumber: 0
                    };
                }

                acc[weekKey].totalRevenue += item.totalRevenue;
                acc[weekKey].orderCount += item.orderCount;

                return acc;
            }, {} as Record<string, WeeklyData>);

            formattedData = Object.values(weeklyData);
        } else if (period === 'monthly') {
            // Group by month
            const monthlyData = revenueData.reduce((acc: Record<string, MonthlyData>, item: RevenueItem) => {
                const date = new Date(item.date);
                const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

                if (!acc[monthKey]) {
                    acc[monthKey] = {
                        date: monthKey,
                        totalRevenue: 0,
                        orderCount: 0,
                        averageOrderValue: 0,
                        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    };
                }

                acc[monthKey].totalRevenue += item.totalRevenue;
                acc[monthKey].orderCount += item.orderCount;

                return acc;
            }, {} as Record<string, MonthlyData>);

            formattedData = Object.values(monthlyData);
        }

        // Calculate average order value for grouped data
        formattedData = formattedData.map((item: any) => ({
            ...item,
            averageOrderValue: item.orderCount > 0 ? item.totalRevenue / item.orderCount : 0
        }));

        return NextResponse.json({
            success: true,
            data: {
                trends: formattedData,
                summary: summary || {
                    totalRevenue: 0,
                    totalOrders: 0,
                    averageOrderValue: 0,
                    completedOrders: 0
                },
                period,
                dateRange: {
                    startDate,
                    endDate
                }
            }
        });

    } catch (error) {
        console.error('Sales analytics error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch sales analytics' },
            { status: 500 }
        );
    }
} 