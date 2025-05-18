import { NextResponse } from 'next/server';
import { db } from '@/db';
import { brands } from '@/db/schema';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';

export async function GET() {
    // @ts-ignore: Drizzle query returns Promise
    const items = await db.select().from(brands);
    return NextResponse.json(items, { status: StatusCodes.OK });
} 