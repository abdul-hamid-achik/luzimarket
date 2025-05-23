import { NextResponse } from 'next/server';
import { dbService, eq } from '@/db/service';
import { products, orderItems, productVariants, photos, categories } from '@/db/schema';
import { StatusCodes } from 'http-status-codes';
import { sql, desc } from 'drizzle-orm';

interface BestSellerProduct {
    id: string;
    slug: string;
    name: string;
    description: string;
    price: number;
    categoryId: string;
    categoryName: string;
    categorySlug: string;
    imageUrl: string;
    imageAlt: string;
    totalSold: number;
}

/**
 * @swagger
 * /api/products/best-sellers:
 *   get:
 *     summary: Get best selling products
 *     description: Returns a list of the top 10 best-selling products with their details, categories, and sales information
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of best selling products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BestSellerProduct'
 *       500:
 *         description: Failed to fetch best sellers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
    try {
        // Query to get best-selling products with their details and photos
        const result = await dbService.execute(sql`
            SELECT 
                p.id,
                p.slug,
                p.name,
                p.description,
                p.price,
                p."category_id" as "categoryId",
                c.name as "categoryName",
                c.slug as "categorySlug",
                COALESCE(ph.url, '') as "imageUrl",
                COALESCE(ph.alt_text, p.name) as "imageAlt",
                COALESCE(SUM(oi.quantity), 0) as "totalSold"
            FROM products p
            LEFT JOIN order_items oi ON oi."variant_id" IN (
                SELECT pv.id FROM product_variants pv WHERE pv."product_id" = p.id
            )
            LEFT JOIN categories c ON c.id = p."category_id"
            LEFT JOIN (
                SELECT DISTINCT ON ("product_id") 
                    "product_id", url, alt_text
                FROM photos
                ORDER BY "product_id", "sort_order" ASC
            ) ph ON ph."product_id" = p.id
            GROUP BY p.id, p.slug, p.name, p.description, p.price, p."category_id", c.name, c.slug, ph.url, ph.alt_text
            ORDER BY "totalSold" DESC, p."created_at" DESC
            LIMIT 10
        `);

        // Handle the database result - it might be { rows: [...] } or just [...]
        const bestSellers = Array.isArray(result) ? result : (result as any).rows || [];

        // Format the response
        const formattedBestSellers: BestSellerProduct[] = bestSellers.map((product: any) => ({
            id: product.id,
            slug: product.slug,
            name: product.name,
            description: product.description,
            price: product.price,
            categoryId: product.categoryId,
            categoryName: product.categoryName,
            categorySlug: product.categorySlug,
            imageUrl: product.imageUrl,
            imageAlt: product.imageAlt,
            totalSold: Number(product.totalSold)
        }));

        return NextResponse.json(formattedBestSellers, { status: StatusCodes.OK });
    } catch (error) {
        console.error('Error fetching best sellers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch best sellers' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 