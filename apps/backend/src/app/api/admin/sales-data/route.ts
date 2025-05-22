import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { NeonDatabase } from 'drizzle-orm/neon-serverless';
import { StatusCodes } from 'http-status-codes';

// Import specific schema table definitions for casting
import { orders as sqliteOrdersSchema, orderItems as sqliteOrderItemsSchema } from '../../../../db/schema.sqlite';
import { orders as pgOrdersSchema, orderItems as pgOrderItemsSchema } from '../../../../db/schema.postgres';

const DB_MODE = process.env.DB_MODE || 'online';

export async function GET() {
    if (DB_MODE === 'offline') {
        const sqliteDb = db as BetterSQLite3Database;
        // Cast to specific SQLite schema types
        const typedOrders = orders as typeof sqliteOrdersSchema;
        const typedOrderItems = orderItems as typeof sqliteOrderItemsSchema;

        const dateExpression = sql`strftime('%Y-%m-%d', ${typedOrders.createdAt})`;
        const result = await sqliteDb
            .select({
                date: dateExpression.as('date'),
                variantId: typedOrderItems.variantId,
                totalSold: sql`SUM(${typedOrderItems.quantity})`.as('totalSold'),
                totalRevenue: sql`SUM(${typedOrderItems.price})`.as('totalRevenue'),
            })
            .from(typedOrders)
            .leftJoin(typedOrderItems, eq(typedOrderItems.orderId, typedOrders.id))
            .groupBy(dateExpression, typedOrderItems.variantId);

        return NextResponse.json(result, { status: StatusCodes.OK });
    } else {
        const pgDb = db as NeonDatabase;
        // Cast to specific PostgreSQL schema types
        const typedOrders = orders as typeof pgOrdersSchema;
        const typedOrderItems = orderItems as typeof pgOrderItemsSchema;

        const dateExpression = sql`date_trunc('day', ${typedOrders.createdAt})`;
        const result = await pgDb
            .select({
                date: dateExpression.as('date'),
                variantId: typedOrderItems.variantId,
                totalSold: sql`SUM(${typedOrderItems.quantity})`.as('totalSold'),
                totalRevenue: sql`SUM(${typedOrderItems.price})`.as('totalRevenue'),
            })
            .from(typedOrders)
            .leftJoin(typedOrderItems, eq(typedOrderItems.orderId, typedOrders.id))
            .groupBy(dateExpression, typedOrderItems.variantId);

        return NextResponse.json(result, { status: StatusCodes.OK });
    }
}