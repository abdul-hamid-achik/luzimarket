import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getOrderByNumber } from "@/lib/services/order-service";

interface RouteParams {
  params: Promise<{ orderNumber: string }>;
}

// Public endpoint for guests to fetch their order details using order number + email
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const { orderNumber } = await params;

    if (!email) {
      return NextResponse.json(
        { error: "Email requerido" },
        { status: 400 }
      );
    }

    // Verify email matches order before fetching details
    const orderCheck = await db
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.orderNumber, orderNumber), eq(orders.guestEmail, email)))
      .limit(1);

    if (!orderCheck[0]) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    // Get order using OrderService (without userId for guest access)
    const result = await getOrderByNumber(orderNumber);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Orden no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      order: result.order,
      relatedOrders: result.relatedOrders || []
    });
  } catch (error) {
    console.error("Error fetching guest order details:", error);
    return NextResponse.json(
      { error: "Error al obtener los detalles de la orden" },
      { status: 500 }
    );
  }
}


