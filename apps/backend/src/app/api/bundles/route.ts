import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bundles, bundleItems } from '@/db/schema';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';

export async function GET() {
    const items = await db.select().from(bundles);
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

    const [{ id: bundleId }] = await db.insert(bundles)
        .values({ name, description, slug })
        .returning({ id: bundles.id })
        .execute();

    const bundleItemsData = items.map((item: any) => ({
        bundleId,
        variantId: item.variantId,
        quantity: item.quantity,
    }));
    await db.insert(bundleItems).values(bundleItemsData).execute();
    return NextResponse.json({ id: bundleId }, { status: StatusCodes.CREATED });
} 