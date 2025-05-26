import { NextRequest, NextResponse } from 'next/server';
import { dbService, eq } from '@/db/service';
import { bundles, bundleItems, productVariants } from '@/db/schema';
import { StatusCodes } from 'http-status-codes';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const bundleId = id;
    const bundle = await dbService.findFirst(bundles, eq(bundles.id, bundleId));
    if (!bundle) {
        return NextResponse.json(
            { error: 'Bundle not found' },
            { status: StatusCodes.NOT_FOUND }
        );
    }
    const items = await dbService.selectFields({
        id: bundleItems.id,
        variantId: bundleItems.variantId,
        quantity: bundleItems.quantity,
        sku: productVariants.sku,
        attributes: productVariants.attributes,
    }, bundleItems);
    return NextResponse.json({ bundle, items }, { status: StatusCodes.OK });
}

// Update a bundle by id
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const bundleId = id;
    const { name, description, items } = await request.json();
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    await dbService.update(bundles, updateData, eq(bundles.id, bundleId));
    if (Array.isArray(items)) {
        // delete old items
        await dbService.delete(bundleItems, eq(bundleItems.bundleId, bundleId));
        // insert new
        const toInsert = items.map((itm: any) => ({
            bundleId: bundleId,
            variantId: itm.variantId,
            quantity: itm.quantity,
        }));
        await dbService.insert(bundleItems, toInsert);
    }
    // fetch updated bundle
    const bundle = await dbService.findFirst(bundles, eq(bundles.id, bundleId));
    const bundleData = await dbService.selectFields({
        id: bundleItems.id,
        variantId: bundleItems.variantId,
        quantity: bundleItems.quantity,
        sku: productVariants.sku,
        attributes: productVariants.attributes,
    }, bundleItems);
    return NextResponse.json({ bundle, items: bundleData }, { status: StatusCodes.OK });
}

// Delete a bundle by id
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const bundleId = id;
    await dbService.delete(bundleItems, eq(bundleItems.bundleId, bundleId));
    await dbService.delete(bundles, eq(bundles.id, bundleId));
    return NextResponse.json({ success: true }, { status: StatusCodes.OK });
} 