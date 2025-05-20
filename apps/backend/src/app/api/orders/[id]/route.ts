// @ts-ignore: Allow necessary imports without type declarations
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions, orders } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';

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

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!session || !session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });
    }

    const { id } = await params;
    const orderId = id;
    try {
        const [order] = await db.select().from(orders)
            .where(and(
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