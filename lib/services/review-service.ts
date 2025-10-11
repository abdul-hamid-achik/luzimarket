import { db } from "@/db";
import {
    reviews,
    vendorReviewResponses,
    reviewHelpfulVotes,
    products,
    users,
    vendors
} from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { sendEmail } from "@/lib/email";

export interface ReviewWithDetails {
    review: typeof reviews.$inferSelect;
    user: typeof users.$inferSelect | null;
    product: typeof products.$inferSelect | null;
    vendorResponse: typeof vendorReviewResponses.$inferSelect | null;
    helpfulVotes: number;
    userHasVoted: boolean;
}

/**
 * Gets all reviews for a vendor's products
 */
export async function getVendorReviews(vendorId: string, userId?: string) {
    try {
        // Get all products for this vendor
        const vendorProducts = await db
            .select({ id: products.id })
            .from(products)
            .where(eq(products.vendorId, vendorId));

        const productIds = vendorProducts.map(p => p.id);

        if (productIds.length === 0) {
            return { success: true, reviews: [] };
        }

        // Get reviews for these products
        const reviewsData = await db
            .select({
                review: reviews,
                user: users,
                product: products,
                vendorResponse: vendorReviewResponses,
            })
            .from(reviews)
            .leftJoin(users, eq(reviews.userId, users.id))
            .leftJoin(products, eq(reviews.productId, products.id))
            .leftJoin(vendorReviewResponses, eq(reviews.id, vendorReviewResponses.reviewId))
            .where(sql`${reviews.productId} IN ${productIds}`)
            .orderBy(desc(reviews.createdAt));

        // Get helpful votes count for each review
        const reviewsWithVotes: ReviewWithDetails[] = await Promise.all(
            reviewsData.map(async (r) => {
                const [voteCount] = await db
                    .select({ count: sql<number>`count(*)` })
                    .from(reviewHelpfulVotes)
                    .where(
                        and(
                            eq(reviewHelpfulVotes.reviewId, r.review.id),
                            eq(reviewHelpfulVotes.voteType, "helpful")
                        )
                    );

                // Check if current user has voted
                let userHasVoted = false;
                if (userId) {
                    const [userVote] = await db
                        .select()
                        .from(reviewHelpfulVotes)
                        .where(
                            and(
                                eq(reviewHelpfulVotes.reviewId, r.review.id),
                                eq(reviewHelpfulVotes.userId, userId)
                            )
                        )
                        .limit(1);
                    userHasVoted = !!userVote;
                }

                return {
                    ...r,
                    helpfulVotes: voteCount?.count || 0,
                    userHasVoted,
                };
            })
        );

        return {
            success: true,
            reviews: reviewsWithVotes,
        };
    } catch (error) {
        console.error("Error fetching vendor reviews:", error);
        return {
            success: false,
            error: "Failed to fetch reviews",
            reviews: [],
        };
    }
}

/**
 * Creates a vendor response to a review
 */
export async function createReviewResponse(
    reviewId: string,
    vendorId: string,
    responseText: string
) {
    try {
        // Verify the review is for a product owned by this vendor
        const [reviewData] = await db
            .select({
                review: reviews,
                product: products,
            })
            .from(reviews)
            .leftJoin(products, eq(reviews.productId, products.id))
            .where(eq(reviews.id, reviewId))
            .limit(1);

        if (!reviewData || reviewData.product?.vendorId !== vendorId) {
            return {
                success: false,
                error: "Review not found or unauthorized",
            };
        }

        // Check if response already exists
        const [existing] = await db
            .select()
            .from(vendorReviewResponses)
            .where(eq(vendorReviewResponses.reviewId, reviewId))
            .limit(1);

        if (existing) {
            // Update existing response
            const [updated] = await db
                .update(vendorReviewResponses)
                .set({
                    responseText,
                    updatedAt: new Date(),
                })
                .where(eq(vendorReviewResponses.id, existing.id))
                .returning();

            return {
                success: true,
                response: updated,
                isUpdate: true,
            };
        }

        // Create new response
        const [response] = await db
            .insert(vendorReviewResponses)
            .values({
                reviewId,
                vendorId,
                responseText,
            })
            .returning();

        // Send notification to user who wrote the review
        await notifyUserOfVendorResponse(reviewData.review, responseText);

        return {
            success: true,
            response,
            isUpdate: false,
        };
    } catch (error) {
        console.error("Error creating review response:", error);
        return {
            success: false,
            error: "Failed to create response",
        };
    }
}

/**
 * Deletes a vendor response
 */
