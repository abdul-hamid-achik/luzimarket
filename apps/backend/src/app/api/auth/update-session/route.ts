import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { dbService, eq } from '@/db/service';
import { sessions, deliveryZones, users } from '@/db/schema';

/**
 * @swagger
 * /api/auth/update-session:
 *   patch:
 *     summary: Update session with delivery zone
 *     description: Update the current session with selected delivery zone for location-based functionality
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deliveryZoneId:
 *                 type: string
 *                 description: ID of the selected delivery zone
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *             required:
 *               - deliveryZoneId
 *     responses:
 *       200:
 *         description: Session updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Session updated successfully
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
 *       400:
 *         description: Bad request - missing or invalid data
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Session or delivery zone not found
 *       500:
 *         description: Internal server error
 */
export async function PATCH(request: NextRequest) {
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
        const { deliveryZoneId } = await request.json();

        if (!deliveryZoneId) {
            return NextResponse.json(
                { error: 'Delivery zone ID is required' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        // Verify JWT token and extract session ID
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

        if (!payload.sessionId) {
            return NextResponse.json(
                { error: 'Invalid token: missing session ID' },
                { status: StatusCodes.UNAUTHORIZED }
            );
        }

        // Verify the delivery zone exists
        const deliveryZone = await dbService.findFirst(
            deliveryZones,
            eq(deliveryZones.id, deliveryZoneId)
        );

        if (!deliveryZone) {
            return NextResponse.json(
                { error: 'Delivery zone not found' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        // Update the session with the delivery zone
        await dbService.update(
            sessions,
            { deliveryZoneId },
            eq(sessions.id, payload.sessionId)
        );

        // Verify the session was updated by fetching it
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

        // If user is authenticated, also save the delivery zone as their preferred zone
        if (payload.userId && !updatedSession.isGuest) {
            await dbService.update(
                users,
                { preferredDeliveryZoneId: deliveryZoneId },
                eq(users.id, payload.userId)
            );
        }

        return NextResponse.json({
            message: 'Session updated successfully',
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
        console.error('Error updating session:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 