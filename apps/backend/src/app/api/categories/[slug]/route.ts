import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq } from 'drizzle-orm';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
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
    const updated = await db.update(categories)
        .set(updateFields)
        .where(eq(categories.slug, slug))
        .returning()
        .execute();
    if (updated.length === 0) {
        return NextResponse.json({ error: 'Category not found' }, { status: StatusCodes.NOT_FOUND });
    }
    return NextResponse.json(updated[0], { status: StatusCodes.OK });
}

// Delete a category by slug
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    await db.delete(categories).where(eq(categories.slug, slug)).execute();
    return NextResponse.json({ success: true }, { status: StatusCodes.OK });
} 