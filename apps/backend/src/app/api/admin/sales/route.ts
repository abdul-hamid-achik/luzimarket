import { NextResponse } from 'next/server';
import { dbService } from '@/db/service';
import { orders } from '@/db/schema';
import { StatusCodes } from 'http-status-codes';

export async function GET() {
    const items = await dbService.select(orders);
    return NextResponse.json(items, { status: StatusCodes.OK });
} 