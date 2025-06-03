import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbService, eq, and } from '@/db/service';
import { favorites, productVariants, products } from '@/db/schema';
// @ts-ignore
import jwt from 'jsonwebtoken';

// Helper function to get user ID from request
function getUserId(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests') as any;
        return decoded.userId;
    } catch {
        return null;
    }
}

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Get user favorites
 *     description: Retrieve a list of user's favorite products with product details
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Favorite ID
 *                   userId:
 *                     type: string
 *                     description: User ID
 *                   variantId:
 *                     type: string
 *                     description: Product variant ID
 *                   productId:
 *                     type: string
 *                     description: Product ID
 *                   productName:
 *                     type: string
 *                     description: Product name
 *                   productPrice:
 *                     type: number
 *                     description: Product price
 *                   productDescription:
 *                     type: string
 *                     description: Product description
 *                   imageUrl:
 *                     type: string
 *                     description: Product image URL
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch favorites
 *   post:
 *     summary: Add product to favorites
 *     description: Add a product variant to user's favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - variantId
 *             properties:
 *               variantId:
 *                 type: string
 *                 description: Product variant ID to add to favorites
 *               productId:
 *                 type: string
 *                 description: Product ID (alternative to variantId)
 *     responses:
 *       201:
 *         description: Product added to favorites successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 variantId:
 *                   type: string
 *                 productId:
 *                   type: string
 *                 productName:
 *                   type: string
 *       400:
 *         description: Bad request - missing variantId or product not found
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Product already in favorites
 *       500:
 *         description: Failed to add to favorites
 *   delete:
 *     summary: Remove product from favorites
 *     description: Remove a product from user's favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - variantId
 *             properties:
 *               variantId:
 *                 type: string
 *                 description: Product variant ID to remove from favorites
 *     responses:
 *       200:
 *         description: Product removed from favorites successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - missing variantId
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Favorite not found
 *       500:
 *         description: Failed to remove from favorites
 */

export async function GET(request: NextRequest) {
    const userId = getUserId(request);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });
    }

    try {
        // Get user's favorites with product details
        const userFavorites = await dbService.select(favorites, eq(favorites.userId, userId));

        const favoritesWithDetails = [];
        for (const favorite of userFavorites) {
            if (favorite.variantId) {
                // Get variant and product details
                const variant = await dbService.findFirst(productVariants, eq(productVariants.id, favorite.variantId));
                if (variant && variant.productId) {
                    const product = await dbService.findFirst(products, eq(products.id, variant.productId));
                    if (product) {
                        favoritesWithDetails.push({
                            ...favorite,
                            productId: product.id,
                            productName: product.name,
                            productPrice: product.price,
                            productDescription: product.description,
                            imageUrl: null // Will be populated from photos if needed
                        });
                    }
                }
            }
        }

        return NextResponse.json(favoritesWithDetails, { status: StatusCodes.OK });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
    }
}

export async function POST(request: NextRequest) {
    const userId = getUserId(request);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });
    }

    try {
        const { variantId, productId } = await request.json();

        if (!variantId && !productId) {
            return NextResponse.json(
                { error: 'Either variantId or productId is required' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        let dbVariantId = variantId;

        // Validate the variant if provided directly
        if (dbVariantId) {
            const variantExists = await dbService.findFirst(
                productVariants,
                eq(productVariants.id, dbVariantId)
            );
            if (!variantExists) {
                return NextResponse.json(
                    { error: 'Variant not found' },
                    { status: StatusCodes.BAD_REQUEST }
                );
            }
        }

        // If productId provided, find first variant for that product
        if (!dbVariantId && productId) {
            const variants = await dbService.select(productVariants, eq(productVariants.productId, productId));
            if (variants.length === 0) {
                return NextResponse.json(
                    { error: 'No variant found for product' },
                    { status: StatusCodes.BAD_REQUEST }
                );
            }
            dbVariantId = variants[0].id;
        }

        // Check if already favorited
        const existingFavorite = await dbService.findFirst(
            favorites,
            and(eq(favorites.userId, userId), eq(favorites.variantId, dbVariantId))
        );

        if (existingFavorite) {
            return NextResponse.json(
                { error: 'Product already in favorites' },
                { status: StatusCodes.CONFLICT }
            );
        }

        // Add to favorites
        const newFavoriteResult = await dbService.insertReturning(favorites, {
            userId,
            variantId: dbVariantId
        });

        const newFavorite = newFavoriteResult[0];

        // Get product details for response
        const variant = await dbService.findFirst(productVariants, eq(productVariants.id, dbVariantId));
        let productDetails = {};
        if (variant && variant.productId) {
            const product = await dbService.findFirst(products, eq(products.id, variant.productId));
            if (product) {
                productDetails = {
                    productId: product.id,
                    productName: product.name,
                    productPrice: product.price
                };
            }
        }

        return NextResponse.json({
            ...newFavorite,
            ...productDetails
        }, { status: StatusCodes.CREATED });

    } catch (error) {
        console.error('Error adding to favorites:', error);
        return NextResponse.json({ error: 'Failed to add to favorites' }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
    }
}

export async function DELETE(request: NextRequest) {
    const userId = getUserId(request);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });
    }

    try {
        const { variantId } = await request.json();

        if (!variantId) {
            return NextResponse.json(
                { error: 'variantId is required' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        // Find and delete the favorite
        const favorite = await dbService.findFirst(
            favorites,
            and(eq(favorites.userId, userId), eq(favorites.variantId, variantId))
        );

        if (!favorite) {
            return NextResponse.json(
                { error: 'Favorite not found' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        await dbService.delete(
            favorites,
            and(eq(favorites.userId, userId), eq(favorites.variantId, variantId))
        );

        return NextResponse.json({
            success: true,
            message: 'Product removed from favorites'
        }, { status: StatusCodes.OK });

    } catch (error) {
        console.error('Error removing from favorites:', error);
        return NextResponse.json({ error: 'Failed to remove from favorites' }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
    }
} 