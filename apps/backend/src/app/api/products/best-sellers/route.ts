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

export async function GET() {
    try {
        // Query to get best-selling products with their details and photos
        const bestSellers = await dbService.execute(sql`
            SELECT 
                p.id,
                p.slug,
                p.name,
                p.description,
                p.price,
                p."categoryId",
                c.name as "categoryName",
                c.slug as "categorySlug",
                COALESCE(ph.url, '') as "imageUrl",
                COALESCE(ph.alt, p.name) as "imageAlt",
                COALESCE(SUM(oi.quantity), 0) as "totalSold"
            FROM products p
            LEFT JOIN order_items oi ON oi."variantId" IN (
                SELECT pv.id FROM product_variants pv WHERE pv."productId" = p.id
            )
            LEFT JOIN categories c ON c.id = p."categoryId"
            LEFT JOIN (
                SELECT DISTINCT ON ("productId") 
                    "productId", url, alt
                FROM photos
                ORDER BY "productId", "sortOrder" ASC
            ) ph ON ph."productId" = p.id
            GROUP BY p.id, p.slug, p.name, p.description, p.price, p."categoryId", c.name, c.slug, ph.url, ph.alt
            ORDER BY "totalSold" DESC, p."createdAt" DESC
            LIMIT 10
        `);

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