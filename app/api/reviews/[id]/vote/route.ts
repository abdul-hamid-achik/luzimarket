import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { voteReviewHelpful } from "@/lib/services/review-service";
import { z } from "zod";

const voteSchema = z.object({
    voteType: z.enum(["helpful", "not_helpful"]),
});

/**
 * POST /api/reviews/[id]/vote
 * Vote on a review as helpful or not helpful
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized - must be logged in" },
                { status: 401 }
            );
        }

        const { id: reviewId } = await params;
        const body = await request.json();
        const validation = voteSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid request data", details: validation.error.errors },
                { status: 400 }
            );
        }

        const userId = session.user.id;

        const result = await voteReviewHelpful(
            reviewId,
            userId,
            validation.data.voteType
        );

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            action: result.action,
            message:
                result.action === "created" ? "Vote registered" :
                    result.action === "updated" ? "Vote updated" :
                        "Vote removed",
        });
    } catch (error) {
        console.error("Error voting on review:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

