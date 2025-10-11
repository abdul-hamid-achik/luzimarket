import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    createInventoryAlert,
    getVendorInventoryAlerts,
    deleteInventoryAlert,
} from "@/lib/services/inventory-service";
import { z } from "zod";

const alertSchema = z.object({
    productId: z.string().uuid(),
    alertType: z.enum(["low_stock", "out_of_stock"]),
    threshold: z.number().int().min(0),
    isActive: z.boolean().optional(),
});

/**
 * GET /api/vendor/inventory/alerts
 * Get all inventory alerts for the logged-in vendor
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
        const result = await getVendorInventoryAlerts(vendorId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({ alerts: result.alerts });
    } catch (error) {
        console.error("Error fetching inventory alerts:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/vendor/inventory/alerts
 * Create a new inventory alert
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== "vendor") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validation = alertSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid request data", details: validation.error.errors },
                { status: 400 }
            );
        }

        const vendorId = session.user.vendor?.id || session.user.id;
        const result = await createInventoryAlert(vendorId, validation.data);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            alert: result.alert,
        });
    } catch (error) {
        console.error("Error creating inventory alert:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/vendor/inventory/alerts
 * Delete an inventory alert
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== "vendor") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const alertId = searchParams.get("alertId");

        if (!alertId) {
            return NextResponse.json(
                { error: "Alert ID is required" },
                { status: 400 }
            );
        }

        const vendorId = session.user.vendor?.id || session.user.id;
        const result = await deleteInventoryAlert(alertId, vendorId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting inventory alert:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

