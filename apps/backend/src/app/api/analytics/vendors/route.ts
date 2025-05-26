import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/db/service';
import { orders, orderItems, products, vendors } from '@/db/schema';
import { sql, and, gte, lte, eq } from 'drizzle-orm';

interface VendorPerformance {
    vendorId: string;
    vendorName: string;
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalProducts: number;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const limit = parseInt(searchParams.get('limit') || '10');

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

        // Use raw database access for complex queries
        const db = dbService.raw;

        // Get vendor performance data
        const vendorPerformance = await db
            .select({
                vendorId: vendors.id,
                vendorName: vendors.businessName,
                totalRevenue: sql<number>`COALESCE(SUM(${orderItems.price} * ${orderItems.quantity}), 0)`.as('totalRevenue'),
                totalOrders: sql<number>`COUNT(DISTINCT ${orders.id})`.as('totalOrders'),
                totalProducts: sql<number>`COUNT(DISTINCT ${products.id})`.as('totalProducts'),
                averageOrderValue: sql<number>`COALESCE(AVG(${orders.total}), 0)`.as('averageOrderValue'),
            })
            .from(vendors)
            .leftJoin(products, eq(products.vendorId, vendors.id))
            .leftJoin(orderItems, eq(orderItems.variantId, products.id)) // Note: This should join through productVariants
            .leftJoin(orders, and(
                eq(orders.id, orderItems.orderId),
                ...dateConditions
            ))
            .groupBy(vendors.id, vendors.businessName)
            .orderBy(sql`COALESCE(SUM(${orderItems.price} * ${orderItems.quantity}), 0) DESC`)
            .limit(limit);

        // Get vendor status distribution
        const vendorStatusDistribution = await db
            .select({
                status: vendors.status,
                count: sql<number>`COUNT(*)`.as('count'),
                percentage: sql<number>`COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ${vendors})`.as('percentage')
            })
            .from(vendors)
            .groupBy(vendors.status)
            .orderBy(vendors.status);

        // Get top vendors by commission earned
        const topVendorsByCommission = await db
            .select({
                vendorId: vendors.id,
                vendorName: vendors.businessName,
                commissionRate: vendors.commissionRate,
                totalRevenue: sql<number>`COALESCE(SUM(${orderItems.price} * ${orderItems.quantity}), 0)`.as('totalRevenue'),
                estimatedCommission: sql<number>`COALESCE(SUM(${orderItems.price} * ${orderItems.quantity}) * ${vendors.commissionRate} / 100, 0)`.as('estimatedCommission')
            })
            .from(vendors)
            .leftJoin(products, eq(products.vendorId, vendors.id))
            .leftJoin(orderItems, eq(orderItems.variantId, products.id))
            .leftJoin(orders, and(
                eq(orders.id, orderItems.orderId),
                ...dateConditions
            ))
            .where(eq(vendors.status, 'approved'))
            .groupBy(vendors.id, vendors.businessName, vendors.commissionRate)
            .orderBy(sql`COALESCE(SUM(${orderItems.price} * ${orderItems.quantity}) * ${vendors.commissionRate} / 100, 0) DESC`)
            .limit(limit);

        // Calculate summary statistics
        const totalVendors = vendorPerformance.length;
        const totalRevenue = vendorPerformance.reduce((sum: number, vendor: VendorPerformance) => sum + (vendor.totalRevenue || 0), 0);
        const averageRevenuePerVendor = totalVendors > 0 ? totalRevenue / totalVendors : 0;

        // Format data for charts
        const chartData = vendorPerformance.map((vendor: VendorPerformance) => ({
            name: vendor.vendorName || 'Unknown Vendor',
            revenue: vendor.totalRevenue || 0,
            orders: vendor.totalOrders || 0,
            products: vendor.totalProducts || 0,
            averageOrderValue: vendor.averageOrderValue || 0
        }));

        return NextResponse.json({
            success: true,
            data: {
                vendorPerformance: chartData,
                vendorStatusDistribution,
                topVendorsByCommission,
                summary: {
                    totalVendors,
                    totalRevenue,
                    averageRevenuePerVendor: Math.round(averageRevenuePerVendor * 100) / 100,
                    activeVendors: vendorStatusDistribution.find((s: any) => s.status === 'approved')?.count || 0,
                    pendingVendors: vendorStatusDistribution.find((s: any) => s.status === 'pending')?.count || 0
                },
                dateRange: {
                    startDate,
                    endDate
                }
            }
        });

    } catch (error) {
        console.error('Vendor analytics error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch vendor analytics' },
            { status: 500 }
        );
    }
} 