import { NextRequest, NextResponse } from 'next/server';
import { dbService, eq } from '@/db/service';
import { products, productVariants } from '@/db/schema';
import { StatusCodes } from 'http-status-codes';

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     description: Retrieve a specific product by its unique identifier
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
 *     responses:
 *       200:
 *         description: Product details
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
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    // Validate that id is a UUID, otherwise return not found
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
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
        return NextResponse.json(product, { status: StatusCodes.OK });
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