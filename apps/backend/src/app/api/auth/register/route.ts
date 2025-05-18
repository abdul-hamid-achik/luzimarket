// @ts-ignore: Allow necessary imports without type declarations
import bcrypt from 'bcryptjs';
// @ts-ignore: Allow jsonwebtoken import without type declarations
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';
import { db } from '@/db';
import { users, sessions } from '@/db/schema';

export async function POST(request: NextRequest) {
    const { email, password } = await request.json();
    if (!email || !password) {
        return NextResponse.json(
            { error: 'Email and password required' },
            { status: StatusCodes.BAD_REQUEST }
        );
    }
    const hashed = await bcrypt.hash(password, 10);
    const newUser = await db.insert(users).values({ email, password: hashed }).returning({ id: users.id }).execute();
    const userId = newUser[0].id;
    // create non-guest session
    const session = await db.insert(sessions).values({ userId, isGuest: false }).returning({ id: sessions.id }).execute();
    const sessionId = session[0].id;
    const token = jwt.sign({ sessionId, userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    return NextResponse.json({ token }, { status: StatusCodes.CREATED });
} 