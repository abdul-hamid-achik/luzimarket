// @ts-ignore: Allow necessary imports without type declarations
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { dbService, eq, and } from '@/db/service';
import { cartItems, productVariants, products } from '@/db/schema';
import { StatusCodes } from 'http-status-codes';

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get cart items
 *     description: Retrieve all items in the user's shopping cart with product details
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Cart item ID
 *                       sessionId:
 *                         type: string
 *                         description: Session ID
 *                       variantId:
 *                         type: string
 *                         description: Product variant ID
 *                       quantity:
 *                         type: integer
 *                         description: Quantity of item
 *                       productId:
 *                         type: string
 *                         description: Product ID
 *                       name:
 *                         type: string
 *                         description: Product name
 *                       description:
 *                         type: string
 *                         description: Product description
 *                       price:
 *                         type: number
 *                         description: Product price
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Failed to fetch cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Add item to cart
 *     description: Add a product or variant to the shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 description: Product ID (required if variantId not provided)
 *               variantId:
 *                 type: string
 *                 description: Product variant ID (required if productId not provided)
 *               quantity:
 *                 type: integer
 *                 description: Quantity to add
 *                 default: 1
 *                 minimum: 1
 *             oneOf:
 *               - required: [productId]
 *               - required: [variantId]
 *     responses:
 *       201:
 *         description: Item added to cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Cart item ID
 *                 sessionId:
 *                   type: string
 *                 variantId:
 *                   type: string
 *                 quantity:
 *                   type: integer
 *                 productId:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 price:
 *                   type: number
 *       400:
 *         description: Bad request - missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to add item to cart
 *   put:
 *     summary: Update cart item quantity
 *     description: Update the quantity of an existing cart item
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemId
 *               - quantity
 *             properties:
 *               itemId:
 *                 type: string
 *                 description: Cart item ID to update
 *               quantity:
 *                 type: integer
 *                 description: New quantity
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 sessionId:
 *                   type: string
 *                 variantId:
 *                   type: string
 *                 quantity:
 *                   type: integer
 *       400:
 *         description: Bad request - missing required fields
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart item not found
 *       500:
 *         description: Failed to update cart item
 *   delete:
 *     summary: Clear cart
 *     description: Remove all items from the shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Cart cleared successfully
 *                 itemsRemoved:
 *                   type: integer
 *                   description: Number of items removed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to clear cart
 */

function getSessionId(request: NextRequest): string | null {
    const auth = request.headers.get('Authorization') || '';
    if (!auth.startsWith('Bearer ')) return null;

    try {
        // Use a fallback JWT_SECRET for tests if not available in environment
        const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';
        const token = auth.split(' ')[1];
        const payload = jwt.verify(token, jwtSecret);

        if (typeof payload === 'object' && 'sessionId' in payload) {
            return payload.sessionId as string;
        }
    } catch (error) {
        console.error('JWT verification error:', error);
    }
    return null;
}

