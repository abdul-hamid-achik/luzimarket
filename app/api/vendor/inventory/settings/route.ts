import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    updateInventorySettings,
    getInventorySettings,
} from "@/lib/services/inventory-service";
import { z } from "zod";

const settingsSchema = z.object({
    lowStockThreshold: z.number().int().min(0).optional(),
    enableAutoDeactivate: z.boolean().optional(),
    notificationPreferences: z.object({
        email: z.boolean().optional(),
        lowStock: z.boolean().optional(),
        outOfStock: z.boolean().optional(),
    }).optional(),
});

/**
 * GET /api/vendor/inventory/settings
 * Get inventory settings for the logged-in vendor
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
        const result = await getInventorySettings(vendorId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({ settings: result.settings });
    } catch (error) {
        console.error("Error fetching inventory settings:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/vendor/inventory/settings
 * Update inventory settings
 */
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== "vendor") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validation = settingsSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid request data", details: validation.error.errors },
                { status: 400 }
            );
        }

        const vendorId = session.user.vendor?.id || session.user.id;
        const result = await updateInventorySettings(vendorId, validation.data);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating inventory settings:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

