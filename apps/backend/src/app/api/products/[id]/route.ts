import { NextRequest, NextResponse } from 'next/server';
import { dbService, eq } from '@/db/service';
import { products, productVariants, sessions, productDeliveryZones, deliveryZones } from '@/db/schema';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { validatePrefixedId, isLegacyUUID, ID_PATTERNS } from '@/lib/ids';

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID with delivery zone information
 *     description: Retrieve a specific product by its unique identifier, including delivery zone availability based on user session
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product UUID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product details with delivery zone information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Product ID
 *                 name:
 *                   type: string
 *                   description: Product name
 *                 description:
 *                   type: string
 *                   description: Product description
 *                 price:
 *                   type: number
 *                   description: Product price
 *                 slug:
 *                   type: string
 *                   description: URL-friendly identifier
 *                 categoryId:
 *                   type: string
 *                   description: Category ID
 *                 delivery_info:
 *                   type: object
 *                   properties:
 *                     is_available_in_user_zone:
 *                       type: boolean
 *                       description: Whether product is available in user's delivery zone
 *                     user_delivery_zone:
 *                       type: object
 *                       description: User's current delivery zone
 *                     available_zones:
 *                       type: array
 *                       description: All delivery zones where this product is available
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Product not found
 *       500:
 *         $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update product
 *     description: Update an existing product by ID
 *     tags: [Products]
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
 *               name:
 *                 type: string
 *                 description: Updated product name
 *               description:
 *                 type: string
 *                 description: Updated product description
 *               price:
 *                 type: number
 *                 description: Updated product price
 *               categoryId:
 *                 type: string
 *                 description: Updated category ID
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 price:
 *                   type: number
 *                 categoryId:
 *                   type: string
 *       404:
 *         description: Product not found
 *       500:
 *         $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete product
 *     description: Delete a product and all its associated variants
 *     tags: [Products]
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
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Product not found
 *       500:
 *         $ref: '#/components/schemas/Error'
 */

function isValidProductId(str: string): boolean {
    // Validate new prefixed ID format or accept legacy UUIDs for backward compatibility
    return validatePrefixedId(str, ID_PATTERNS.PRODUCT) || isLegacyUUID(str);
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    // Validate that id is in proper format, otherwise return not found
    if (!isValidProductId(id)) {
        return NextResponse.json(
            { error: 'Product not found' },
            { status: StatusCodes.NOT_FOUND }
        );
    }
    try {
        const productId = id;
        const product = await dbService.findFirst(products, eq(products.id, productId));
        if (!product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        // Get delivery zone information
        const delivery_info = {
            is_available_in_user_zone: false,
            user_delivery_zone: null,
            available_zones: []
        };

        try {
            // Get user's session delivery zone from Authorization header
            const authHeader = request.headers.get('Authorization');
            let userSessionDeliveryZoneId = null;

            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';

                try {
                    const payload = jwt.verify(token, jwtSecret) as any;
                    if (payload.sessionId) {
                        const userSession = await dbService.findFirst(
                            sessions,
                            eq(sessions.id, payload.sessionId)
                        );
                        if (userSession && userSession.deliveryZoneId) {
                            userSessionDeliveryZoneId = userSession.deliveryZoneId;
                            // Get the full delivery zone details
                            const userZone = await dbService.findFirst(
                                deliveryZones,
                                eq(deliveryZones.id, userSession.deliveryZoneId)
                            );
                            delivery_info.user_delivery_zone = userZone;
                        }
                    }
                } catch (jwtError) {
                    // Invalid token, continue without user-specific info
                    console.log('Invalid JWT token:', jwtError);
                }
            }

            // Get all delivery zones where this product is available
            const productZones = await dbService.raw
                .select({
                    id: deliveryZones.id,
                    name: deliveryZones.name,
                    fee: deliveryZones.fee,
                    isAvailable: productDeliveryZones.isAvailable
                })
                .from(productDeliveryZones)
                .innerJoin(deliveryZones, eq(productDeliveryZones.deliveryZoneId, deliveryZones.id))
                .where(eq(productDeliveryZones.productId, productId));

            delivery_info.available_zones = productZones.filter((zone: any) => zone.isAvailable);

            // Check if product is available in user's zone
            if (userSessionDeliveryZoneId) {
                delivery_info.is_available_in_user_zone = delivery_info.available_zones.some(
                    (zone: any) => zone.id === userSessionDeliveryZoneId
                );
            }

        } catch (deliveryError) {
            console.error('Error fetching delivery info:', deliveryError);
            // Continue without delivery info rather than failing the entire request
        }

        // Return product with delivery information
        return NextResponse.json({
            ...product,
            delivery_info
        }, { status: StatusCodes.OK });

    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json(
            { error: 'Product not found' },
            { status: StatusCodes.NOT_FOUND }
        );
    }
}

// Update an existing product
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const productId = id;
    const data = await request.json();
    const updateFields: any = {};
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.description !== undefined) updateFields.description = data.description;
    if (data.price !== undefined) updateFields.price = data.price;
    if (data.categoryId !== undefined) updateFields.categoryId = data.categoryId;
    if (data.status !== undefined) updateFields.status = data.status;
    if (data.featured !== undefined) updateFields.featured = data.featured;
    if (data.slug !== undefined) updateFields.slug = data.slug;
    if (data.vendorId !== undefined) updateFields.vendorId = data.vendorId;
    
    // Add updatedAt timestamp
    updateFields.updatedAt = new Date();

    await dbService.update(products, updateFields, eq(products.id, productId));

    // Get the updated product
    const updated = await dbService.findFirst(products, eq(products.id, productId));
    if (!updated) {
        return NextResponse.json(
            { error: 'Product not found' },
            { status: StatusCodes.NOT_FOUND }
        );
    }
    return NextResponse.json(updated, { status: StatusCodes.OK });
}

// Delete a product and its variants
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const productId = id;
    // delete associated variants first
    await dbService.delete(productVariants, eq(productVariants.productId, productId));
    await dbService.delete(products, eq(products.id, productId));
    return NextResponse.json({ success: true }, { status: StatusCodes.OK });
}