import { NextRequest, NextResponse } from 'next/server';
import { dbService, eq } from '@/db/service';
import { products, productVariants } from '@/db/schema';
import { StatusCodes } from 'http-status-codes';

export async function GET() {
    const items = await dbService.select(products);
    return NextResponse.json(items, { status: StatusCodes.OK });
}

export async function POST(request: NextRequest) {
    const { name, description, price, categoryId, variants } = await request.json();
    if (!name || !description || price == null || !categoryId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: StatusCodes.BAD_REQUEST });
    }

    const productResult = await dbService.insertReturning(products, {
        slug: name.trim().toLowerCase().replace(/\s+/g, '-'),
        name,
        description,
        price,
        categoryId
    }, { id: products.id });

    const productId = productResult[0].id;

    if (variants && Array.isArray(variants)) {
        const variantData = variants.map((v: any) => ({
            productId,
            sku: v.sku,
            attributes: JSON.stringify(v.attributes),
            stock: v.stock ?? 0,
        }));
        await dbService.insert(productVariants, variantData);
    }

    const created = await dbService.findFirst(products, eq(products.id, productId));
    return NextResponse.json(created, { status: StatusCodes.CREATED });
} 