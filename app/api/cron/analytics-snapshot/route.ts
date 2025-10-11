import { NextRequest, NextResponse } from "next/server";
import { createDailySnapshots } from "@/lib/services/analytics-service";

/**
 * GET /api/cron/analytics-snapshot
 * Cron job to create daily analytics snapshots for all vendors
 * Should be called daily by a cron service (e.g., Vercel Cron)
 */
export async function GET(request: NextRequest) {
    try {
        // Verify the request is from a cron service
        const authHeader = request.headers.get("authorization");

        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const result = await createDailySnapshots();

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: result.message,
            results: result.results,
        });
    } catch (error) {
        console.error("Error in analytics snapshot cron job:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

