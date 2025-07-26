import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, orderItems, users } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== "vendor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const vendorOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        total: orders.total,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        createdAt: orders.createdAt,
        customerName: sql<string>`COALESCE(${users.name}, ${orders.guestName})`,
        customerEmail: sql<string>`COALESCE(${users.email}, ${orders.guestEmail})`,
        itemCount: sql<number>`(
          SELECT COUNT(*) FROM ${orderItems}
          WHERE ${orderItems.orderId} = ${orders.id}
        )`,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.vendorId, session.user.id))
      .orderBy(desc(orders.createdAt));

    return NextResponse.json(vendorOrders);
  } catch (error) {
    console.error("Error fetching vendor orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}