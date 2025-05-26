// @ts-ignore: Allow necessary imports without type declarations
import bcrypt from 'bcryptjs';
// @ts-ignore: Allow jsonwebtoken import without type declarations
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbService, eq } from '@/db/service';
import { users, sessions, refreshTokens } from '@/db/schema';
import { randomBytes } from 'crypto';

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: User registration
 *     description: Register a new user account with email and password, returns a JWT token for immediate authentication
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: newuser@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password (will be hashed)
 *                 minLength: 6
 *                 example: securePassword123
 *               name:
 *                 type: string
 *                 description: User's full name
 *                 example: John Doe
 *               stripe_customer_id:
 *                 type: string
 *                 description: Optional Stripe customer ID for payment processing
 *                 example: cus_1234567890
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT authentication token
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken:
 *                   type: string
 *                   description: Refresh token for future authentication
 *                   example: 1234567890abcdef1234567890abcdef1234567890
 *                 user:
 *                   type: object
 *                   description: User information (without password)
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: lm_usr_abc123
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: newuser@example.com
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     role:
 *                       type: string
 *                       example: customer
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: integer
 *                       description: Unix timestamp
 *                       example: 1640995200
 *                     updatedAt:
 *                       type: integer
 *                       description: Unix timestamp
 *                       example: 1640995200
 *       400:
 *         description: Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Email and password required
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: User already exists
 *       500:
 *         description: Registration failed due to server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
    try {
        const { email, password, name, stripe_customer_id } = await request.json();
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password required' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        // Validate password strength (at least 6 characters)
        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters long' },
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
            name,
            stripe_customer_id
        });

        const newUserId = (newUserResult[0] as any).id;

        // Create session
        const newSessionResult = await dbService.insertReturning(sessions, {
            userId: newUserId,
            isGuest: false
        });

        const newSessionId = (newSessionResult[0] as any).id;

        // Generate JWT
        const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';
        const token = jwt.sign({
            sessionId: newSessionId,
            userId: newUserId,
            email: email,
            isGuest: false
        }, jwtSecret, { expiresIn: '7d' });

        // Generate refresh token
        const refreshTokenDuration = parseInt(process.env.REFRESH_TOKEN_DURATION_HOURS || '168') * 60 * 60 * 1000; // Default 7 days in ms
        const refreshToken = randomBytes(64).toString('hex');
        const refreshTokenExpiry = new Date(Date.now() + refreshTokenDuration);

        console.log('[REGISTER] Creating refresh token for user:', email);
        console.log('[REGISTER] Refresh token length:', refreshToken.length);
        console.log('[REGISTER] Refresh token expires at:', refreshTokenExpiry.toISOString());

        await dbService.insert(refreshTokens, {
            userId: newUserId,
            token: refreshToken,
            expiresAt: refreshTokenExpiry,
            isRevoked: false
        });

        console.log('[REGISTER] Refresh token saved to database successfully');

        // Extract user data without password
        const newUser = newUserResult[0] as any;
        const userResponse = {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            isActive: newUser.isActive,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt
        };

        return NextResponse.json({
            accessToken: token,
            refreshToken,
            user: userResponse
        }, { status: StatusCodes.CREATED });
    } catch (error) {
        console.error('Error during registration:', error);
        return NextResponse.json(
            { error: 'Registration failed' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 