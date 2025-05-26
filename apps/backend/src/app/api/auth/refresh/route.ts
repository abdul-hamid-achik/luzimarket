// @ts-ignore: Allow jsonwebtoken import without type declarations
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
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

        console.log('[REFRESH] Refresh token request received');
        console.log('[REFRESH] Refresh token length:', refreshToken ? refreshToken.length : 'N/A');

        if (!refreshToken) {
            console.log('[REFRESH] No refresh token provided');
            return NextResponse.json(
                { error: 'Refresh token required' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        console.log('[REFRESH] Looking up refresh token in database...');

        // Log current time for debugging
        const currentTime = new Date();
        console.log('[REFRESH] Current time:', currentTime.toISOString());

        // Find the refresh token in the database
        const tokenRecord = await dbService.findFirst(
            refreshTokens,
            and(
                eq(refreshTokens.token, refreshToken),
                eq(refreshTokens.isRevoked, false),
                gt(refreshTokens.expiresAt, currentTime)
            )
        );

        console.log('[REFRESH] Token record found:', !!tokenRecord);

        if (!tokenRecord) {
            console.log('[REFRESH] Token not found, checking if token exists at all...');

            // Debug: Check if token exists without expiration check
            const anyTokenRecord = await dbService.findFirst(
                refreshTokens,
                eq(refreshTokens.token, refreshToken)
            );

            if (anyTokenRecord) {
                console.log('[REFRESH] Token exists but may be expired or revoked');
                console.log('[REFRESH] Token expires at:', anyTokenRecord.expiresAt);
                console.log('[REFRESH] Token is revoked:', anyTokenRecord.isRevoked);
                console.log('[REFRESH] Token user ID:', anyTokenRecord.userId);
            } else {
                console.log('[REFRESH] Token does not exist in database at all');

                // Debug: List all refresh tokens for debugging (only in test environment)
                if (process.env.NODE_ENV === 'test') {
                    const allTokens = await dbService.select(refreshTokens);
                    console.log('[REFRESH] All refresh tokens in database:', allTokens.length);
                    allTokens.forEach((token, index) => {
                        console.log(`[REFRESH] Token ${index + 1}: expires=${token.expiresAt}, revoked=${token.isRevoked}, userId=${token.userId}`);
                    });
                }
            }

            return NextResponse.json(
                { error: 'Invalid or expired refresh token' },
                { status: StatusCodes.UNAUTHORIZED }
            );
        }

        console.log('[REFRESH] Valid token found, getting user...');
        console.log('[REFRESH] Token user ID:', tokenRecord.userId);

        // Get the user associated with this refresh token
        const user = await dbService.findFirst(users, eq(users.id, tokenRecord.userId));
        if (!user) {
            console.log('[REFRESH] User not found for token');
            return NextResponse.json(
                { error: 'User not found' },
                { status: StatusCodes.UNAUTHORIZED }
            );
        }

        console.log('[REFRESH] User found:', user.email);

        // Get the user's current session
        const session = await dbService.findFirst(
            sessions,
            and(
                eq(sessions.userId, user.id),
                eq(sessions.isGuest, false)
            )
        );

        if (!session) {
            console.log('[REFRESH] Session not found for user');
            return NextResponse.json(
                { error: 'Session not found' },
                { status: StatusCodes.UNAUTHORIZED }
            );
        }

        console.log('[REFRESH] Session found:', session.id);

        // Get token durations from environment variables
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

        console.log('[REFRESH] Revoking old refresh token...');

        // Revoke the old refresh token
        await dbService.update(
            refreshTokens,
            { isRevoked: true },
            eq(refreshTokens.id, tokenRecord.id)
        );

        console.log('[REFRESH] Creating new refresh token...');

        // Create new refresh token record
        await dbService.insert(refreshTokens, {
            userId: user.id,
            token: newRefreshToken,
            expiresAt: newRefreshTokenExpiry,
            isRevoked: false
        });

        console.log('[REFRESH] Refresh successful, returning new tokens');

        return NextResponse.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        }, { status: StatusCodes.OK });

    } catch (error) {
        console.error('[REFRESH] Error during token refresh:', error);
        return NextResponse.json(
            { error: 'Token refresh failed' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 