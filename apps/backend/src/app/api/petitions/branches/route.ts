import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbService, eq } from '@/db/service';
import { petitions } from '@/db/schema';

// Force dynamic behavior for this API route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const items = await dbService.select(petitions, eq(petitions.type, 'branch'));
  return NextResponse.json(items, { status: StatusCodes.OK });
}
