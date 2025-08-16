import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";

const lookupSchema = z.object({
  email: z.string().email(),
  orderNumber: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = lookupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      );
    }

    const { email, orderNumber } = validationResult.data;

    // First, try to find a user with this email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    // Look up order by email and order number
    // Check both guest orders and user orders
    const order = await db.query.orders.findFirst({
      where: and(
        eq(orders.orderNumber, orderNumber),
        or(
          eq(orders.guestEmail, email),
          user ? eq(orders.userId, user.id) : undefined
        )
      ),
    });

    if (!order) {
      return NextResponse.json(
        { error: "No se encontró la orden con los datos proporcionados" },
        { status: 404 }
      );
    }

    // Return orderNumber for redirect so guests can access with email
    return NextResponse.json({
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("Order lookup error:", error);
    return NextResponse.json(
      { error: "Error al buscar la orden" },
      { status: 500 }
    );
  }
}