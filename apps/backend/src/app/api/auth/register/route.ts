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
    try {
        const { email, password } = await request.json();
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password required' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        const hashed = await bcrypt.hash(password, 10);
        // Insert new user; `id` is auto-assigned by Postgres
        const newUserResult = await db.insert(users)
            .values({ email, password: hashed })
            .returning({ id: users.id })
            .execute();

        const userId = newUserResult[0].id;

        // Insert new session; `id` is auto-assigned by Postgres
        const newSessionResult = await db.insert(sessions)
            .values({ userId, isGuest: false })
            .returning({ id: sessions.id })
            .execute();
        const sessionId = newSessionResult[0].id;
        const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';
        const token = jwt.sign({ sessionId, userId }, jwtSecret, { expiresIn: '7d' });
        return NextResponse.json({ token }, { status: StatusCodes.CREATED });
    } catch (error) {
        console.error('Error registering user:', error);
        return NextResponse.json({ error: 'Registration failed' }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
    }
} 