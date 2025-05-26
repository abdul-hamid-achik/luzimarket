import { NextRequest, NextResponse } from 'next/server';
import { dbService, eq, and } from '@/db/service';
import { orders, trackingHistory, orderAddresses, orderItems } from '@/db/schema';
import { StatusCodes } from 'http-status-codes';

/**
 * @swagger
 * /api/track/{trackingNumber}:
 *   get:
 *     summary: Track order by tracking number (public)
 *     description: Get order tracking information without authentication
 *     tags: [Tracking]
 *     parameters:
 *       - in: path
 *         name: trackingNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Order tracking number
 *         example: LZM-20241225-ABC123
 *     responses:
 *       200:
 *         description: Tracking information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     tracking_number:
 *                       type: string
 *                     status:
 *                       type: string
 *                     shipping_carrier:
 *                       type: string
 *                     shipped_at:
 *                       type: string
 *                       format: date-time
 *                     estimated_delivery:
 *                       type: string
 *                       format: date-time
 *                     delivered_at:
 *                       type: string
 *                       format: date-time
 *                 trackingHistory:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       description:
 *                         type: string
 *                       location:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                 shippingAddress:
 *                   type: object
 *                   properties:
 *                     city:
 *                       type: string
 *                     state:
 *                       type: string
 *                     postalCode:
 *                       type: string
 *       404:
 *         description: Tracking number not found
 *       500:
 *         description: Server error
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ trackingNumber: string }> }
) {
    try {
        const { trackingNumber } = await params;

        if (!trackingNumber || trackingNumber.trim().length === 0) {
            return NextResponse.json(
                { error: 'Tracking number is required' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        // Additional validation for tracking number format
        const trimmedTrackingNumber = trackingNumber.trim();
        if (trimmedTrackingNumber.length < 3) {
            return NextResponse.json(
                { error: 'Invalid tracking number format' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        // Find order by tracking number
        const order = await dbService.findFirst(
            orders,
            eq(orders.tracking_number, trimmedTrackingNumber)
        );

        if (!order) {
            return NextResponse.json(
                { error: 'Tracking number not found' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        // Get tracking history
        const history = await dbService.select(
            trackingHistory,
            eq(trackingHistory.orderId, order.id)
        );

        // Get shipping address (limited info for privacy)
        const shippingAddress = await dbService.findFirst(
            orderAddresses,
            and(
                eq(orderAddresses.orderId, order.id),
                eq(orderAddresses.type, 'shipping')
            )
        );

        // Get order items count (for basic info)
        const items = await dbService.select(
            orderItems,
            eq(orderItems.orderId, order.id)
        );

        // Format response with limited sensitive information
        const response = {
            order: {
                id: order.id,
                tracking_number: order.tracking_number,
                status: order.status,
                shipping_carrier: order.shipping_carrier,
                shipping_service: order.shipping_service,
                shipped_at: order.shipped_at,
                estimated_delivery: order.estimated_delivery,
                delivered_at: order.delivered_at,
                delivery_notes: order.delivery_notes,
                tracking_url: order.tracking_url,
                total_items: items.length,
                created_at: order.createdAt,
            },
            trackingHistory: history
                .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((h: any) => ({
                    status: h.status,
                    description: h.description,
                    location: h.location,
                    timestamp: h.timestamp,
                })),
            shippingAddress: shippingAddress ? {
                city: shippingAddress.city,
                state: shippingAddress.state,
                postalCode: shippingAddress.postalCode,
                country: shippingAddress.country,
            } : null,
        };

        return NextResponse.json(response, { status: StatusCodes.OK });

    } catch (error) {
        console.error('Error tracking order:', error);
        return NextResponse.json(
            { error: 'Failed to track order' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 