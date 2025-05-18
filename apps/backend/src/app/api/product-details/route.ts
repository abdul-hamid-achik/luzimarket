import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { db } from '@/db';
import { productVariants } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const idParam = url.searchParams.get('productId') ?? url.searchParams.get('filters[productId][$eq]');
  if (!idParam) {
    return NextResponse.json([], { status: StatusCodes.OK });
  }
  const productId = Number(idParam);
  const variants = await db.select().from(productVariants).where(eq(productVariants.productId, productId));
  return NextResponse.json(variants, { status: StatusCodes.OK });
}