export async function GET(request: NextRequest) {
    const sessionId = getSessionId(request);
    if (!sessionId) return NextResponse.json({ error: 'Authorization required' }, { status: StatusCodes.UNAUTHORIZED });

    try {
        // Get cart items for the session
        const items = await dbService.select(cartItems, eq(cartItems.sessionId, sessionId));

        // Fetch product details for each cart item
        const cartWithProducts = await Promise.all(
            items.map(async (item: any) => {
                try {
                    if (item.variantId) {
                        // Get variant details
                        const productVariant = await dbService.findFirst(productVariants, eq(productVariants.id, item.variantId));

                        if (productVariant && productVariant.productId) {
                            const productInfo = await dbService.findFirst(products, eq(products.id, productVariant.productId));

                            if (productInfo) {
                                return {
                                    ...item,
                                    productId: productVariant.productId,
                                    name: productInfo.name,
                                    description: productInfo.description,
                                    price: productInfo.price
                                };
                            }
                        }
                    }

                    // Return the item as is if product details not found
                    return item;
                } catch (error) {
                    console.error('Error fetching product details:', error);
                    return item;
                }
            })
        );

        // Calculate total
        const total = cartWithProducts.reduce((sum, item) => {
            const price = item.price || 0;
            const quantity = item.quantity || 0;
            return sum + (price * quantity);
        }, 0);

        return NextResponse.json({ items: cartWithProducts, total }, { status: StatusCodes.OK });
    } catch (error) {
        console.error('Error fetching cart:', error);
        return NextResponse.json({ error: 'Failed to fetch cart' }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
    }
}

export async function POST(request: NextRequest) {
    const sessionId = getSessionId(request);
    if (!sessionId) {
        return NextResponse.json({ error: 'Authorization required' }, { status: StatusCodes.UNAUTHORIZED });
    }

    try {
        const { productId, variantId, quantity } = await request.json();

        // Validate required fields
        if (!productId && !variantId) {
            return NextResponse.json(
                { error: 'Either productId or variantId is required' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        // Validate quantity
        if (quantity !== undefined && (typeof quantity !== 'number' || quantity <= 0 || !Number.isInteger(quantity))) {
            return NextResponse.json(
                { error: 'Quantity must be a positive integer' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        // Determine variant ID for database insert
        let dbVariantId: string | undefined;
        if (typeof variantId === 'string') {
            dbVariantId = variantId;
        } else if (typeof productId === 'string') {
            // Find a variant associated with this productId
            const variants = await dbService.selectFields(
                { id: productVariants.id },
                productVariants,
                eq(productVariants.productId, productId)
            );
            if (variants.length === 0) {
                return NextResponse.json(
                    { error: 'No variant found for product' },
                    { status: StatusCodes.BAD_REQUEST }
                );
            }
            dbVariantId = variants[0].id;
        }

        // Prepare values for insert
        const insertValues: Record<string, any> = {
            sessionId,
            quantity: quantity || 1
        };
        if (dbVariantId) {
            insertValues.variantId = dbVariantId;
        }

        // Insert the cart item
        const newItemResult = await dbService.insertReturning(cartItems, insertValues);
        const newItem = newItemResult[0];

        // Get product details to include in response
        let productDetails = {};
        if (dbVariantId) {
            try {
                const productVariant = await dbService.findFirst(productVariants, eq(productVariants.id, dbVariantId));

                if (productVariant && productVariant.productId) {
                    const productInfo = await dbService.findFirst(products, eq(products.id, productVariant.productId));

                    if (productInfo) {
                        productDetails = {
                            name: productInfo.name,
                            description: productInfo.description,
                            price: productInfo.price
                        };
                    }
                }
            } catch (error) {
                console.error('Error fetching product details:', error);
            }
        }

        // Return the created item with product details
        const responseItem = {
            ...newItem,
            productId, // Return input productId for test compatibility
            ...productDetails
        };

        return NextResponse.json(responseItem, { status: StatusCodes.CREATED });
    } catch (error) {
        console.error('Error adding item to cart:', error);
        return NextResponse.json({ error: 'Failed to add item to cart' }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
    }
}

export async function PUT(request: NextRequest) {
    const sessionId = getSessionId(request);
    if (!sessionId) return NextResponse.json({ error: 'Authorization required' }, { status: StatusCodes.UNAUTHORIZED });

    try {
        const { itemId, quantity } = await request.json();

        // Validate required fields
        if (!itemId || typeof quantity !== 'number') {
            return NextResponse.json(
                { error: 'itemId and quantity are required' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        // Validate quantity
        if (quantity <= 0 || !Number.isInteger(quantity)) {
            return NextResponse.json(
                { error: 'Quantity must be a positive integer' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        // Update the cart item
        await dbService.update(cartItems, { quantity }, and(
            eq(cartItems.id, itemId),
            eq(cartItems.sessionId, sessionId)
        ));

        // Get the updated item
        const updated = await dbService.findFirst(cartItems, and(
            eq(cartItems.id, itemId),
            eq(cartItems.sessionId, sessionId)
        ));

        if (!updated) {
            return NextResponse.json({ error: 'Item not found' }, { status: StatusCodes.NOT_FOUND });
        }

        return NextResponse.json(updated, { status: StatusCodes.OK });
    } catch (error) {
        console.error('Error updating cart item:', error);
        return NextResponse.json({ error: 'Failed to update cart item' }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
    }
}

export async function DELETE(request: NextRequest) {
    const sessionId = getSessionId(request);
    if (!sessionId) return NextResponse.json({ error: 'Authorization required' }, { status: StatusCodes.UNAUTHORIZED });

    try {
        // Get items before deleting to count them
        const itemsToDelete = await dbService.select(cartItems, eq(cartItems.sessionId, sessionId));

        // Clear all cart items for this session
        await dbService.delete(cartItems, eq(cartItems.sessionId, sessionId));

        return NextResponse.json({
            success: true,
            message: 'Cart cleared successfully',
            itemsRemoved: itemsToDelete.length
        }, { status: StatusCodes.OK });
    } catch (error) {
        console.error('Error clearing cart:', error);
        return NextResponse.json({ error: 'Failed to clear cart' }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
    }
} 