import { NextRequest, NextResponse } from 'next/server';
import { dbService, eq } from '@/db/service';
import { orders, trackingHistory } from '@/db/schema';
import { StatusCodes } from 'http-status-codes';

/**
 * @swagger
 * /api/admin/orders/{id}/tracking:
 *   put:
 *     summary: Update order tracking information (Admin/Employee)
 *     description: Update tracking details for an order - for admin and employee use
 *     tags: [Admin, Orders, Tracking]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tracking_number:
 *                 type: string
 *                 description: Tracking number from shipping carrier
 *                 example: "LZM-20241225-ABC123"
 *               tracking_url:
 *                 type: string
 *                 description: URL to track package on carrier website
 *                 example: "https://fedex.com/track?trk=ABC123"
 *               shipping_carrier:
 *                 type: string
 *                 description: Shipping carrier name
 *                 enum: [fedex, ups, dhl, correos_mexico, estafeta, paquete_express, other]
 *                 example: "fedex"
 *               shipping_service:
 *                 type: string
 *                 description: Shipping service type
 *                 enum: [express, standard, overnight, economy, same_day]
 *                 example: "express"
 *               status:
 *                 type: string
 *                 description: Order status
 *                 enum: [pending, processing, shipped, out_for_delivery, delivered, cancelled, returned]
 *                 example: "shipped"
 *               estimated_delivery:
 *                 type: string
 *                 format: date-time
 *                 description: Estimated delivery date
 *               delivered_at:
 *                 type: string
 *                 format: date-time
 *                 description: Actual delivery date (if delivered)
 *               delivery_notes:
 *                 type: string
 *                 description: Delivery notes or special instructions
 *               tracking_update:
 *                 type: object
 *                 description: Add a tracking history entry
 *                 properties:
 *                   status:
 *                     type: string
 *                     example: "in_transit"
 *                   description:
 *                     type: string
 *                     example: "Package is on the way to destination"
 *                   location:
 *                     type: string
 *                     example: "Ciudad de México, CDMX"
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *     responses:
 *       200:
 *         description: Tracking information updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Tracking information updated successfully"
 *                 order:
 *                   type: object
 *                   description: Updated order information
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await params;
        const body = await request.json();

        // Validate order exists
        const order = await dbService.findFirst(orders, eq(orders.id, orderId));
        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        // Prepare update data
        const updateData: any = {
            updatedAt: new Date(),
        };

        // Optional tracking fields
        if (body.tracking_number) updateData.tracking_number = body.tracking_number;
        if (body.tracking_url) updateData.tracking_url = body.tracking_url;
        if (body.shipping_carrier) updateData.shipping_carrier = body.shipping_carrier;
        if (body.shipping_service) updateData.shipping_service = body.shipping_service;
        if (body.status) updateData.status = body.status;
        if (body.estimated_delivery) updateData.estimated_delivery = new Date(body.estimated_delivery);
        if (body.delivered_at) updateData.delivered_at = new Date(body.delivered_at);
        if (body.delivery_notes) updateData.delivery_notes = body.delivery_notes;

        // Set shipped_at timestamp if status is changing to shipped
        if (body.status === 'shipped' && order.status !== 'shipped') {
            updateData.shipped_at = new Date();
        }

        // Update order
        await dbService.update(orders, updateData, eq(orders.id, orderId));

        // Add tracking history entry if provided
        if (body.tracking_update) {
            const { status, description, location, timestamp } = body.tracking_update;

            await dbService.insert(trackingHistory, {
                orderId,
                status: status || body.status || 'updated',
                description: description || `Order status updated to ${body.status || 'updated'}`,
                location: location || null,
                timestamp: timestamp ? new Date(timestamp) : new Date(),
                carrier_status: body.status || null,
            });
        }

        // Get updated order
        const updatedOrder = await dbService.findFirst(orders, eq(orders.id, orderId));

        return NextResponse.json({
            success: true,
            message: 'Tracking information updated successfully',
            order: updatedOrder,
        }, { status: StatusCodes.OK });

    } catch (error) {
        console.error('Error updating tracking information:', error);
        return NextResponse.json(
            { error: 'Failed to update tracking information' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
}

/**
 * @swagger
 * /api/admin/orders/{id}/tracking:
 *   post:
 *     summary: Add tracking history entry
 *     description: Add a new tracking update to order history
 *     tags: [Admin, Orders, Tracking]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *               - description
 *             properties:
 *               status:
 *                 type: string
 *                 description: Tracking status
 *                 example: "in_transit"
 *               description:
 *                 type: string
 *                 description: Status description
 *                 example: "Package departed from Ciudad de México facility"
 *               location:
 *                 type: string
 *                 description: Current location
 *                 example: "Ciudad de México, CDMX"
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Event timestamp (defaults to now)
 *               carrier_status:
 *                 type: string
 *                 description: Raw status from carrier system
 *     responses:
 *       201:
 *         description: Tracking history entry added successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await params;
        const body = await request.json();

        // Validate required fields
        if (!body.status || !body.description) {
            return NextResponse.json(
                { error: 'Status and description are required' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        // Validate order exists
        const order = await dbService.findFirst(orders, eq(orders.id, orderId));
        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        // Add tracking history entry
        const historyEntry = await dbService.insertReturning(trackingHistory, {
            orderId,
            status: body.status,
            description: body.description,
            location: body.location || null,
            timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
            carrier_status: body.carrier_status || null,
        });

        return NextResponse.json({
            success: true,
            message: 'Tracking history entry added successfully',
            tracking_entry: historyEntry[0],
        }, { status: StatusCodes.CREATED });

    } catch (error) {
        console.error('Error adding tracking history:', error);
        return NextResponse.json(
            { error: 'Failed to add tracking history entry' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 