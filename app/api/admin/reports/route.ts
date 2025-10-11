import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPlatformAnalytics } from "@/lib/services/analytics-service";

/**
 * GET /api/admin/reports?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Get platform-wide analytics reports
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");

        // Default to last 30 days
        const endDate = endDateParam ? new Date(endDateParam) : new Date();
        const startDate = startDateParam
            ? new Date(startDateParam)
            : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

        const result = await getPlatformAnalytics({ startDate, endDate });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            analytics: result.analytics,
            dateRange: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
        });
    } catch (error) {
        console.error("Error fetching admin reports:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

