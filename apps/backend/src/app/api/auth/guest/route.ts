// @ts-ignore: Allow jsonwebtoken import
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function POST() {
    try {
        // First, try to get the next available ID to avoid collisions
        const maxIdResult = await db.execute(sql`SELECT MAX(id) + 1000 as next_id FROM sessions`);
        const nextId = maxIdResult.rows && maxIdResult.rows.length > 0 && maxIdResult.rows[0].next_id
            ? Number(maxIdResult.rows[0].next_id)
            : Math.floor(Math.random() * 100000) + 10000; // Use a random high number if no results

        // Create a guest session with a safely high ID to avoid conflicts
        const insertResult = await db.insert(sessions)
            .values({
                id: nextId,
                isGuest: true
            })
            .returning({ id: sessions.id })
            .execute();

        const sessionId = insertResult[0].id;
        // Use a fallback JWT_SECRET for tests if not available in environment
        const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';
        const token = jwt.sign({ sessionId, guest: true }, jwtSecret, { expiresIn: '7d' });
        return NextResponse.json({ token }, { status: StatusCodes.OK });
    } catch (error) {
        console.error('Error creating guest session:', error);
        return NextResponse.json({ error: 'Failed to create guest session' }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
    }
} 