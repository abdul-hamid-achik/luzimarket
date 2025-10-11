import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getVendorReviews, getVendorReviewAnalytics } from "@/lib/services/review-service";

/**
 * GET /api/vendor/reviews
 * Get all reviews for vendor's products
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

        const { searchParams } = new URL(request.url);
        const includeAnalytics = searchParams.get("analytics") === "true";

        const vendorId = session.user.vendor?.id || session.user.id;

        const reviewsResult = await getVendorReviews(vendorId, session.user.id);

        if (!reviewsResult.success) {
            return NextResponse.json(
                { error: reviewsResult.error },
                { status: 500 }
            );
        }

        let analytics = null;
        if (includeAnalytics) {
            const analyticsResult = await getVendorReviewAnalytics(vendorId);
            if (analyticsResult.success) {
                analytics = analyticsResult.analytics;
            }
        }

        return NextResponse.json({
            success: true,
            reviews: reviewsResult.reviews,
            analytics,
        });
    } catch (error) {
        console.error("Error fetching vendor reviews:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

