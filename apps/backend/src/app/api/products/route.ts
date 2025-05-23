import { NextRequest, NextResponse } from 'next/server';
import { dbService, eq } from '@/db/service';
import { products, productVariants } from '@/db/schema';
import { sql } from 'drizzle-orm';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     description: Retrieve a list of all products with pagination support
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of products to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of products to skip
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Product ID
 *                   name:
 *                     type: string
 *                     description: Product name
 *                   description:
 *                     type: string
 *                     description: Product description
 *                   price:
 *                     type: number
 *                     description: Product price
 *                   slug:
 *                     type: string
 *                     description: Product URL slug
 *                   categoryId:
 *                     type: string
 *                     description: Category ID
 *       500:
 *         description: Failed to fetch products
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new product
 *     description: Create a new product in the catalog
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Product name
 *               description:
 *                 type: string
 *                 description: Product description
 *               price:
 *                 type: number
 *                 description: Product price
 *               slug:
 *                 type: string
 *                 description: Product URL slug
 *               categoryId:
 *                 type: string
 *                 description: Category ID
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Created product ID
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to create product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export async function GET() {
    const items = await dbService.select(products);
    return NextResponse.json(items, { status: StatusCodes.OK });
}

export async function POST(request: NextRequest) {
    const { name, description, price, slug, categoryId, variants } = await request.json();
    if (!name || !price || !categoryId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: StatusCodes.BAD_REQUEST });
    }

    let created;
    try {
        [created] = await dbService.insertReturning(products, { name, description, price, slug, categoryId });
    } catch (error: any) {
        if (error.code === '23505' && error.constraint === 'products_pkey') {
            console.warn('Products ID sequence out-of-sync, resetting sequence and retrying insert');
            await dbService.execute(sql`SELECT setval(pg_get_serial_sequence('products','id'), (SELECT MAX(id) FROM products))`);
            [created] = await dbService.insertReturning(products, { name, description, price, slug, categoryId });
        } else {
            console.error('Error creating product:', error);
            return NextResponse.json({ error: 'Failed to create product' }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
        }
    }

    if (variants && Array.isArray(variants)) {
        const variantData = variants.map((v: any) => ({
            productId: created.id,
            sku: v.sku,
            attributes: JSON.stringify(v.attributes),
            stock: v.stock ?? 0,
        }));
        await dbService.insert(productVariants, variantData);
    }

    return NextResponse.json(created, { status: StatusCodes.CREATED });
} 