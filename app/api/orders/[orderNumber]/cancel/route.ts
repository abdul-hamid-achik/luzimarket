import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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

    // Find order by orderNumber and email (works for both guests and authenticated users)
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

    // Check if order can be cancelled (not already shipped/delivered/cancelled)
    if (['shipped', 'delivered', 'cancelled', 'refunded'].includes(order[0].status)) {
      return NextResponse.json(
        { error: `No se puede cancelar una orden con estado: ${order[0].status}` },
        { status: 400 }
      );
    }

    // Request cancellation (manual approval workflow)
    await db
      .update(orders)
      .set({
        cancellationStatus: "requested",
        cancellationReason: reason || "Solicitado por el cliente",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order[0].id));

    // TODO: Send notification to vendor about cancellation request

    return NextResponse.json({
      success: true,
      message: "Solicitud de cancelación enviada al vendedor. Recibirás una notificación cuando sea procesada."
    });

  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json(
      { error: "Error al cancelar la orden" },
      { status: 500 }
    );
  }
}

