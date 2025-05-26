import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbService, eq } from '@/db/service';
import { petitions } from '@/db/schema';

export async function GET() {
  const items = await dbService.select(petitions, eq(petitions.type, 'admission'));
  return NextResponse.json(items, { status: StatusCodes.OK });
}
