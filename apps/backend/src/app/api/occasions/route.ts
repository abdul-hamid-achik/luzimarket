import { NextResponse } from 'next/server';
import { db } from '@/db';
import { occasions } from '@/db/schema';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';

export async function GET() {
    // @ts-ignore
    const items = await db.select().from(occasions);
    return NextResponse.json(items, { status: StatusCodes.OK });
} 