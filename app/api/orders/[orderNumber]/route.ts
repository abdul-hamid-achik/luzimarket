import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrderByNumber } from "@/lib/services/order-service";

interface RouteParams {
  params: Promise<{ orderNumber: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { orderNumber } = await params;

    // Get order using OrderService
    const result = await getOrderByNumber(orderNumber, session.user.id);

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
    console.error("Error fetching order details:", error);
    return NextResponse.json(
      { error: "Error al obtener los detalles de la orden" },
      { status: 500 }
    );
  }
}