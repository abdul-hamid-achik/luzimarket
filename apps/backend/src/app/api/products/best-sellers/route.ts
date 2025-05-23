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
        // Use Drizzle ORM for cross-database compatibility
        // First, get products with their order counts using Drizzle
        const productsWithSales = await dbService.selectFields(
            {
                id: products.id,
                slug: products.slug,
                name: products.name,
                description: products.description,
                price: products.price,
                categoryId: products.categoryId,
                createdAt: products.createdAt,
            },
            products
        );

        // Get categories
        const allCategories = await dbService.select(categories);
        const categoryMap = new Map(allCategories.map((cat: any) => [cat.id, cat]));

        // Get photos
        const allPhotos = await dbService.select(photos);
        const photoMap = new Map();
        allPhotos.forEach((photo: any) => {
            if (!photoMap.has(photo.productId) || photo.sortOrder === 0) {
                photoMap.set(photo.productId, photo);
            }
        });

        // Get sales data
        const allOrderItems = await dbService.select(orderItems);
        const allVariants = await dbService.select(productVariants);

        // Create variant to product mapping
        const variantToProduct = new Map(allVariants.map((variant: any) => [variant.id, variant.productId]));

        // Calculate sales per product
        const salesMap = new Map();
        allOrderItems.forEach((item: any) => {
            const productId = variantToProduct.get(item.variantId);
            if (productId) {
                salesMap.set(productId, (salesMap.get(productId) || 0) + item.quantity);
            }
        });

        // Combine all data and format
        const formattedBestSellers: BestSellerProduct[] = productsWithSales
            .map((product: any) => {
                const category = categoryMap.get(product.categoryId) as any;
                const photo = photoMap.get(product.id) as any;
                const totalSold = salesMap.get(product.id) || 0;

                return {
                    id: product.id,
                    slug: product.slug,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    categoryId: product.categoryId,
                    categoryName: category?.name || '',
                    categorySlug: category?.slug || '',
                    imageUrl: photo?.url || '',
                    imageAlt: photo?.alt || product.name,
                    totalSold: Number(totalSold)
                };
            })
            .sort((a: any, b: any) => {
                // Sort by total sold descending, then by creation date descending
                if (b.totalSold !== a.totalSold) {
                    return b.totalSold - a.totalSold;
                }
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            })
            .slice(0, 10); // Get top 10

        return NextResponse.json(formattedBestSellers, { status: StatusCodes.OK });
    } catch (error) {
        console.error('Error fetching best sellers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch best sellers' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 