import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addTrackingToOrder, createShippingLabel, getShippingLabels } from "@/lib/services/shipping-service";
import { z } from "zod";

const trackingSchema = z.object({
    trackingNumber: z.string().min(5, "Tracking number must be at least 5 characters"),
    carrier: z.string().min(2, "Carrier name is required"),
    trackingUrl: z.string().url().optional(),
    estimatedDeliveryDate: z.string().optional(),
});

const labelSchema = z.object({
    carrier: z.string().min(2),
    serviceType: z.string().min(2),
    labelUrl: z.string().url(),
    trackingNumber: z.string().optional(),
    cost: z.number().optional(),
    weight: z.number().optional(),
    dimensions: z.object({
        length: z.number(),
        width: z.number(),
        height: z.number(),
        unit: z.string(),
    }).optional(),
});

/**
 * POST /api/vendor/orders/[id]/shipping
 * Add tracking information to an order
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session || session.user.role !== "vendor") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id: orderId } = await params;
        const body = await request.json();
        const { action } = body;

        const vendorId = session.user.vendor?.id || session.user.id;

        if (action === "add_tracking") {
            const validation = trackingSchema.safeParse(body);

            if (!validation.success) {
                return NextResponse.json(
                    { error: "Invalid request data", details: validation.error.errors },
                    { status: 400 }
                );
            }

            const result = await addTrackingToOrder(orderId, vendorId, {
                trackingNumber: validation.data.trackingNumber,
                carrier: validation.data.carrier,
                trackingUrl: validation.data.trackingUrl,
                estimatedDeliveryDate: validation.data.estimatedDeliveryDate
                    ? new Date(validation.data.estimatedDeliveryDate)
                    : undefined,
            });

            if (!result.success) {
                return NextResponse.json(
                    { error: result.error },
                    { status: 400 }
                );
            }

            return NextResponse.json({
                success: true,
                order: result.order,
                trackingUrl: result.trackingUrl,
            });
        }

        if (action === "create_label") {
            const validation = labelSchema.safeParse(body);

            if (!validation.success) {
                return NextResponse.json(
                    { error: "Invalid request data", details: validation.error.errors },
                    { status: 400 }
                );
            }

            const result = await createShippingLabel({
                orderId,
                vendorId,
                ...validation.data,
            });

            if (!result.success) {
                return NextResponse.json(
                    { error: result.error },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                label: result.label,
            });
        }

        return NextResponse.json(
            { error: "Invalid action" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Error handling shipping request:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/vendor/orders/[id]/shipping
 * Get shipping labels for an order
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session || session.user.role !== "vendor") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id: orderId } = await params;
        const vendorId = session.user.vendor?.id || session.user.id;

        const result = await getShippingLabels(orderId, vendorId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            labels: result.labels,
        });
    } catch (error) {
        console.error("Error fetching shipping labels:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

