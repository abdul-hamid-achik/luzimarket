// @ts-ignore
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions, cartItems, productVariants, products } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { StatusCodes } from 'http-status-codes';

function getSessionId(request: NextRequest): number | null {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;

  try {
    // Use a fallback JWT_SECRET for tests if not available in environment
    const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, jwtSecret);

    if (typeof payload === 'object' && 'sessionId' in payload) {
      return Number(payload.sessionId);
    }
  } catch (error) {
    console.error('JWT verification error:', error);
  }
  return null;
}

// Get a single cart item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = getSessionId(request);
  if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });

  const itemId = Number(params.id);
  if (isNaN(itemId)) return NextResponse.json({ error: 'Invalid item ID' }, { status: StatusCodes.BAD_REQUEST });

  try {
    // Get the cart item
    const [item] = await db.select()
      .from(cartItems)
      .where(and(
        eq(cartItems.id, itemId),
        eq(cartItems.sessionId, sessionId)
      ));

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: StatusCodes.NOT_FOUND });
    }

    // Get product details
    let productDetails = {};
    if (item.variantId) {
      try {
        const [productVariant] = await db.select()
          .from(productVariants)
          .where(eq(productVariants.id, item.variantId));

        if (productVariant && productVariant.productId) {
          const [productInfo] = await db.select()
            .from(products)
            .where(eq(products.id, productVariant.productId));

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
  { params }: { params: { id: string } }
) {
  const sessionId = getSessionId(request);
  if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });

  const itemId = Number(params.id);
  if (isNaN(itemId)) return NextResponse.json({ error: 'Invalid item ID' }, { status: StatusCodes.BAD_REQUEST });

  try {
    const { quantity } = await request.json();

    if (typeof quantity !== 'number' || quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be a positive number' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    // Update the cart item
    const [updated] = await db.update(cartItems)
      .set({ quantity })
      .where(and(
        eq(cartItems.id, itemId),
        eq(cartItems.sessionId, sessionId)
      ))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Item not found' }, { status: StatusCodes.NOT_FOUND });
    }

    // Get product details
    let productDetails = {};
    if (updated.variantId) {
      try {
        const [productVariant] = await db.select()
          .from(productVariants)
          .where(eq(productVariants.id, updated.variantId));

        if (productVariant && productVariant.productId) {
          const [productInfo] = await db.select()
            .from(products)
            .where(eq(products.id, productVariant.productId));

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
  { params }: { params: { id: string } }
) {
  const sessionId = getSessionId(request);
  if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });

  const itemId = Number(params.id);
  if (isNaN(itemId)) return NextResponse.json({ error: 'Invalid item ID' }, { status: StatusCodes.BAD_REQUEST });

  try {
    // Delete the cart item
    const [deleted] = await db.delete(cartItems)
      .where(and(
        eq(cartItems.id, itemId),
        eq(cartItems.sessionId, sessionId)
      ))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Item not found' }, { status: StatusCodes.NOT_FOUND });
    }

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully',
      id: deleted.id
    }, { status: StatusCodes.OK });
  } catch (error) {
    console.error('Error deleting cart item:', error);
    return NextResponse.json({ error: 'Failed to delete cart item' }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
  }
}
