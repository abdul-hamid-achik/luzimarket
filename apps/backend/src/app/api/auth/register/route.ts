// @ts-ignore: Allow necessary imports without type declarations
import bcrypt from 'bcryptjs';
// @ts-ignore: Allow jsonwebtoken import without type declarations
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';
import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password required' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        // Get a safe ID to avoid primary key conflicts for user
        const maxUserIdResult = await db.execute(sql`SELECT MAX(id) + 1000 as next_id FROM users`);
        const nextUserId = maxUserIdResult.rows && maxUserIdResult.rows.length > 0 && maxUserIdResult.rows[0].next_id
            ? Number(maxUserIdResult.rows[0].next_id)
            : Math.floor(Math.random() * 100000) + 10000; // Use a random high number if no results

        const hashed = await bcrypt.hash(password, 10);
        const newUser = await db.insert(users)
            .values({
                id: nextUserId,
                email,
                password: hashed
            })
            .returning({ id: users.id })
            .execute();

        const userId = newUser[0].id;

        // Get a safe ID to avoid primary key conflicts for session
        const maxSessionIdResult = await db.execute(sql`SELECT MAX(id) + 1000 as next_id FROM sessions`);
        const nextSessionId = maxSessionIdResult.rows && maxSessionIdResult.rows.length > 0 && maxSessionIdResult.rows[0].next_id
            ? Number(maxSessionIdResult.rows[0].next_id)
            : Math.floor(Math.random() * 100000) + 10000; // Use a random high number if no results

        // create non-guest session
        const session = await db.insert(sessions)
            .values({
                id: nextSessionId,
                userId,
                isGuest: false
            })
            .returning({ id: sessions.id })
            .execute();

        const sessionId = session[0].id;
        const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';
        const token = jwt.sign({ sessionId, userId }, jwtSecret, { expiresIn: '7d' });
        return NextResponse.json({ token }, { status: StatusCodes.CREATED });
    } catch (error) {
        console.error('Error registering user:', error);
        return NextResponse.json({ error: 'Registration failed' }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
    }
} 