import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bundles, bundleItems, productVariants } from '@/db/schema';
import { eq } from 'drizzle-orm';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = Number(params.id);
    const [bundle] = await db.select().from(bundles).where(eq(bundles.id, id));
    if (!bundle) {
        return NextResponse.json(
            { error: 'Bundle not found' },
            { status: StatusCodes.NOT_FOUND }
        );
    }
    const items = await db.select({
        id: bundleItems.id,
        variantId: bundleItems.variantId,
        quantity: bundleItems.quantity,
        sku: productVariants.sku,
        attributes: productVariants.attributes,
    })
        .from(bundleItems)
        .leftJoin(productVariants, eq(bundleItems.variantId, productVariants.id))
        .where(eq(bundleItems.bundleId, id));
    return NextResponse.json({ bundle, items }, { status: StatusCodes.OK });
}

// Update a bundle by id
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = Number(params.id);
    const { name, description, items } = await request.json();
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    await db.update(bundles).set(updateData).where(eq(bundles.id, id)).execute();
    if (Array.isArray(items)) {
        // delete old items
        await db.delete(bundleItems).where(eq(bundleItems.bundleId, id)).execute();
        // insert new
        const toInsert = items.map((itm: any) => ({
            bundleId: id,
            variantId: itm.variantId,
            quantity: itm.quantity,
        }));
        await db.insert(bundleItems).values(toInsert).execute();
    }
    // fetch updated bundle
    const [bundle] = await db.select().from(bundles).where(eq(bundles.id, id));
    const bundleData = await db.select({
        id: bundleItems.id,
        variantId: bundleItems.variantId,
        quantity: bundleItems.quantity,
        sku: productVariants.sku,
        attributes: productVariants.attributes,
    })
        .from(bundleItems)
        .leftJoin(productVariants, eq(bundleItems.variantId, productVariants.id))
        .where(eq(bundleItems.bundleId, id));
    return NextResponse.json({ bundle, items: bundleData }, { status: StatusCodes.OK });
}

// Delete a bundle by id
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = Number(params.id);
    await db.delete(bundleItems).where(eq(bundleItems.bundleId, id)).execute();
    await db.delete(bundles).where(eq(bundles.id, id)).execute();
    return NextResponse.json({ success: true }, { status: StatusCodes.OK });
} 