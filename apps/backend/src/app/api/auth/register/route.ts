// @ts-ignore: Allow necessary imports without type declarations
import bcrypt from 'bcryptjs';
// @ts-ignore: Allow jsonwebtoken import without type declarations
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';
import { dbService, eq } from '@/db/service';
import { users, sessions } from '@/db/schema';

export async function POST(request: NextRequest) {
    try {
        const { email, password, stripe_customer_id } = await request.json();
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password required' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        // Check if user already exists
        const existingUser = await dbService.findFirst(users, eq(users.email, email));
        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists' },
                { status: StatusCodes.CONFLICT }
            );
        }

        // Hash password
        const hashed = await bcrypt.hash(password, 12);

        // Create user
        const newUserResult = await dbService.insertReturning(users, {
            email,
            password: hashed,
            stripe_customer_id
        }, { id: users.id });

        const newUserId = newUserResult[0].id;

        // Create session
        const newSessionResult = await dbService.insertReturning(sessions, {
            userId: newUserId,
            isGuest: false
        }, { id: sessions.id });

        const newSessionId = newSessionResult[0].id;

        // Generate JWT
        const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';
        const token = jwt.sign({
            sessionId: newSessionId,
            userId: newUserId,
            email: email
        }, jwtSecret, { expiresIn: '7d' });

        return NextResponse.json({ token }, { status: StatusCodes.CREATED });
    } catch (error) {
        console.error('Error during registration:', error);
        return NextResponse.json(
            { error: 'Registration failed' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 