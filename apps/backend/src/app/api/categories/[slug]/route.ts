import { NextRequest, NextResponse } from 'next/server';
import { dbService, eq } from '@/db/service';
import { categories } from '@/db/schema';
import { StatusCodes } from 'http-status-codes';

/**
 * @swagger
 * /api/categories/{slug}:
 *   get:
 *     summary: Get category by slug
 *     description: Retrieve a specific category by its URL slug
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Category slug identifier
 *         example: electronics
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Category ID
 *                 name:
 *                   type: string
 *                   description: Category name
 *                 slug:
 *                   type: string
 *                   description: URL-friendly identifier
 *                 description:
 *                   type: string
 *                   description: Category description
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Category not found
 *       500:
 *         $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update category by slug
 *     description: Update an existing category by its slug
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Category slug identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated category name
 *               slug:
 *                 type: string
 *                 description: Updated slug
 *               description:
 *                 type: string
 *                 description: Updated description
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 slug:
 *                   type: string
 *                 description:
 *                   type: string
 *       404:
 *         description: Category not found
 *       500:
 *         $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete category by slug
 *     description: Delete a category by its slug
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Category slug identifier
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Category not found
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const category = await dbService.findFirst(categories, eq(categories.slug, slug));
    if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: StatusCodes.NOT_FOUND });
    }
    return NextResponse.json(category, { status: StatusCodes.OK });
}

// Update a category by slug
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const data = await request.json();
    const updateFields: any = {};
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.slug !== undefined) updateFields.slug = data.slug;

    await dbService.update(categories, updateFields, eq(categories.slug, slug));

    // Get the updated category
    const updated = await dbService.findFirst(categories, eq(categories.slug, data.slug || slug));
    if (!updated) {
        return NextResponse.json({ error: 'Category not found' }, { status: StatusCodes.NOT_FOUND });
    }
    return NextResponse.json(updated, { status: StatusCodes.OK });
}

// Delete a category by slug
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    await dbService.delete(categories, eq(categories.slug, slug));
    return NextResponse.json({ success: true }, { status: StatusCodes.OK });
} 