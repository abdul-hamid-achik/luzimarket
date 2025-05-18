import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { petitions } from '@/db/schema';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';

export async function GET() {
    // @ts-ignore
    const items = await db.select().from(petitions);
    return NextResponse.json(items, { status: StatusCodes.OK });
}

export async function POST(request: NextRequest) {
    const { type, title, description } = await request.json();
    if (!type || !title || !description) {
        return NextResponse.json(
            { error: 'Missing fields' },
            { status: StatusCodes.BAD_REQUEST }
        );
    }
    const [created] = await db.insert(petitions).values({ type, title, description }).returning().execute();
    return NextResponse.json(created, { status: StatusCodes.CREATED });
} 