export async function deleteReviewResponse(responseId: string, vendorId: string) {
    try {
        await db
            .delete(vendorReviewResponses)
            .where(
                and(
                    eq(vendorReviewResponses.id, responseId),
                    eq(vendorReviewResponses.vendorId, vendorId)
                )
            );

        return { success: true };
    } catch (error) {
        console.error("Error deleting review response:", error);
        return {
            success: false,
            error: "Failed to delete response",
        };
    }
}

/**
 * Marks a review as helpful/not helpful
 */
export async function voteReviewHelpful(
    reviewId: string,
    userId: string,
    voteType: "helpful" | "not_helpful"
) {
    try {
        // Check if user already voted
        const [existing] = await db
            .select()
            .from(reviewHelpfulVotes)
            .where(
                and(
                    eq(reviewHelpfulVotes.reviewId, reviewId),
                    eq(reviewHelpfulVotes.userId, userId)
                )
            )
            .limit(1);

        if (existing) {
            if (existing.voteType === voteType) {
                // Remove vote if same type
                await db
                    .delete(reviewHelpfulVotes)
                    .where(eq(reviewHelpfulVotes.id, existing.id));

                return {
                    success: true,
                    action: "removed",
                };
            } else {
                // Update vote type
                await db
                    .update(reviewHelpfulVotes)
                    .set({ voteType })
                    .where(eq(reviewHelpfulVotes.id, existing.id));

                return {
                    success: true,
                    action: "updated",
                };
            }
        }

        // Create new vote
        await db.insert(reviewHelpfulVotes).values({
            reviewId,
            userId,
            voteType,
        });

        // Update helpful count on review
        const [helpfulCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(reviewHelpfulVotes)
            .where(
                and(
                    eq(reviewHelpfulVotes.reviewId, reviewId),
                    eq(reviewHelpfulVotes.voteType, "helpful")
                )
            );

        await db
            .update(reviews)
            .set({ helpfulCount: helpfulCount?.count || 0 })
            .where(eq(reviews.id, reviewId));

        return {
            success: true,
            action: "created",
        };
    } catch (error) {
        console.error("Error voting on review:", error);
        return {
            success: false,
            error: "Failed to vote on review",
        };
    }
}

/**
 * Gets review analytics for a vendor
 */
export async function getVendorReviewAnalytics(vendorId: string) {
    try {
        // Get all products for this vendor
        const vendorProducts = await db
            .select({ id: products.id })
            .from(products)
            .where(eq(products.vendorId, vendorId));

        const productIds = vendorProducts.map(p => p.id);

        if (productIds.length === 0) {
            return {
                success: true,
                analytics: {
                    totalReviews: 0,
                    averageRating: 0,
                    responseRate: 0,
                    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                    recentReviews: 0,
                },
            };
        }

        // Total reviews
        const [totalReviewsResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(reviews)
            .where(sql`${reviews.productId} IN ${productIds}`);

        const totalReviews = totalReviewsResult?.count || 0;

        if (totalReviews === 0) {
            return {
                success: true,
                analytics: {
                    totalReviews: 0,
                    averageRating: 0,
                    responseRate: 0,
                    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                    recentReviews: 0,
                },
            };
        }

        // Average rating
        const [avgRatingResult] = await db
            .select({ avg: sql<number>`AVG(${reviews.rating})` })
            .from(reviews)
            .where(sql`${reviews.productId} IN ${productIds}`);

        const averageRating = Number(avgRatingResult?.avg || 0);

        // Response rate
        const [responsesResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(vendorReviewResponses)
            .where(eq(vendorReviewResponses.vendorId, vendorId));

        const responseRate = totalReviews > 0
            ? ((responsesResult?.count || 0) / totalReviews) * 100
            : 0;

        // Rating distribution
        const distribution = await db
            .select({
                rating: reviews.rating,
                count: sql<number>`count(*)`,
            })
            .from(reviews)
            .where(sql`${reviews.productId} IN ${productIds}`)
            .groupBy(reviews.rating);

        const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        distribution.forEach(d => {
            if (d.rating >= 1 && d.rating <= 5) {
                ratingDistribution[d.rating] = d.count;
            }
        });

        // Recent reviews (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [recentResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(reviews)
            .where(
                and(
                    sql`${reviews.productId} IN ${productIds}`,
                    sql`${reviews.createdAt} >= ${thirtyDaysAgo.toISOString()}`
                )
            );

        return {
            success: true,
            analytics: {
                totalReviews,
                averageRating: Math.round(averageRating * 10) / 10,
                responseRate: Math.round(responseRate * 10) / 10,
                ratingDistribution,
                recentReviews: recentResult?.count || 0,
            },
        };
    } catch (error) {
        console.error("Error fetching review analytics:", error);
        return {
            success: false,
            error: "Failed to fetch analytics",
        };
    }
}

/**
 * Sends notification to user when vendor responds to their review
 */
async function notifyUserOfVendorResponse(review: any, responseText: string) {
    try {
        // Get user email
        const [user] = await db
            .select({ email: users.email, name: users.name })
            .from(users)
            .where(eq(users.id, review.userId))
            .limit(1);

        if (!user?.email) return;

        // Get product and vendor info
        const [productData] = await db
            .select({
                productName: products.name,
                vendorName: vendors.businessName,
            })
            .from(products)
            .leftJoin(vendors, eq(products.vendorId, vendors.id))
            .where(eq(products.id, review.productId))
            .limit(1);

        if (!productData) return;

        const subject = `El vendedor respondió a tu reseña - ${productData.productName}`;

        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">💬 Respuesta a tu reseña</h2>
        
        <p>Hola ${user.name || ""},</p>
        
        <p>${productData.vendorName} ha respondido a tu reseña del producto <strong>${productData.productName}</strong>.</p>
        
        <div style="background-color: #f9fafb; border-left: 4px solid #059669; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #4b5563;"><strong>Tu reseña:</strong></p>
          <p style="margin: 8px 0 0 0; font-style: italic;">${review.comment || review.title}</p>
        </div>
        
        <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #065f46;"><strong>Respuesta del vendedor:</strong></p>
          <p style="margin: 8px 0 0 0;">${responseText}</p>
        </div>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/products/${productData.productName}" 
           style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Ver Producto y Reseñas
        </a>
        
        <p style="color: #666; font-size: 12px; margin-top: 32px;">
          Gracias por compartir tu opinión con la comunidad de Luzimarket.
        </p>
      </div>
    `;

        await sendEmail({
            to: user.email,
            subject,
            html,
        });
    } catch (error) {
        console.error("Error sending review response notification:", error);
        // Don't throw - email failure shouldn't block the response creation
    }
}

/**
 * Gets reviews that need vendor attention (no response yet)
 */
export async function getUnrespondedReviews(vendorId: string) {
    try {
        // Get vendor's products
        const vendorProducts = await db
            .select({ id: products.id })
            .from(products)
            .where(eq(products.vendorId, vendorId));

        const productIds = vendorProducts.map(p => p.id);

        if (productIds.length === 0) {
            return { success: true, reviews: [] };
        }

        // Get reviews without vendor responses
        const unrespondedReviews = await db
            .select({
                review: reviews,
                user: users,
                product: products,
            })
            .from(reviews)
            .leftJoin(users, eq(reviews.userId, users.id))
            .leftJoin(products, eq(reviews.productId, products.id))
            .leftJoin(vendorReviewResponses, eq(reviews.id, vendorReviewResponses.reviewId))
            .where(
                and(
                    sql`${reviews.productId} IN ${productIds}`,
                    sql`${vendorReviewResponses.id} IS NULL`
                )
            )
            .orderBy(desc(reviews.createdAt));

        return {
            success: true,
            reviews: unrespondedReviews,
        };
    } catch (error) {
        console.error("Error fetching unresponded reviews:", error);
        return {
            success: false,
            error: "Failed to fetch unresponded reviews",
            reviews: [],
        };
    }
}

/**
 * Gets review statistics by rating
 */
export async function getReviewStatsByRating(vendorId: string) {
    try {
        const vendorProducts = await db
            .select({ id: products.id })
            .from(products)
            .where(eq(products.vendorId, vendorId));

        const productIds = vendorProducts.map(p => p.id);

        if (productIds.length === 0) {
            return {
                success: true,
                stats: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            };
        }

        const distribution = await db
            .select({
                rating: reviews.rating,
                count: sql<number>`count(*)`,
            })
            .from(reviews)
            .where(sql`${reviews.productId} IN ${productIds}`)
            .groupBy(reviews.rating);

        const stats: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        distribution.forEach(d => {
            if (d.rating >= 1 && d.rating <= 5) {
                stats[d.rating] = d.count;
            }
        });

        return {
            success: true,
            stats,
        };
    } catch (error) {
        console.error("Error fetching review stats:", error);
        return {
            success: false,
            error: "Failed to fetch review stats",
            stats: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
    }
}

