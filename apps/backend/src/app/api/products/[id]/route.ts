import { NextRequest, NextResponse } from 'next/server';
import { dbService, eq } from '@/db/service';
import { products, productVariants } from '@/db/schema';
import { StatusCodes } from 'http-status-codes';

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