import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { db } from '@/db';
import { orders } from '@/db/schema';

export async function GET() {
  const items = await db.select().from(orders);
  return NextResponse.json(items, { status: StatusCodes.OK });
}
