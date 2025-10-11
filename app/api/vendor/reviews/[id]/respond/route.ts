import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createReviewResponse, deleteReviewResponse } from "@/lib/services/review-service";
import { z } from "zod";

const responseSchema = z.object({
    responseText: z.string().min(10, "Response must be at least 10 characters"),
});

/**
 * POST /api/vendor/reviews/[id]/respond
 * Create or update a vendor response to a review
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

        const { id: reviewId } = await params;
        const body = await request.json();
        const validation = responseSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid request data", details: validation.error.errors },
                { status: 400 }
            );
        }

        const vendorId = session.user.vendor?.id || session.user.id;

        const result = await createReviewResponse(
            reviewId,
            vendorId,
            validation.data.responseText
        );

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            response: result.response,
            message: result.isUpdate ? "Response updated" : "Response created",
        });
    } catch (error) {
        console.error("Error creating review response:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/vendor/reviews/[id]/respond
 * Delete a vendor response
 */
export async function DELETE(
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

        await params; // Consume params even if not used
        const { searchParams } = new URL(request.url);
        const responseId = searchParams.get("responseId");

        if (!responseId) {
            return NextResponse.json(
                { error: "Response ID is required" },
                { status: 400 }
            );
        }

        const vendorId = session.user.vendor?.id || session.user.id;
        const result = await deleteReviewResponse(responseId, vendorId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Response deleted",
        });
    } catch (error) {
        console.error("Error deleting review response:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

