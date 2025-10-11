import { NextRequest, NextResponse } from "next/server";
import { getOrderTracking } from "@/lib/services/shipping-service";

/**
 * GET /api/orders/tracking?orderNumber=XXX
 * Public endpoint for customers to track their orders
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderNumber = searchParams.get("orderNumber");

        if (!orderNumber) {
            return NextResponse.json(
                { error: "Order number is required" },
                { status: 400 }
            );
        }

        const result = await getOrderTracking(orderNumber);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            tracking: result.tracking,
        });
    } catch (error) {
        console.error("Error fetching order tracking:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

