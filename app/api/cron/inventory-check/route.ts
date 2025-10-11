import { NextRequest, NextResponse } from "next/server";
import { checkInventoryLevels } from "@/lib/services/inventory-service";

/**
 * GET /api/cron/inventory-check
 * Cron job to check inventory levels and trigger alerts
 * Should be called hourly by a cron service (e.g., Vercel Cron, GitHub Actions)
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

        const result = await checkInventoryLevels();

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Checked inventory levels. Triggered ${result.triggered} alerts.`,
            alerts: result.alerts,
        });
    } catch (error) {
        console.error("Error in inventory check cron job:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

