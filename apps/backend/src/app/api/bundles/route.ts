import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/db/service';
import { bundles, bundleItems } from '@/db/schema';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';

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

    const [{ id: bundleId }] = await dbService.insertReturning(bundles,
        { name, description, slug },
        { id: bundles.id }
    );

    const bundleItemsData = items.map((item: any) => ({
        bundleId,
        variantId: item.variantId,
        quantity: item.quantity,
    }));
    await dbService.insert(bundleItems, bundleItemsData);
    return NextResponse.json({ id: bundleId }, { status: StatusCodes.CREATED });
} 