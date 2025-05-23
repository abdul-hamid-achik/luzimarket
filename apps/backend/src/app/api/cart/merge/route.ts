// @ts-ignore: Allow necessary imports without type declarations
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { dbService, eq, and } from '@/db/service';
import { cartItems } from '@/db/schema';
import { StatusCodes } from 'http-status-codes';

/**
 * @swagger
 * /api/cart/merge:
 *   post:
 *     summary: Merge guest cart with user cart
 *     description: Merge items from a guest session into the authenticated user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               guestSessionId:
 *                 type: string
 *                 description: Guest session ID to merge from (optional - will try to detect from previous guest token if not provided)
 *     responses:
 *       200:
 *         description: Cart merged successfully
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
 *                   example: Cart merged successfully
 *                 itemsMerged:
 *                   type: integer
 *                   description: Number of items merged from guest cart
 *                 conflictsResolved:
 *                   type: integer
 *                   description: Number of item conflicts resolved (quantities combined)
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Failed to merge cart
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

export async function POST(request: NextRequest) {
    const userSessionId = getSessionId(request);
    if (!userSessionId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const guestSessionId = body.guestSessionId;

        // If no guest session ID provided, this is essentially a no-op
        // This handles cases where there was no guest cart to merge
        if (!guestSessionId) {
            return NextResponse.json({
                success: true,
                message: 'No guest cart to merge',
                itemsMerged: 0,
                conflictsResolved: 0
            }, { status: StatusCodes.OK });
        }

        // Get guest cart items
        const guestItems = await dbService.select(cartItems, eq(cartItems.sessionId, guestSessionId));

        if (guestItems.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Guest cart was empty',
                itemsMerged: 0,
                conflictsResolved: 0
            }, { status: StatusCodes.OK });
        }

        // Get user's current cart items
        const userItems = await dbService.select(cartItems, eq(cartItems.sessionId, userSessionId));

        let itemsMerged = 0;
        let conflictsResolved = 0;

        // Create a map of user's current cart items by variantId for quick lookup
        const userItemsMap = new Map();
        userItems.forEach((item: any) => {
            if (item.variantId) {
                userItemsMap.set(item.variantId, item);
            }
        });

        // Process each guest cart item
        for (const guestItem of guestItems) {
            if (!guestItem.variantId) continue;

            const existingUserItem = userItemsMap.get(guestItem.variantId);

            if (existingUserItem) {
                // Item already exists in user cart - combine quantities
                const newQuantity = existingUserItem.quantity + guestItem.quantity;
                await dbService.update(
                    cartItems,
                    { quantity: newQuantity },
                    eq(cartItems.id, existingUserItem.id)
                );
                conflictsResolved++;
            } else {
                // Item doesn't exist in user cart - move it from guest to user
                await dbService.update(
                    cartItems,
                    { sessionId: userSessionId },
                    eq(cartItems.id, guestItem.id)
                );
                itemsMerged++;
            }
        }

        // Clean up any remaining guest items (those that were merged via quantity update)
        if (conflictsResolved > 0) {
            await dbService.delete(cartItems, eq(cartItems.sessionId, guestSessionId));
        }

        return NextResponse.json({
            success: true,
            message: 'Cart merged successfully',
            itemsMerged,
            conflictsResolved
        }, { status: StatusCodes.OK });

    } catch (error) {
        console.error('Error merging cart:', error);
        return NextResponse.json(
            { error: 'Failed to merge cart' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 