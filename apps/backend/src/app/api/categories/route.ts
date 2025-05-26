import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/db/service';
import { categories } from '@/db/schema';
import { StatusCodes } from 'http-status-codes';

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     description: Retrieve a list of all product categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Category ID
 *                   name:
 *                     type: string
 *                     description: Category name
 *                   slug:
 *                     type: string
 *                     description: URL-friendly category identifier
 *                   description:
 *                     type: string
 *                     description: Category description
 *       500:
 *         description: Failed to fetch categories
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new category
 *     description: Create a new product category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name
 *                 example: Electronics
 *               slug:
 *                 type: string
 *                 description: URL-friendly identifier
 *                 example: electronics
 *               description:
 *                 type: string
 *                 description: Category description
 *                 example: Electronic devices and accessories
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Created category ID
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Name and slug required
 *       500:
 *         description: Failed to create category
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
    const items = await dbService.select(categories);
    return NextResponse.json(items, { status: StatusCodes.OK });
}

export async function POST(request: NextRequest) {
    const { name, slug, description } = await request.json();
    if (!name || !slug) {
        return NextResponse.json({ error: 'Name and slug required' }, { status: StatusCodes.BAD_REQUEST });
    }

    // If description is not provided, use an empty string
    const categoryDescription = description || '';

    const [created] = await dbService.insertReturning(categories, { name, slug, description: categoryDescription });

    return NextResponse.json(created, { status: StatusCodes.CREATED });
} 