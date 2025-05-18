import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { db } from '@/db';
import { petitions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const items = await db.select().from(petitions).where(eq(petitions.type, 'admission'));
  return NextResponse.json(items, { status: StatusCodes.OK });
}
