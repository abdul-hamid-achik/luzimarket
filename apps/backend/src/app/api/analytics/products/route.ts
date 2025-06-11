import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/db/service';
import { products, productVariants, orderItems, orders, categories } from '@/db/schema';
import { sql, eq, and } from 'drizzle-orm';

/**
 * @swagger
 * /api/analytics/products:
 *   get:
 *     summary: Get product analytics
 *     description: Retrieve analytics data about products including inventory, sales, and category distribution
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Product analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 totalProducts:
 *                   type: number
 *                 activeProducts:
 *                   type: number
 *                 outOfStockProducts:
 *                   type: number
 *                 topSellingProducts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       soldCount:
 *                         type: number
 *                       revenue:
 *                         type: number
 *                 categoryDistribution:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       categoryName:
 *                         type: string
 *                       productCount:
 *                         type: number
 *                 inventoryStatus:
 *                   type: object
 *                   properties:
 *                     totalVariants:
 *                       type: number
 *                     lowStockVariants:
 *                       type: number
 *                     outOfStockVariants:
 *                       type: number
 */
export async function GET(_request: NextRequest) {
    try {
        const db = dbService.raw;

        // Get basic product counts
        const productCounts = await db
            .select({
                totalProducts: sql<number>`COUNT(*)`,
                activeProducts: sql<number>`COUNT(CASE WHEN ${products.status} = 'active' THEN 1 END)`,
                draftProducts: sql<number>`COUNT(CASE WHEN ${products.status} = 'draft' THEN 1 END)`,
                inactiveProducts: sql<number>`COUNT(CASE WHEN ${products.status} = 'inactive' THEN 1 END)`,
                outOfStockProducts: sql<number>`COUNT(CASE WHEN ${products.status} = 'out_of_stock' THEN 1 END)`,
            })
            .from(products);

        // Get inventory status from variants
        const inventoryStatus = await db
            .select({
                totalVariants: sql<number>`COUNT(*)`,
                lowStockVariants: sql<number>`COUNT(CASE WHEN ${productVariants.stock} > 0 AND ${productVariants.stock} <= 10 THEN 1 END)`,
                outOfStockVariants: sql<number>`COUNT(CASE WHEN ${productVariants.stock} = 0 THEN 1 END)`,
                totalStock: sql<number>`COALESCE(SUM(${productVariants.stock}), 0)`,
            })
            .from(productVariants);

        // Get top selling products
        const topSellingProducts = await db
            .select({
                id: products.id,
                name: products.name,
                price: products.price,
                soldCount: sql<number>`COUNT(${orderItems.id})`,
                revenue: sql<number>`COALESCE(SUM(${orderItems.price}), 0)`,
            })
            .from(products)
            .leftJoin(productVariants, eq(productVariants.productId, products.id))
            .leftJoin(orderItems, eq(orderItems.variantId, productVariants.id))
            .leftJoin(orders, and(
                eq(orders.id, orderItems.orderId),
                eq(orders.payment_status, 'succeeded')
            ))
            .groupBy(products.id, products.name, products.price)
            .orderBy(sql`COUNT(${orderItems.id}) DESC`)
            .limit(10);

        // Get category distribution
        const categoryDistribution = await db
            .select({
                categoryId: categories.id,
                categoryName: categories.name,
                productCount: sql<number>`COUNT(${products.id})`,
            })
            .from(categories)
            .leftJoin(products, eq(products.categoryId, categories.id))
            .groupBy(categories.id, categories.name)
            .orderBy(sql`COUNT(${products.id}) DESC`);

        // Format the response
        const response = {
            success: true,
            totalProducts: Number(productCounts[0]?.totalProducts) || 0,
            activeProducts: Number(productCounts[0]?.activeProducts) || 0,
            draftProducts: Number(productCounts[0]?.draftProducts) || 0,
            inactiveProducts: Number(productCounts[0]?.inactiveProducts) || 0,
            outOfStockProducts: Number(productCounts[0]?.outOfStockProducts) || 0,
            inventoryStatus: {
                totalVariants: Number(inventoryStatus[0]?.totalVariants) || 0,
                lowStockVariants: Number(inventoryStatus[0]?.lowStockVariants) || 0,
                outOfStockVariants: Number(inventoryStatus[0]?.outOfStockVariants) || 0,
                totalStock: Number(inventoryStatus[0]?.totalStock) || 0,
            },
            topSellingProducts: topSellingProducts.map(product => ({
                id: product.id,
                name: product.name,
                price: Number(product.price),
                soldCount: Number(product.soldCount) || 0,
                revenue: Number(product.revenue) || 0,
            })),
            categoryDistribution: categoryDistribution.map(cat => ({
                categoryId: cat.categoryId,
                categoryName: cat.categoryName,
                productCount: Number(cat.productCount) || 0,
            })),
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching product analytics:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to fetch product analytics',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}