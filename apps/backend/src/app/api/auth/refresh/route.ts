// @ts-ignore: Allow jsonwebtoken import without type declarations
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';
import { dbService, eq, and, gt } from '@/db/service';
import { refreshTokens, users, sessions } from '@/db/schema';
import { randomBytes } from 'crypto';

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh authentication token
 *     description: Exchange a valid refresh token for a new access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token
 *                 example: abc123def456...
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: New JWT authentication token
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken:
 *                   type: string
 *                   description: New refresh token
 *                   example: xyz789abc123...
 *       400:
 *         description: Missing refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Refresh token required
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid or expired refresh token
 *       500:
 *         description: Token refresh failed due to server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
    try {
        const { refreshToken } = await request.json();

        if (!refreshToken) {
            return NextResponse.json(
                { error: 'Refresh token required' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        // Find the refresh token in the database
        const tokenRecord = await dbService.findFirst(
            refreshTokens,
            and(
                eq(refreshTokens.token, refreshToken),
                eq(refreshTokens.isRevoked, false),
                gt(refreshTokens.expiresAt, new Date())
            )
        );

        if (!tokenRecord) {
            return NextResponse.json(
                { error: 'Invalid or expired refresh token' },
                { status: StatusCodes.UNAUTHORIZED }
            );
        }

        // Get the user associated with this refresh token
        const user = await dbService.findFirst(users, eq(users.id, tokenRecord.userId));
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: StatusCodes.UNAUTHORIZED }
            );
        }

        // Get the user's current session
        const session = await dbService.findFirst(
            sessions,
            and(
                eq(sessions.userId, user.id),
                eq(sessions.isGuest, false)
            )
        );

        if (!session) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: StatusCodes.UNAUTHORIZED }
            );
        }

        // Get token durations from environment variables
        const accessTokenDuration = process.env.ACCESS_TOKEN_DURATION || '1m';
        const refreshTokenDuration = parseInt(process.env.REFRESH_TOKEN_DURATION_HOURS || '168') * 60 * 60 * 1000; // Default 7 days in ms

        // Create new access token
        const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';
        const newAccessToken = jwt.sign({
            sessionId: session.id,
            userId: user.id,
            email: user.email,
            role: user.role
        }, jwtSecret, { expiresIn: '7d' });

        // Generate new refresh token
        const newRefreshToken = randomBytes(64).toString('hex');
        const newRefreshTokenExpiry = new Date(Date.now() + refreshTokenDuration);

        // Revoke the old refresh token
        await dbService.update(
            refreshTokens,
            { isRevoked: true },
            eq(refreshTokens.id, tokenRecord.id)
        );

        // Create new refresh token record
        await dbService.insert(refreshTokens, {
            userId: user.id,
            token: newRefreshToken,
            expiresAt: newRefreshTokenExpiry,
            isRevoked: false
        });

        return NextResponse.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        }, { status: StatusCodes.OK });

    } catch (error) {
        console.error('Error during token refresh:', error);
        return NextResponse.json(
            { error: 'Token refresh failed' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 