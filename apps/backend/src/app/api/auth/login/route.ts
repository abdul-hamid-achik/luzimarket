// @ts-ignore: Allow necessary imports without type declarations
import bcrypt from 'bcryptjs';
// @ts-ignore: Allow jsonwebtoken import without type declarations
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';
import { db } from '@/db';
import { users, sessions, cartItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    const { email, password } = await request.json();
    if (!email || !password) {
        return NextResponse.json(
            { error: 'Email and password required' },
            { status: StatusCodes.BAD_REQUEST }
        );
    }
    // check credentials
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
        return NextResponse.json(
            { error: 'Invalid credentials' },
            { status: StatusCodes.UNAUTHORIZED }
        );
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        return NextResponse.json(
            { error: 'Invalid credentials' },
            { status: StatusCodes.UNAUTHORIZED }
        );
    }
    // create new session for user
    const newSessionRes = await db.insert(sessions).values({ userId: user.id, isGuest: false }).returning({ id: sessions.id }).execute();
    const newSessionId = newSessionRes[0].id;
    // attempt to merge guest cart if provided
    const authHeader = request.headers.get('Authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
        try {
            const payload = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET!);
            if (typeof payload === 'object' && 'sessionId' in payload) {
                const guestSessionId = (payload as any).sessionId;
                await db.update(cartItems).set({ sessionId: newSessionId }).where(eq(cartItems.sessionId, Number(guestSessionId))).execute();
            }
        } catch {
            // ignore invalid guest token
        }
    }
    const token = jwt.sign({ sessionId: newSessionId, userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    return NextResponse.json({ token }, { status: StatusCodes.OK });
} 