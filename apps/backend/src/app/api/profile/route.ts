// @ts-ignore: Allow necessary imports
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';

function getSessionId(request: NextRequest): string | null {
    const auth = request.headers.get('Authorization') || '';
    if (!auth.startsWith('Bearer ')) return null;
    try {
        const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';
        const payload = jwt.verify(auth.split(' ')[1], jwtSecret);
        if (typeof payload === 'object' && 'sessionId' in payload) return (payload as any).sessionId as string;
    } catch { }
    return null;
}

export async function GET(request: NextRequest) {
    const sessionId = getSessionId(request);
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId!));
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });
    const [user] = await db.select().from(users).where(eq(users.id, session.userId!));
    const { password: _pw, ...safeUser } = user;
    return NextResponse.json({ user: safeUser }, { status: StatusCodes.OK });
}

export async function PUT(request: NextRequest) {
    const sessionId = getSessionId(request);
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId!));
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });
    const data = await request.json();
    if (data.password) delete data.password; // disallow password change here
    // Update user fields
    await db.update(users)
        .set(data)
        .where(eq(users.id, session.userId!))
        .execute();
    // Fetch updated user
    const [updatedUser] = await db.select().from(users).where(eq(users.id, session.userId!));
    const { password: _pw2, ...safeUpdatedUser } = updatedUser;
    return NextResponse.json({ user: safeUpdatedUser }, { status: StatusCodes.OK });
} 