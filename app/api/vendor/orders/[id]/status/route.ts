import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatusWithNotifications, getOrderById, type OrderStatus } from "@/lib/services/order-service";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["processing", "shipped", "delivered", "cancelled"]),
  notes: z.string().optional(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: orderId } = await params;
    const body = await request.json();

    // Validate request body
    const validatedData = updateStatusSchema.parse(body);

    // Get order to verify vendor ownership
    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if user is the vendor for this order
    if (session.user.role !== "vendor" || !session.user.vendor?.id) {
      return NextResponse.json(
        { error: "Unauthorized - vendor access required" },
        { status: 403 }
      );
    }

    // Verify vendor owns this order
    if (order.vendor.id !== session.user.vendor.id) {
      return NextResponse.json(
        { error: "Forbidden - you can only update your own orders" },
        { status: 403 }
      );
    }

    // Update order status with notifications using OrderService
    const result = await updateOrderStatusWithNotifications(
      orderId,
      validatedData.status as OrderStatus,
      validatedData.notes,
      validatedData.trackingNumber,
      validatedData.carrier
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update order status" },
        { status: 500 }
      );
    }

    // Get updated order
    const updatedOrder = await getOrderById(orderId);

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: orderId } = await params;
    const order = await getOrderById(orderId);

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if user is the vendor for this order
    if (session.user.role !== "vendor" || !session.user.vendor?.id) {
      return NextResponse.json(
        { error: "Unauthorized - vendor access required" },
        { status: 403 }
      );
    }

    // Verify vendor owns this order
    if (order.vendor.id !== session.user.vendor.id) {
      return NextResponse.json(
        { error: "Forbidden - you can only view your own orders" },
        { status: 403 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}