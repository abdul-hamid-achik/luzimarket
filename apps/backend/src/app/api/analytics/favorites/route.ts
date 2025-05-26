import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbService, eq } from '@/db/service';
import { favorites, productVariants, products, photos, categories } from '@/db/schema';
import { sql, desc } from 'drizzle-orm';

/**
 * @swagger
 * /api/analytics/favorites:
 *   get:
 *     summary: Get favorites analytics
 *     description: Retrieve analytics data about most favorited products
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of top favorites to return
 *     responses:
 *       200:
 *         description: Favorites analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalFavorites:
 *                   type: integer
 *                   description: Total number of favorites across all products
 *                 topFavorites:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       productId:
 *                         type: string
 *                       productName:
 *                         type: string
 *                       productPrice:
 *                         type: number
 *                       productDescription:
 *                         type: string
 *                       imageUrl:
 *                         type: string
 *                       favoriteCount:
 *                         type: integer
 *                       categoryName:
 *                         type: string
 *       500:
 *         description: Failed to fetch favorites analytics
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Max 50 items

        // Use raw database access for complex queries
        const db = dbService.raw;

        // Get total favorites count
        const totalFavoritesResult = await db
            .select({
                count: sql<number>`COUNT(*)`.as('count')
            })
            .from(favorites);

        const totalFavorites = totalFavoritesResult[0]?.count || 0;

        // Get most favorited products with counts
        const topFavoritesResult = await db
            .select({
                productId: products.id,
                productName: products.name,
                productPrice: products.price,
                productDescription: products.description,
                categoryId: products.categoryId,
                favoriteCount: sql<number>`COUNT(${favorites.id})`.as('favoriteCount')
            })
            .from(products)
            .innerJoin(productVariants, eq(products.id, productVariants.productId))
            .innerJoin(favorites, eq(productVariants.id, favorites.variantId))
            .groupBy(
                products.id,
                products.name,
                products.price,
                products.description,
                products.categoryId
            )
            .orderBy(desc(sql`COUNT(${favorites.id})`))
            .limit(limit);

        // Enrich with photos and category info
        const enrichedTopFavorites = [];
        for (const favorite of topFavoritesResult) {
            // Get main photo
            const photoResult = await db
                .select({
                    url: photos.url,
                    alt: photos.alt
                })
                .from(photos)
                .where(eq(photos.productId, favorite.productId))
                .orderBy(photos.sortOrder)
                .limit(1);

            // Get category name
            let categoryName = null;
            if (favorite.categoryId) {
                const categoryResult = await db
                    .select({
                        name: categories.name
                    })
                    .from(categories)
                    .where(eq(categories.id, favorite.categoryId))
                    .limit(1);
                categoryName = categoryResult[0]?.name || null;
            }

            enrichedTopFavorites.push({
                productId: favorite.productId,
                productName: favorite.productName,
                productPrice: favorite.productPrice,
                productDescription: favorite.productDescription,
                imageUrl: photoResult[0]?.url || null,
                imageAlt: photoResult[0]?.alt || favorite.productName,
                favoriteCount: Number(favorite.favoriteCount),
                categoryName: categoryName
            });
        }

        return NextResponse.json({
            totalFavorites: Number(totalFavorites),
            topFavorites: enrichedTopFavorites
        }, { status: StatusCodes.OK });

    } catch (error) {
        console.error('Error fetching favorites analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch favorites analytics' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 