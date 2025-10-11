import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getInventoryOverview } from "@/lib/services/inventory-service";

/**
 * GET /api/vendor/inventory/overview
 * Get inventory overview for the logged-in vendor
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== "vendor") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const vendorId = session.user.vendor?.id || session.user.id;
        const result = await getInventoryOverview(vendorId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({ overview: result.overview });
    } catch (error) {
        console.error("Error fetching inventory overview:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

