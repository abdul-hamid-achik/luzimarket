// @ts-ignore
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { dbService, eq, and } from '@/db/service';
import { sessions, cartItems, productVariants, products } from '@/db/schema';
import { StatusCodes } from 'http-status-codes';

function getSessionId(request: NextRequest): string | null {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;

  try {
    // Use a fallback JWT_SECRET for tests if not available in environment
    const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, jwtSecret);

    if (typeof payload === 'object' && 'sessionId' in payload) {
      return String(payload.sessionId);
    }
  } catch (error) {
    console.error('JWT verification error:', error);
  }
  return null;
}

// Get a single cart item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionId = getSessionId(request);
  if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Invalid item ID' }, { status: StatusCodes.BAD_REQUEST });

  try {
    // Get the cart item
    const item = await dbService.findFirst(cartItems, and(
      eq(cartItems.id, id),
      eq(cartItems.sessionId, sessionId)
    ));

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: StatusCodes.NOT_FOUND });
    }

    // Get product details
    let productDetails = {};
    if (item.variantId) {
      try {
        const productVariant = await dbService.findFirst(productVariants, eq(productVariants.id, item.variantId));

        if (productVariant && productVariant.productId) {
          const productInfo = await dbService.findFirst(products, eq(products.id, productVariant.productId));

          if (productInfo) {
            productDetails = {
              name: productInfo.name,
              description: productInfo.description,
              price: productInfo.price
            };
          }
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
      }
    }

    // Return the item with product details
    return NextResponse.json({
      ...item,
      productId: item.variantId,
      ...productDetails
    }, { status: StatusCodes.OK });
  } catch (error) {
    console.error('Error fetching cart item:', error);
    return NextResponse.json({ error: 'Failed to fetch cart item' }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
  }
}

// Update a cart item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionId = getSessionId(request);
  if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Invalid item ID' }, { status: StatusCodes.BAD_REQUEST });

  try {
    const { quantity } = await request.json();

    if (typeof quantity !== 'number' || quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be a positive number' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    // Update the cart item
    await dbService.update(cartItems, { quantity }, and(
      eq(cartItems.id, id),
      eq(cartItems.sessionId, sessionId)
    ));

    // Get the updated item
    const updated = await dbService.findFirst(cartItems, and(
      eq(cartItems.id, id),
      eq(cartItems.sessionId, sessionId)
    ));

    if (!updated) {
      return NextResponse.json({ error: 'Item not found' }, { status: StatusCodes.NOT_FOUND });
    }

    // Get product details
    let productDetails = {};
    if (updated.variantId) {
      try {
        const productVariant = await dbService.findFirst(productVariants, eq(productVariants.id, updated.variantId));

        if (productVariant && productVariant.productId) {
          const productInfo = await dbService.findFirst(products, eq(products.id, productVariant.productId));

          if (productInfo) {
            productDetails = {
              name: productInfo.name,
              description: productInfo.description,
              price: productInfo.price
            };
          }
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
      }
    }

    // Return the updated item with product details
    return NextResponse.json({
      ...updated,
      productId: updated.variantId,
      ...productDetails
    }, { status: StatusCodes.OK });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json({ error: 'Failed to update cart item' }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
  }
}

// Delete a cart item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionId = getSessionId(request);
  if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Invalid item ID' }, { status: StatusCodes.BAD_REQUEST });

  try {
    // Get the item before deleting
    const itemToDelete = await dbService.findFirst(cartItems, and(
      eq(cartItems.id, id),
      eq(cartItems.sessionId, sessionId)
    ));

    if (!itemToDelete) {
      return NextResponse.json({ error: 'Item not found' }, { status: StatusCodes.NOT_FOUND });
    }

    // Delete the cart item
    await dbService.delete(cartItems, and(
      eq(cartItems.id, id),
      eq(cartItems.sessionId, sessionId)
    ));

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully',
      id: itemToDelete.id
    }, { status: StatusCodes.OK });
  } catch (error) {
    console.error('Error deleting cart item:', error);
    return NextResponse.json({ error: 'Failed to delete cart item' }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
  }
}
