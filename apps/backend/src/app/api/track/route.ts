import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';

/**
 * @swagger
 * /api/track:
 *   get:
 *     summary: Track order endpoint info
 *     description: Returns information about the tracking endpoint
 *     tags: [Tracking]
 *     responses:
 *       400:
 *         description: Bad request - tracking number required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Tracking number is required. Use /api/track/{trackingNumber}"
 */
export async function GET(_request: NextRequest) {
    return NextResponse.json(
        {
            error: 'Tracking number is required. Use /api/track/{trackingNumber}',
            usage: 'GET /api/track/{trackingNumber}'
        },
        { status: StatusCodes.BAD_REQUEST }
    );
}

export async function POST(_request: NextRequest) {
    return NextResponse.json(
        { error: 'Method not allowed. Use GET /api/track/{trackingNumber}' },
        { status: StatusCodes.METHOD_NOT_ALLOWED }
    );
}

export async function PUT(_request: NextRequest) {
    return NextResponse.json(
        { error: 'Method not allowed. Use GET /api/track/{trackingNumber}' },
        { status: StatusCodes.METHOD_NOT_ALLOWED }
    );
}

export async function DELETE(_request: NextRequest) {
    return NextResponse.json(
        { error: 'Method not allowed. Use GET /api/track/{trackingNumber}' },
        { status: StatusCodes.METHOD_NOT_ALLOWED }
    );
} 