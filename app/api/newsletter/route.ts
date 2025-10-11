import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const newsletterSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Validate email
    const validation = newsletterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid email address", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    try {
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
    } catch (dbError: any) {
      console.error("Database error in newsletter:", dbError);
      // If database error, likely a constraint or connection issue
      // Return 400 for client errors (like duplicate email constraint)
      if (dbError.code === '23505') { // Postgres unique violation
        return NextResponse.json(
          { error: "Email already subscribed" },
          { status: 400 }
        );
      }
      throw dbError; // Re-throw for outer catch
    }
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}