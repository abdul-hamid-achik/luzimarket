import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbService, eq, and, or, isNull } from '@/db/service';
import { notifications } from '@/db/schema';
import { desc, gt } from 'drizzle-orm';

/**
 * @swagger
 * /api/admin/notifications:
 *   get:
 *     summary: Get admin notifications
 *     description: Retrieve notifications for admin dashboard with filtering options
 *     tags: [Admin, Notifications]
 *     parameters:
 *       - in: query
 *         name: unread
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [info, warning, error, success]
 *         description: Filter by severity
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: actionRequired
 *         schema:
 *           type: boolean
 *         description: Filter by action required
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Limit number of notifications
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   type:
 *                     type: string
 *                   severity:
 *                     type: string
 *                   title:
 *                     type: string
 *                   message:
 *                     type: string
 *                   category:
 *                     type: string
 *                   actionRequired:
 *                     type: boolean
 *                   isRead:
 *                     type: boolean
 *                   data:
 *                     type: object
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Server error
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const unreadParam = searchParams.get('unread');
        const severityParam = searchParams.get('severity');
        const categoryParam = searchParams.get('category');
        const actionRequiredParam = searchParams.get('actionRequired');
        const limitParam = searchParams.get('limit');

        const limit = limitParam ? parseInt(limitParam) : 50;

        // Build filter conditions
        const conditions = [];

        if (unreadParam === 'true') {
            conditions.push(eq(notifications.isRead, false));
        } else if (unreadParam === 'false') {
            conditions.push(eq(notifications.isRead, true));
        }

        if (severityParam && ['info', 'warning', 'error', 'success'].includes(severityParam)) {
            conditions.push(eq(notifications.severity, severityParam as any));
        }

        if (categoryParam) {
            conditions.push(eq(notifications.category, categoryParam));
        }

        if (actionRequiredParam === 'true') {
            conditions.push(eq(notifications.actionRequired, true));
        } else if (actionRequiredParam === 'false') {
            conditions.push(eq(notifications.actionRequired, false));
        }

        // Add condition to exclude expired notifications
        const now = new Date();
        conditions.push(
            or(
                isNull(notifications.expiresAt),
                gt(notifications.expiresAt, now)
            )
        );

        // Build query using the database service
        const database = dbService.raw;
        let query = database.select().from(notifications);

        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }

        const results = await query
            .orderBy(desc(notifications.createdAt))
            .limit(limit);

        // Transform results to match frontend format
        const transformedResults = results.map((notification: any) => ({
            id: notification.id,
            type: notification.type,
            severity: notification.severity,
            title: notification.title,
            message: notification.message,
            category: notification.category,
            actionRequired: notification.actionRequired,
            read: notification.isRead,
            timestamp: new Date(notification.createdAt),
            data: notification.data || {}
        }));

        return NextResponse.json(transformedResults, { status: StatusCodes.OK });

    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
}

/**
 * @swagger
 * /api/admin/notifications:
 *   post:
 *     summary: Create a new notification
 *     description: Create a system notification for admin dashboard
 *     tags: [Admin, Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - title
 *               - message
 *               - category
 *             properties:
 *               type:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [info, warning, error, success]
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               category:
 *                 type: string
 *               actionRequired:
 *                 type: boolean
 *               userId:
 *                 type: string
 *               relatedEntityId:
 *                 type: string
 *               relatedEntityType:
 *                 type: string
 *               data:
 *                 type: object
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        if (!body.type || !body.title || !body.message || !body.category) {
            return NextResponse.json(
                { error: 'Missing required fields: type, title, message, category' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        const notificationData = {
            type: body.type,
            severity: body.severity || 'info',
            title: body.title,
            message: body.message,
            category: body.category,
            actionRequired: body.actionRequired || false,
            userId: body.userId || null,
            relatedEntityId: body.relatedEntityId || null,
            relatedEntityType: body.relatedEntityType || null,
            data: body.data || null,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        };

        const result = await dbService.insertReturning(notifications, notificationData);

        return NextResponse.json(result[0], { status: StatusCodes.CREATED });

    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json(
            { error: 'Failed to create notification' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 