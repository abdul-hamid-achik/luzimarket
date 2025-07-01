import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus, getOrderById, type OrderStatus } from "@/lib/actions/orders";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["processing", "shipped", "delivered", "cancelled"]),
  notes: z.string().optional(),
  trackingNumber: z.string().optional(),
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
    // For now, we'll skip vendor ownership check since auth is not fully implemented
    // In production, you would verify that session.user.id corresponds to the vendor
    // TODO: Implement proper vendor authentication
    if (session.user.role !== "vendor") {
      return NextResponse.json(
        { error: "Unauthorized - vendor access required" },
        { status: 403 }
      );
    }

    // Update order status
    const success = await updateOrderStatus(
      orderId,
      validatedData.status as OrderStatus,
      validatedData.notes,
      validatedData.trackingNumber
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update order status" },
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
    // TODO: Implement proper vendor authentication
    if (session.user.role !== "vendor") {
      return NextResponse.json(
        { error: "Unauthorized - vendor access required" },
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