// @ts-ignore: Allow necessary imports
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { dbService, eq } from '@/db/service';
import { sessions, orders, cartItems, orderItems, productVariants, products } from '@/db/schema';
import { StatusCodes } from 'http-status-codes';

function getSessionId(request: NextRequest): string | null {
    const auth = request.headers.get('Authorization') || '';
    if (!auth.startsWith('Bearer ')) return null;
    try {
        const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';
        const payload = jwt.verify(auth.split(' ')[1], jwtSecret);
        if (typeof payload === 'object' && 'sessionId' in payload) return String(payload.sessionId);
    } catch { }
    return null;
}

export async function GET(request: NextRequest) {
    const sessionId = getSessionId(request);
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });

    // get userId from session
    const session = await dbService.findFirst(sessions, eq(sessions.id, sessionId));
    if (!session || !session.userId) return NextResponse.json([], { status: StatusCodes.OK });

    const items = await dbService.select(orders, eq(orders.userId, session.userId));
    return NextResponse.json(items, { status: StatusCodes.OK });
}

export async function POST(request: NextRequest) {
    const sessionId = getSessionId(request);
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });

    const session = await dbService.findFirst(sessions, eq(sessions.id, sessionId));
    if (!session || !session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });

    const cart = await dbService.select(cartItems, eq(cartItems.sessionId, sessionId));
    if (cart.length === 0) return NextResponse.json({ error: 'Cart empty' }, { status: StatusCodes.BAD_REQUEST });

    let total = 0;
    for (const item of cart) {
        if (item.variantId) {
            const variant = await dbService.findFirst(productVariants, eq(productVariants.id, item.variantId));
            if (!variant || !variant.productId) continue;

            // Fetch product price
            const productInfo = await dbService.findFirst(products, eq(products.id, variant.productId));
            if (!productInfo) continue;
            total += productInfo.price * item.quantity;
        }
    }

    let newOrderRes;
    try {
        newOrderRes = await dbService.insertReturning(orders,
            { userId: session.userId, total },
            { id: orders.id }
        );
    } catch (error: any) {
        console.error('Error creating order:', error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
    }

    const orderId = newOrderRes[0].id;

    for (const item of cart) {
        try {
            // Fetch price at purchase time
            if (item.variantId) {
                const variant = await dbService.findFirst(productVariants, eq(productVariants.id, item.variantId));
                let priceAtPurchase = 0;
                if (variant && variant.productId) {
                    const productInfo = await dbService.findFirst(products, eq(products.id, variant.productId));
                    if (productInfo) priceAtPurchase = productInfo.price;
                }

                await dbService.insert(orderItems, {
                    orderId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    price: priceAtPurchase * item.quantity
                });
            }
        } catch (error: any) {
            console.error('Error inserting order item:', error);
            return NextResponse.json({ error: 'Failed to create order items' }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
        }
    }

    // clear cart
    await dbService.delete(cartItems, eq(cartItems.sessionId, sessionId));
    return NextResponse.json({ orderId }, { status: StatusCodes.CREATED });
} 