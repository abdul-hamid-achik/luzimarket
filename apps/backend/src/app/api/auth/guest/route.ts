// @ts-ignore: Allow jsonwebtoken import
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';
import { dbService } from '@/db/service';
import { sessions } from '@/db/schema';

export async function POST() {
    try {
        // Create a guest session with generated UUID
        const insertResult = await dbService.insertReturning(sessions,
            { isGuest: true },
            { id: sessions.id }
        );

        const sessionId = insertResult[0].id;
        // Use a fallback JWT_SECRET for tests if not available in environment
        const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';
        const token = jwt.sign({ sessionId, guest: true }, jwtSecret, { expiresIn: '7d' });
        return NextResponse.json({ token }, { status: StatusCodes.OK });
    } catch (error) {
        console.error('Failed to create guest session:', error);
        return NextResponse.json(
            { error: 'Failed to create guest session' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 