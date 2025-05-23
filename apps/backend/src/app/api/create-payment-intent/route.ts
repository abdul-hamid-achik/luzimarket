import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { dbService, eq } from '@/db/service';
import { sessions, orders, users } from '@/db/schema';

/**
 * @swagger
 * /api/create-payment-intent:
 *   post:
 *     summary: Create Stripe payment intent
 *     description: Create a payment intent for processing order payments through Stripe
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - amount
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *                 description: Order ID to create payment for
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               amount:
 *                 type: number
 *                 description: Payment amount in the specified currency
 *                 example: 299.99
 *               currency:
 *                 type: string
 *                 description: Payment currency code
 *                 default: mxn
 *                 example: mxn
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientSecret:
 *                   type: string
 *                   description: Stripe client secret for payment confirmation
 *                   example: pi_1234567890_secret_abcdefghijklmnop
 *                 paymentIntentId:
 *                   type: string
 *                   description: Stripe payment intent ID
 *                   example: pi_1234567890abcdefghijklmnop
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Missing orderId or amount
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Order not found or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Order not found
 *       500:
 *         description: Failed to create payment intent
 *       503:
 *         description: Payment service not configured
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Payment service not configured
 */

// Check if Stripe is configured, and only initialize if it is
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = STRIPE_SECRET_KEY ? require('stripe')(STRIPE_SECRET_KEY) : null;

function getSessionId(request: NextRequest): string | null {
    const auth = request.headers.get('Authorization') || '';
    if (!auth.startsWith('Bearer ')) return null;
    try {
        const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';
        const payload = jwt.verify(auth.split(' ')[1], jwtSecret);
        if (typeof payload === 'object' && 'sessionId' in payload) return String(payload.sessionId);
    } catch { }
    return null;
}

function isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

export async function POST(request: NextRequest) {
    try {
        // Check if Stripe is configured
        if (!stripe) {
            return NextResponse.json(
                { error: 'Payment service not configured' },
                { status: 503 }
            );
        }

        const sessionId = getSessionId(request);
        if (!sessionId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get session and user info
        const session = await dbService.findFirst(sessions, eq(sessions.id, sessionId));
        if (!session || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await dbService.findFirst(users, eq(users.id, session.userId));
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { orderId, amount, currency = 'mxn' } = await request.json();

        if (!orderId || !amount) {
            return NextResponse.json({ error: 'Missing orderId or amount' }, { status: 400 });
        }

        // Validate UUID format before querying database
        if (!isValidUUID(orderId)) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Verify the order belongs to the user
        const order = await dbService.findFirst(orders, eq(orders.id, orderId));
        if (!order || order.userId !== session.userId) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Create payment intent with metadata
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency,
            customer: user.stripe_customer_id,
            metadata: {
                order_id: orderId,
                user_id: session.userId,
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        // Update order with payment intent ID
        await dbService.update(orders, {
            payment_intent_id: paymentIntent.id,
            payment_status: 'processing',
            stripe_customer_id: user.stripe_customer_id,
            updatedAt: new Date(),
        }, eq(orders.id, orderId));

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        });

    } catch (error) {
        console.error('Error creating payment intent:', error);
        return NextResponse.json(
            { error: 'Failed to create payment intent' },
            { status: 500 }
        );
    }
} 