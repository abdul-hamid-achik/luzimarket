import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbService, eq } from '@/db/service';
import { productVariants } from '@/db/schema';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const idParam = url.searchParams.get('productId') ?? url.searchParams.get('filters[productId][$eq]');
  if (!idParam) {
    return NextResponse.json([], { status: StatusCodes.OK });
  }
  const productId = idParam;
  // Return empty array for non-UUID productId values
  if (!/^[0-9a-fA-F-]{36}$/.test(productId)) {
    return NextResponse.json([], { status: StatusCodes.OK });
  }
  const variants = await dbService.select(productVariants, eq(productVariants.productId, productId));
  return NextResponse.json(variants, { status: StatusCodes.OK });
}
