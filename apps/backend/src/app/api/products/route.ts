import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, productVariants } from '@/db/schema';
import { eq } from 'drizzle-orm';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';

export async function GET() {
    // @ts-ignore: Drizzle query returns a Promise of products
    const items = await db.select().from(products);
    return NextResponse.json(items, { status: StatusCodes.OK });
}

export async function POST(request: NextRequest) {
    const { name, description, price, categoryId, variants } = await request.json();
    if (!name || !description || price == null || !categoryId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: StatusCodes.BAD_REQUEST });
    }
    const [{ id: productId }] = await db.insert(products)
        .values({ name, description, price, categoryId })
        .returning({ id: products.id })
        .execute();
    if (variants && Array.isArray(variants)) {
        const variantData = variants.map((v: any) => ({
            productId,
            sku: v.sku,
            attributes: JSON.stringify(v.attributes),
            stock: v.stock ?? 0,
        }));
        await db.insert(productVariants).values(variantData).execute();
    }
    const [created] = await db.select().from(products).where(eq(products.id, productId));
    return NextResponse.json(created, { status: StatusCodes.CREATED });
} 