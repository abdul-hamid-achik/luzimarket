import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listOrders } from "@/lib/services/order-service";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    // List orders using OrderService
    const result = await listOrders({
      userId: session.user.id,
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orders: result.orders,
      pagination: result.pagination,
    });

  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Error al obtener las órdenes" },
      { status: 500 }
    );
  }
}