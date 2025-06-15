import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In a real app, you'd want to track which users have marked reviews as helpful
    // to prevent multiple votes. For now, we'll just increment the count.
    
    await db
      .update(reviews)
      .set({
        helpfulCount: sql`${reviews.helpfulCount} + 1`,
      })
      .where(eq(reviews.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking review as helpful:", error);
    return NextResponse.json(
      { error: "Error al marcar la opinión como útil" },
      { status: 500 }
    );
  }
}