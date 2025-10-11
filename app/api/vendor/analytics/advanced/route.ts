import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getVendorTrends, getRevenueForecast } from "@/lib/services/analytics-service";

/**
 * GET /api/vendor/analytics/advanced?days=30
 * Get advanced analytics for vendor
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

        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get("days") || "30");

        const vendorId = session.user.vendor?.id || session.user.id;

        // Get trends and forecast
        const [trendsResult, forecastResult] = await Promise.all([
            getVendorTrends(vendorId, days),
            getRevenueForecast(vendorId, days),
        ]);

        return NextResponse.json({
            success: true,
            trends: trendsResult.success ? trendsResult.trends : null,
            forecast: forecastResult.success ? forecastResult.forecast : null,
        });
    } catch (error) {
        console.error("Error fetching advanced analytics:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

