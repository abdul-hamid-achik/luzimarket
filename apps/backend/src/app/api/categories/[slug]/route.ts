import { NextRequest, NextResponse } from 'next/server';
import { dbService, eq } from '@/db/service';
import { categories } from '@/db/schema';
import { StatusCodes } from 'http-status-codes';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const category = await dbService.findFirst(categories, eq(categories.slug, slug));
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

    await dbService.update(categories, updateFields, eq(categories.slug, slug));

    // Get the updated category
    const updated = await dbService.findFirst(categories, eq(categories.slug, data.slug || slug));
    if (!updated) {
        return NextResponse.json({ error: 'Category not found' }, { status: StatusCodes.NOT_FOUND });
    }
    return NextResponse.json(updated, { status: StatusCodes.OK });
}

// Delete a category by slug
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    await dbService.delete(categories, eq(categories.slug, slug));
    return NextResponse.json({ success: true }, { status: StatusCodes.OK });
} 