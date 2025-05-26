import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbService, eq } from '@/db/service';
import { productVariants } from '@/db/schema';
import { validatePrefixedId, isLegacyUUID, ID_PATTERNS } from '@/lib/ids';

function isValidProductId(str: string): boolean {
  // Validate new prefixed ID format or accept legacy UUIDs for backward compatibility
  return validatePrefixedId(str, ID_PATTERNS.PRODUCT) || isLegacyUUID(str);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const idParam = url.searchParams.get('productId') ?? url.searchParams.get('filters[productId][$eq]');
  if (!idParam) {
    return NextResponse.json([], { status: StatusCodes.OK });
  }
  const productId = idParam;
  // Return empty array for invalid productId values
  if (!isValidProductId(productId)) {
    return NextResponse.json([], { status: StatusCodes.OK });
  }
  const variants = await dbService.select(productVariants, eq(productVariants.productId, productId));
  return NextResponse.json(variants, { status: StatusCodes.OK });
}
