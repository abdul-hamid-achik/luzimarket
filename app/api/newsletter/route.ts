import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Check if email already exists
    const existing = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.email, email))
      .limit(1);

    if (existing.length > 0) {
      // If already subscribed but inactive, reactivate
      if (!existing[0].isActive) {
        await db
          .update(subscriptions)
          .set({ isActive: true })
          .where(eq(subscriptions.email, email));
      }
      
      return NextResponse.json({ message: "Already subscribed" });
    }

    // Insert new subscription
    await db.insert(subscriptions).values({
      email,
      isActive: true,
    });

    // In production, send welcome email
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send welcome email using Resend
    }

    return NextResponse.json({ message: "Successfully subscribed" });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}