// @ts-ignore: Allow necessary imports without type declarations
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions, cartItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';

function getSessionId(request: NextRequest): number | null {
    const auth = request.headers.get('Authorization') || '';
    if (!auth.startsWith('Bearer ')) return null;
    try {
        const payload = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET!);
        if (typeof payload === 'object' && 'sessionId' in payload) return (payload as any).sessionId;
    } catch { }
    return null;
}

export async function GET(request: NextRequest) {
    const sessionId = getSessionId(request);
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });
    const items = await db.select().from(cartItems).where(eq(cartItems.sessionId, sessionId));
    return NextResponse.json({ items }, { status: StatusCodes.OK });
}

export async function POST(request: NextRequest) {
    const sessionId = getSessionId(request);
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });
    const { productId, variantId, quantity } = await request.json();
    const newItem = await db.insert(cartItems).values({ sessionId, variantId: variantId || productId, quantity }).returning().execute();
    return NextResponse.json(newItem[0], { status: StatusCodes.CREATED });
}

export async function PUT(request: NextRequest) {
    const sessionId = getSessionId(request);
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });
    const { itemId, quantity } = await request.json();
    const updated = await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, itemId)).returning().execute();
    return NextResponse.json(updated[0], { status: StatusCodes.OK });
}

export async function DELETE(request: NextRequest) {
    const sessionId = getSessionId(request);
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });
    const { itemId } = await request.json();
    await db.delete(cartItems).where(eq(cartItems.id, itemId)).execute();
    return NextResponse.json({ success: true }, { status: StatusCodes.OK });
} 