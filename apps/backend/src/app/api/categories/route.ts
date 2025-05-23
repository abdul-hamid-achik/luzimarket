import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/db/service';
import { categories } from '@/db/schema';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';

export async function GET() {
    const items = await dbService.select(categories);
    return NextResponse.json(items, { status: StatusCodes.OK });
}

export async function POST(request: NextRequest) {
    const { name, slug, description } = await request.json();
    if (!name || !slug) {
        return NextResponse.json({ error: 'Name and slug required' }, { status: StatusCodes.BAD_REQUEST });
    }

    // If description is not provided, use an empty string
    const categoryDescription = description || '';

    const created = await dbService.insert(categories, { name, slug, description: categoryDescription });

    return NextResponse.json(created, { status: StatusCodes.CREATED });
} 