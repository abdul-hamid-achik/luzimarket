import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { dbService, eq } from '@/db/service';
import { sessions, users, deliveryZones } from '@/db/schema';

/**
 * @swagger
 * /api/auth/restore-preferences:
 *   post:
 *     summary: Restore user delivery preferences to session
 *     description: Restore the user's saved delivery zone preference to their current session
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preferences restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Preferences restored successfully
 *                 session:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     deliveryZoneId:
 *                       type: string
 *                     deliveryZone:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         fee:
 *                           type: number
 *       204:
 *         description: No preferences to restore
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Session or user not found
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
    try {
        // Extract token from Authorization header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Authorization token required' },
                { status: StatusCodes.UNAUTHORIZED }
            );
        }

        const token = authHeader.split(' ')[1];

        // Verify JWT token and extract session ID and user ID
        const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';
        let payload: any;
        try {
            payload = jwt.verify(token, jwtSecret);
        } catch (error) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: StatusCodes.UNAUTHORIZED }
            );
        }

        if (!payload.sessionId || !payload.userId) {
            return NextResponse.json(
                { error: 'Invalid token: missing session or user ID' },
                { status: StatusCodes.UNAUTHORIZED }
            );
        }

        // Get user's preferred delivery zone
        const user = await dbService.findFirst(
            users,
            eq(users.id, payload.userId)
        );

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        // If user has no preferred delivery zone, return success with no action
        if (!user.preferredDeliveryZoneId) {
            return new NextResponse(null, { status: StatusCodes.NO_CONTENT });
        }

        // Verify the delivery zone still exists
        const deliveryZone = await dbService.findFirst(
            deliveryZones,
            eq(deliveryZones.id, user.preferredDeliveryZoneId)
        );

        if (!deliveryZone) {
            // If preferred delivery zone no longer exists, clear it from user preferences
            await dbService.update(
                users,
                { preferredDeliveryZoneId: null },
                eq(users.id, payload.userId)
            );

            return new NextResponse(null, { status: StatusCodes.NO_CONTENT });
        }

        // Update the session with the user's preferred delivery zone
        await dbService.update(
            sessions,
            { deliveryZoneId: user.preferredDeliveryZoneId },
            eq(sessions.id, payload.sessionId)
        );

        // Verify the session was updated
        const updatedSession = await dbService.findFirst(
            sessions,
            eq(sessions.id, payload.sessionId)
        );

        if (!updatedSession) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        return NextResponse.json({
            message: 'Preferences restored successfully',
            session: {
                id: updatedSession.id,
                deliveryZoneId: updatedSession.deliveryZoneId,
                deliveryZone: {
                    id: deliveryZone.id,
                    name: deliveryZone.name,
                    fee: deliveryZone.fee
                }
            }
        }, { status: StatusCodes.OK });

    } catch (error) {
        console.error('Error restoring preferences:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 