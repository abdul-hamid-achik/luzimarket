import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { reviews, orders, orderItems } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";

const createReviewSchema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().min(10, "La opinión debe tener al menos 10 caracteres"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para dejar una opinión" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = createReviewSchema.parse(body);

    // Check if user has already reviewed this product
    const existingReview = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.productId, validatedData.productId),
        eq(reviews.userId, session.user.id)
      ),
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "Ya has dejado una opinión para este producto" },
        { status: 400 }
      );
    }

    // Check if user has purchased this product
    const userOrder = await db
      .select({ orderId: orders.id })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(
        and(
          eq(orders.userId, session.user.id),
          eq(orderItems.productId, validatedData.productId),
          eq(orders.status, "delivered")
        )
      )
      .limit(1);

    const isVerifiedPurchase = userOrder.length > 0;

    // Create the review
    const [newReview] = await db.insert(reviews).values({
      id: nanoid(),
      productId: validatedData.productId,
      userId: session.user.id,
      rating: validatedData.rating,
      title: validatedData.title || null,
      comment: validatedData.comment,
      isVerifiedPurchase,
      orderId: userOrder[0]?.orderId || null,
    }).returning();

    return NextResponse.json(newReview);
  } catch (error) {
    console.error("Error creating review:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear la opinión" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Get reviews with user info
    const productReviews = await db.query.reviews.findMany({
      where: eq(reviews.productId, productId),
      with: {
        user: {
          columns: {
            name: true,
          },
        },
      },
      orderBy: (reviews, { desc }) => desc(reviews.createdAt),
    });

    // Calculate rating distribution
    const ratingCounts = await db
      .select({
        rating: reviews.rating,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(reviews)
      .where(eq(reviews.productId, productId))
      .groupBy(reviews.rating);

    const totalReviews = productReviews.length;
    const averageRating = totalReviews > 0
      ? productReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
      const count = ratingCounts.find(rc => rc.rating === rating)?.count || 0;
      return {
        rating,
        count,
        percentage: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0,
      };
    });

    return NextResponse.json({
      reviews: productReviews,
      averageRating,
      totalReviews,
      ratingDistribution,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Error al obtener las opiniones" },
      { status: 500 }
    );
  }
}