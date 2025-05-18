import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';
import { sql } from 'drizzle-orm';

export async function GET() {
    const result = await db.select({
        date: sql`date_trunc('day', ${orders.createdAt})`.as('date'),
        variantId: orderItems.variantId,
        totalSold: sql`SUM(${orderItems.quantity})`.as('totalSold'),
        totalRevenue: sql`SUM(${orderItems.price})`.as('totalRevenue'),
    })
        .from(orders)
        .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
        .groupBy(sql`date_trunc('day', ${orders.createdAt})`, orderItems.variantId);

    return NextResponse.json(result, { status: StatusCodes.OK });
} 