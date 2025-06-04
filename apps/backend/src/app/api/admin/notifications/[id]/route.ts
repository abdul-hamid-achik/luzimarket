import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbService, eq } from '@/db/service';
import { notifications } from '@/db/schema';

/**
 * @swagger
 * /api/admin/notifications/{id}:
 *   patch:
 *     summary: Update notification (mark as read/unread)
 *     description: Update notification status, typically to mark as read
 *     tags: [Admin, Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isRead:
 *                 type: boolean
 *                 description: Mark notification as read/unread
 *     responses:
 *       200:
 *         description: Notification updated successfully
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Validate notification exists
        const existingNotification = await dbService.findFirst(
            notifications,
            eq(notifications.id, id)
        );

        if (!existingNotification) {
            return NextResponse.json(
                { error: 'Notification not found' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        // Update notification
        const updateData: any = {
            updatedAt: new Date(),
        };

        if (typeof body.isRead === 'boolean') {
            updateData.isRead = body.isRead;
        }

        await dbService.update(notifications, updateData, eq(notifications.id, id));

        // Return updated notification
        const updatedNotification = await dbService.findFirst(
            notifications,
            eq(notifications.id, id)
        );

        return NextResponse.json(updatedNotification, { status: StatusCodes.OK });

    } catch (error) {
        console.error('Error updating notification:', error);
        return NextResponse.json(
            { error: 'Failed to update notification' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
}

/**
 * @swagger
 * /api/admin/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     description: Delete a notification from the system
 *     tags: [Admin, Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Validate notification exists
        const existingNotification = await dbService.findFirst(
            notifications,
            eq(notifications.id, id)
        );

        if (!existingNotification) {
            return NextResponse.json(
                { error: 'Notification not found' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        // Delete notification
        await dbService.delete(notifications, eq(notifications.id, id));

        return NextResponse.json(
            { message: 'Notification deleted successfully' },
            { status: StatusCodes.OK }
        );

    } catch (error) {
        console.error('Error deleting notification:', error);
        return NextResponse.json(
            { error: 'Failed to delete notification' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 