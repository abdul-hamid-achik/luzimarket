import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    createVendorCoupon,
    getVendorCoupons,
    updateVendorCoupon,
    deleteVendorCoupon,
} from "@/lib/services/coupon-service";
import { z } from "zod";

const couponSchema = z.object({
    code: z.string().min(3).max(20).regex(/^[A-Z0-9]+$/, "Code must be uppercase letters and numbers only"),
    name: z.string().min(3),
    description: z.string().optional(),
    type: z.enum(["percentage", "fixed_amount", "free_shipping"]),
    value: z.number().min(0),
    minimumOrderAmount: z.number().min(0).optional(),
    maximumDiscountAmount: z.number().min(0).optional(),
    usageLimit: z.number().int().min(1).optional(),
    userUsageLimit: z.number().int().min(1).optional(),
    startsAt: z.string().optional(),
    expiresAt: z.string().optional(),
    restrictToProducts: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
});

/**
 * GET /api/vendor/coupons
 * Get all coupons for the vendor
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
        const result = await getVendorCoupons(vendorId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            coupons: result.coupons,
        });
    } catch (error) {
        console.error("Error fetching vendor coupons:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/vendor/coupons
 * Create a new coupon
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
        const validation = couponSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid request data", details: validation.error.errors },
                { status: 400 }
            );
        }

        const vendorId = session.user.vendor?.id || session.user.id;

        const couponData = {
            ...validation.data,
            startsAt: validation.data.startsAt ? new Date(validation.data.startsAt) : undefined,
            expiresAt: validation.data.expiresAt ? new Date(validation.data.expiresAt) : undefined,
        };

        const result = await createVendorCoupon(vendorId, couponData);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            coupon: result.coupon,
        });
    } catch (error) {
        console.error("Error creating vendor coupon:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/vendor/coupons
 * Update an existing coupon
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
        const { couponId, ...updateData } = body;

        if (!couponId) {
            return NextResponse.json(
                { error: "Coupon ID is required" },
                { status: 400 }
            );
        }

        const vendorId = session.user.vendor?.id || session.user.id;

        const result = await updateVendorCoupon(couponId, vendorId, updateData);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            coupon: result.coupon,
        });
    } catch (error) {
        console.error("Error updating vendor coupon:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/vendor/coupons
 * Delete a coupon
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
        const couponId = searchParams.get("couponId");

        if (!couponId) {
            return NextResponse.json(
                { error: "Coupon ID is required" },
                { status: 400 }
            );
        }

        const vendorId = session.user.vendor?.id || session.user.id;
        const result = await deleteVendorCoupon(couponId, vendorId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Coupon deleted",
        });
    } catch (error) {
        console.error("Error deleting vendor coupon:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

