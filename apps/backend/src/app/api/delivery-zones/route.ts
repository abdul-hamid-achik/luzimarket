import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbService } from '@/db/service';
import { deliveryZones } from '@/db/schema';

export async function GET() {
  const items = await dbService.select(deliveryZones);
  return NextResponse.json(items, { status: StatusCodes.OK });
}
