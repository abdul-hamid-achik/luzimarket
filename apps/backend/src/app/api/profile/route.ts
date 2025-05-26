// @ts-ignore: Allow necessary imports
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { dbService, eq } from '@/db/service';
import { sessions, users } from '@/db/schema';
import { StatusCodes } from 'http-status-codes';

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve the authenticated user's profile information
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: User ID
 *                     email:
 *                       type: string
 *                       format: email
 *                       description: User email
 *                     firstName:
 *                       type: string
 *                       description: User first name
 *                     role:
 *                       type: string
 *                       description: User role
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: Account creation date
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile information
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Updated first name
 *                 example: John
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Updated email address
 *                 example: john.doe@example.com
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         $ref: '#/components/schemas/Error'
 */

function getSessionId(request: NextRequest): string | null {
    const auth = request.headers.get('Authorization') || '';
    if (!auth.startsWith('Bearer ')) return null;
    try {
        const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';
        const payload = jwt.verify(auth.split(' ')[1], jwtSecret);
        if (typeof payload === 'object' && 'sessionId' in payload) return (payload as any).sessionId as string;
    } catch { }
    return null;
}

export async function GET(request: NextRequest) {
    const sessionId = getSessionId(request);
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });

    const session = await dbService.findFirst(sessions, eq(sessions.id, sessionId));
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });

    const user = await dbService.findFirst(users, eq(users.id, session.userId));
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: StatusCodes.NOT_FOUND });

    const { password: _pw, name, ...rest } = user;
    const safeUser = { firstName: name, ...rest };
    return NextResponse.json({ user: safeUser }, { status: StatusCodes.OK });
}

export async function PUT(request: NextRequest) {
    const sessionId = getSessionId(request);
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });

    const session = await dbService.findFirst(sessions, eq(sessions.id, sessionId));
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });

    const data = await request.json();
    if (data.password) delete data.password; // disallow password change here

    // Map API input field to DB column
    if (data.firstName !== undefined) {
        data.name = data.firstName;
        delete data.firstName;
    }

    // Update user fields
    await dbService.update(users, data, eq(users.id, session.userId));

    // Fetch updated user
    const updatedUser = await dbService.findFirst(users, eq(users.id, session.userId));
    if (!updatedUser) return NextResponse.json({ error: 'User not found' }, { status: StatusCodes.NOT_FOUND });

    const { password: _pw2, name: updatedName, ...rest2 } = updatedUser;
    const safeUpdatedUser = { firstName: updatedName, ...rest2 };
    return NextResponse.json({ user: safeUpdatedUser }, { status: StatusCodes.OK });
} 