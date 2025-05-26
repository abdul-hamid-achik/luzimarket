import { NextRequest, NextResponse } from 'next/server';
import { dbService, eq } from '@/db/service';
import { orders, trackingHistory } from '@/db/schema';
import { normalizeTrackingStatus, getStatusMessage } from '@/lib/tracking';
import { StatusCodes } from 'http-status-codes';

/**
 * @swagger
 * /api/webhooks/shipping:
 *   post:
 *     summary: Receive shipping updates from carriers
 *     description: Webhook endpoint for receiving tracking updates from shipping carriers (FedEx, UPS, DHL, Estafeta, etc.)
 *     tags: [Webhooks, Shipping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               carrier:
 *                 type: string
 *                 description: Shipping carrier identifier
 *                 enum: [fedex, ups, dhl, estafeta, redpack, correos_mexico, paquete_express]
 *                 example: "fedex"
 *               tracking_number:
 *                 type: string
 *                 description: Tracking number from carrier
 *                 example: "123456789012"
 *               status:
 *                 type: string
 *                 description: Current status from carrier
 *                 example: "in_transit"
 *               status_description:
 *                 type: string
 *                 description: Human-readable status description
 *                 example: "Package is on the way to destination"
 *               location:
 *                 type: string
 *                 description: Current package location
 *                 example: "Ciudad de México, CDMX"
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Event timestamp
 *               estimated_delivery:
 *                 type: string
 *                 format: date-time
 *                 description: Updated estimated delivery date
 *               delivered_at:
 *                 type: string
 *                 format: date-time
 *                 description: Actual delivery timestamp (if delivered)
 *               delivery_notes:
 *                 type: string
 *                 description: Delivery notes or special instructions
 *               signature_required:
 *                 type: boolean
 *                 description: Whether signature is required for delivery
 *               exception_reason:
 *                 type: string
 *                 description: Reason for delivery exception (if any)
 *     responses:
 *       200:
 *         description: Webhook processed successfully
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
 *                   example: "Tracking update processed successfully"
 *                 order_id:
 *                   type: string
 *                   description: Internal order ID that was updated
 *       400:
 *         description: Invalid webhook data
 *       404:
 *         description: Order not found for tracking number
 *       500:
 *         description: Server error
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        if (!body.carrier || !body.tracking_number || !body.status) {
            return NextResponse.json(
                { error: 'Missing required fields: carrier, tracking_number, status' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        // Find order by tracking number
        const order = await dbService.findFirst(
            orders,
            eq(orders.tracking_number, body.tracking_number)
        );

        if (!order) {
            console.log(`No order found for tracking number: ${body.tracking_number}`);
            return NextResponse.json(
                { error: 'Order not found for tracking number' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        // Validate carrier matches (if specified in order)
        if (order.shipping_carrier && order.shipping_carrier !== body.carrier) {
            console.warn(`Carrier mismatch for order ${order.id}: expected ${order.shipping_carrier}, got ${body.carrier}`);
        }

        // Normalize status from carrier to our standard statuses
        const normalizedStatus = normalizeTrackingStatus(body.carrier, body.status);

        // Prepare order update data
        const orderUpdateData: any = {
            updatedAt: new Date(),
        };

        // Update order status if it's a significant change
        const statusHierarchy = ['pending', 'processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'];
        const currentStatusIndex = statusHierarchy.indexOf(order.status);
        const newStatusIndex = statusHierarchy.indexOf(normalizedStatus);

        if (newStatusIndex > currentStatusIndex || normalizedStatus === 'exception') {
            orderUpdateData.status = normalizedStatus;
        }

        // Update carrier if not set
        if (!order.shipping_carrier) {
            orderUpdateData.shipping_carrier = body.carrier;
        }

        // Update timestamps based on status
        if (normalizedStatus === 'shipped' && !order.shipped_at) {
            orderUpdateData.shipped_at = body.timestamp ? new Date(body.timestamp) : new Date();
        }

        if (normalizedStatus === 'delivered' && !order.delivered_at) {
            orderUpdateData.delivered_at = body.delivered_at ?
                new Date(body.delivered_at) :
                body.timestamp ? new Date(body.timestamp) : new Date();
        }

        // Update estimated delivery if provided
        if (body.estimated_delivery) {
            orderUpdateData.estimated_delivery = new Date(body.estimated_delivery);
        }

        // Update delivery notes
        if (body.delivery_notes) {
            orderUpdateData.delivery_notes = body.delivery_notes;
        }

        // Update order
        await dbService.update(orders, orderUpdateData, eq(orders.id, order.id));

        // Add tracking history entry
        await dbService.insert(trackingHistory, {
            orderId: order.id,
            status: normalizedStatus,
            description: body.status_description || getStatusMessage(normalizedStatus),
            location: body.location || null,
            timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
            carrier_status: body.status,
        });

        console.log(`Updated tracking for order ${order.id}: ${normalizedStatus}`);

        // TODO: Send notification to customer (email, SMS, push notification)
        // await sendTrackingNotification(order.userId, order.id, normalizedStatus, body.status_description);

        return NextResponse.json({
            success: true,
            message: 'Tracking update processed successfully',
            order_id: order.id,
            status: normalizedStatus,
        }, { status: StatusCodes.OK });

    } catch (error) {
        console.error('Error processing shipping webhook:', error);
        return NextResponse.json(
            { error: 'Failed to process shipping webhook' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
}

/**
 * @swagger
 * /api/webhooks/shipping:
 *   get:
 *     summary: Verify webhook endpoint
 *     description: Endpoint verification for shipping carriers
 *     tags: [Webhooks, Shipping]
 *     parameters:
 *       - in: query
 *         name: challenge
 *         schema:
 *           type: string
 *         description: Challenge string for webhook verification
 *     responses:
 *       200:
 *         description: Webhook endpoint verified
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "challenge_response"
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const challenge = searchParams.get('challenge');

    // Some carriers require challenge verification
    if (challenge) {
        return new Response(challenge, {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
        });
    }

    return NextResponse.json({
        success: true,
        message: 'Shipping webhook endpoint is active',
        supported_carriers: [
            'fedex',
            'ups',
            'dhl',
            'estafeta',
            'redpack',
            'correos_mexico',
            'paquete_express'
        ]
    });
}

