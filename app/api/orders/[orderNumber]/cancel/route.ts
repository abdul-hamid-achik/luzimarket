import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requestRefund } from "@/lib/services/refund-service";

interface RouteParams {
  params: Promise<{ orderNumber: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { orderNumber } = await params;
    const body = await request.json();
    const { email, reason } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email requerido" },
        { status: 400 }
      );
    }

    // Find order by orderNumber and email
    const order = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.orderNumber, orderNumber),
          eq(orders.guestEmail, email)
        )
      )
      .limit(1);

    if (!order[0]) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    // Request refund using RefundService
    const result = await requestRefund(
      order[0].id,
      reason || "Solicitado por el cliente",
      order[0].userId || undefined
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json(
      { error: "Error al cancelar la orden" },
      { status: 500 }
    );
  }
}

