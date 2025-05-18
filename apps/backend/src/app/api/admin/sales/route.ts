import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';

export async function GET() {
    // @ts-ignore
    const items = await db.select().from(orders);
    return NextResponse.json(items, { status: StatusCodes.OK });
} 