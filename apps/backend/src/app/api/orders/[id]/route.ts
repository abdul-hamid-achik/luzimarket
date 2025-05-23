// @ts-ignore: Allow necessary imports without type declarations
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { dbService, eq, and } from '@/db/service';
import { sessions, orders } from '@/db/schema';
import { StatusCodes } from 'http-status-codes';

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     description: Retrieve a specific order by ID for the authenticated user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Order ID
 *                 userId:
 *                   type: string
 *                   description: User ID
 *                 total:
 *                   type: number
 *                   description: Order total amount
 *                 status:
 *                   type: string
 *                   description: Order status
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Order creation date
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Order not found or not owned by user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Order not found
 *       500:
 *         description: Failed to fetch order
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to fetch order
 */

function getSessionId(request: NextRequest): string | null {
    const auth = request.headers.get('Authorization') || '';
    if (!auth.startsWith('Bearer ')) return null;

    try {
        const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';
        const payload = jwt.verify(auth.split(' ')[1], jwtSecret);

        if (typeof payload === 'object' && 'sessionId' in payload) {
            return payload.sessionId as string;
        }
    } catch (error) {
        console.error('JWT verification error:', error);
    }
    return null;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const sessionId = getSessionId(request);
    if (!sessionId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });
    }

    const session = await dbService.findFirst(sessions, eq(sessions.id, sessionId));
    if (!session || !session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });
    }

    const { id } = await params;
    const orderId = id;
    try {
        const order = await dbService.findFirst(orders, and(
            eq(orders.id, orderId),
            eq(orders.userId, session.userId)
        ));

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: StatusCodes.NOT_FOUND });
        }

        return NextResponse.json(order, { status: StatusCodes.OK });
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
    }
} 