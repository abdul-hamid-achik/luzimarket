import { NextRequest, NextResponse } from "next/server";
import { sendCartRecoveryEmails } from "@/lib/services/cart-recovery-service";

/**
 * GET /api/cron/cart-recovery
 * Cron job to send cart recovery emails
 * Should be called every 4 hours
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

        const result = await sendCartRecoveryEmails();

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Sent ${result.sent} recovery emails`,
            sent: result.sent,
            total: result.total,
        });
    } catch (error) {
        console.error("Error in cart recovery cron job:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

