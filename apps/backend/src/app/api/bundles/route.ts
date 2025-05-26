import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/db/service';
import { bundles, bundleItems } from '@/db/schema';
import { StatusCodes } from 'http-status-codes';

/**
 * @swagger
 * /api/bundles:
 *   get:
 *     summary: Get all product bundles
 *     description: Retrieve a list of all product bundles available for purchase
 *     tags: [Bundles]
 *     responses:
 *       200:
 *         description: List of product bundles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Bundle ID
 *                   name:
 *                     type: string
 *                     description: Bundle name
 *                     example: Family Pack Bundle
 *                   description:
 *                     type: string
 *                     description: Bundle description
 *                     example: A complete family pack with essential items
 *                   slug:
 *                     type: string
 *                     description: URL-friendly bundle identifier
 *                     example: family-pack-bundle
 *                   totalPrice:
 *                     type: number
 *                     description: Total bundle price
 *                   discountPrice:
 *                     type: number
 *                     description: Discounted bundle price
 *                   isActive:
 *                     type: boolean
 *                     description: Whether the bundle is active
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: Bundle creation date
 *       500:
 *         description: Failed to fetch bundles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new product bundle
 *     description: Create a new bundle containing multiple product variants
 *     tags: [Bundles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - items
 *             properties:
 *               name:
 *                 type: string
 *                 description: Bundle name
 *                 example: Family Pack Bundle
 *               description:
 *                 type: string
 *                 description: Bundle description
 *                 example: A complete family pack with essential items
 *               items:
 *                 type: array
 *                 description: Array of products/variants to include in the bundle
 *                 items:
 *                   type: object
 *                   required:
 *                     - variantId
 *                     - quantity
 *                   properties:
 *                     variantId:
 *                       type: string
 *                       description: Product variant ID to include
 *                     quantity:
 *                       type: integer
 *                       description: Quantity of this variant in the bundle
 *                       minimum: 1
 *                       example: 2
 *               totalPrice:
 *                 type: number
 *                 description: Bundle total price
 *                 example: 99.99
 *               discountPrice:
 *                 type: number
 *                 description: Discounted bundle price
 *                 example: 79.99
 *     responses:
 *       201:
 *         description: Bundle created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Created bundle ID
 *       400:
 *         description: Invalid bundle data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid bundle data
 *       500:
 *         description: Failed to create bundle
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
    const items = await dbService.select(bundles);
    return NextResponse.json(items, { status: StatusCodes.OK });
}

export async function POST(request: NextRequest) {
    const { name, description, items } = await request.json();
    if (!name || !items || !Array.isArray(items)) {
        return NextResponse.json(
            { error: 'Invalid bundle data' },
            { status: StatusCodes.BAD_REQUEST }
        );
    }

    // Generate a slug from the name
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const bundleResult = await dbService.insertReturning(bundles,
        { name, description, slug }
    );
    const bundleId = (bundleResult[0] as any).id;

    const bundleItemsData = items.map((item: any) => ({
        bundleId,
        variantId: item.variantId,
        quantity: item.quantity,
    }));
    await dbService.insert(bundleItems, bundleItemsData);
    return NextResponse.json({ id: bundleId }, { status: StatusCodes.CREATED });
} 