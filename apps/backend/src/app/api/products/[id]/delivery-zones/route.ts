import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbService, eq } from '@/db/service';
import { products, deliveryZones, productDeliveryZones } from '@/db/schema';

/**
 * @swagger
 * /api/products/{id}/delivery-zones:
 *   get:
 *     summary: Get delivery zones for a product
 *     description: Retrieve all delivery zones and their availability status for a specific product
 *     tags: [Products, CMS]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product UUID
 *     responses:
 *       200:
 *         description: Delivery zones with availability status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   fee:
 *                     type: number
 *                   isAvailable:
 *                     type: boolean
 *       404:
 *         description: Product not found
 *   put:
 *     summary: Update delivery zones for a product
 *     description: Set which delivery zones a product is available in
 *     tags: [Products, CMS]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               delivery_zones:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     delivery_zone_id:
 *                       type: string
 *                     is_available:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Delivery zones updated successfully
 *       404:
 *         description: Product not found
 */

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const productId = id;

        // Validate that id is a UUID
        if (!/^[0-9a-fA-F-]{36}$/.test(productId)) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        // Check if product exists
        const product = await dbService.findFirst(products, eq(products.id, productId));
        if (!product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        // Get all delivery zones with their availability status for this product
        const allZones = await dbService.select(deliveryZones);
        const productZoneRelations = await dbService.select(
            productDeliveryZones,
            eq(productDeliveryZones.productId, productId)
        );

        // Create a map for quick lookup
        const zoneAvailabilityMap = new Map();
        productZoneRelations.forEach((relation: any) => {
            zoneAvailabilityMap.set(relation.deliveryZoneId, relation.isAvailable);
        });

        // Combine zones with availability status
        const zonesWithAvailability = allZones.map((zone: any) => ({
            id: zone.id,
            name: zone.name,
            fee: zone.fee,
            isAvailable: zoneAvailabilityMap.get(zone.id) || false
        }));

        return NextResponse.json(zonesWithAvailability, { status: StatusCodes.OK });

    } catch (error) {
        console.error('Error fetching product delivery zones:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const productId = id;
        const { delivery_zones: zoneUpdates } = await request.json();

        // Validate that id is a UUID
        if (!/^[0-9a-fA-F-]{36}$/.test(productId)) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        // Check if product exists
        const product = await dbService.findFirst(products, eq(products.id, productId));
        if (!product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        // Validate input
        if (!Array.isArray(zoneUpdates)) {
            return NextResponse.json(
                { error: 'delivery_zones must be an array' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        // Delete existing relationships
        await dbService.delete(
            productDeliveryZones,
            eq(productDeliveryZones.productId, productId)
        );

        // Insert new relationships
        for (const update of zoneUpdates) {
            if (update.is_available) {
                await dbService.insert(productDeliveryZones, {
                    productId,
                    deliveryZoneId: update.delivery_zone_id,
                    isAvailable: true
                });
            }
        }

        return NextResponse.json(
            { message: 'Delivery zones updated successfully' },
            { status: StatusCodes.OK }
        );

    } catch (error) {
        console.error('Error updating product delivery zones:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 