import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/db';
import { sessions, orders, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
        const sessionId = getSessionId(request);
        if (!sessionId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get session and user info
        const [session] = await (db as any).select().from(sessions).where(eq(sessions.id, sessionId));
        if (!session || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const [user] = await (db as any).select().from(users).where(eq(users.id, session.userId));
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
        const [order] = await (db as any).select().from(orders).where(eq(orders.id, orderId));
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
        await (db as any)
            .update(orders)
            .set({
                payment_intent_id: paymentIntent.id,
                payment_status: 'processing',
                stripe_customer_id: user.stripe_customer_id,
                updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

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