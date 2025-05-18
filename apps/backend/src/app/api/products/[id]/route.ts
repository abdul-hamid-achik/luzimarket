import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, productVariants } from '@/db/schema';
import { eq } from 'drizzle-orm';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = Number(params.id);
    const [product] = await db.select().from(products).where(eq(products.id, id));
    if (!product) {
        return NextResponse.json(
            { error: 'Product not found' },
            { status: StatusCodes.NOT_FOUND }
        );
    }
    return NextResponse.json(product, { status: StatusCodes.OK });
}

// Update an existing product
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = Number(params.id);
    const data = await request.json();
    const updateFields: any = {};
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.description !== undefined) updateFields.description = data.description;
    if (data.price !== undefined) updateFields.price = data.price;
    if (data.categoryId !== undefined) updateFields.categoryId = data.categoryId;
    const updated = await db.update(products)
        .set(updateFields)
        .where(eq(products.id, id))
        .returning()
        .execute();
    if (updated.length === 0) {
        return NextResponse.json({ error: 'Product not found' }, { status: StatusCodes.NOT_FOUND });
    }
    return NextResponse.json(updated[0], { status: StatusCodes.OK });
}

// Delete a product and its variants
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = Number(params.id);
    // delete associated variants first
    await db.delete(productVariants).where(eq(productVariants.productId, id)).execute();
    await db.delete(products).where(eq(products.id, id)).execute();
    return NextResponse.json({ success: true }, { status: StatusCodes.OK });
} 