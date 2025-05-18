import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';

export async function GET() {
    // @ts-ignore
    const items = await db.select().from(categories);
    return NextResponse.json(items, { status: StatusCodes.OK });
}

export async function POST(request: NextRequest) {
    const { name, slug } = await request.json();
    if (!name || !slug) {
        return NextResponse.json({ error: 'Name and slug required' }, { status: StatusCodes.BAD_REQUEST });
    }
    const [created] = await db.insert(categories).values({ name, slug }).returning().execute();
    return NextResponse.json(created, { status: StatusCodes.CREATED });
} 