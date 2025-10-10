export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, vendors, adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { logPasswordEvent } from "@/lib/audit-helpers";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = changePasswordSchema.parse(body);

    // Get the user based on their role
    let userRecord;
    let table;

    switch (session.user.role) {
      case "customer":
        table = users;
        [userRecord] = await db
          .select()
          .from(users)
          .where(eq(users.id, session.user.id))
          .limit(1);
        break;
      case "vendor":
        table = vendors;
        [userRecord] = await db
          .select()
          .from(vendors)
          .where(eq(vendors.id, session.user.id))
          .limit(1);
        break;
      case "admin":
        table = adminUsers;
        [userRecord] = await db
          .select()
          .from(adminUsers)
          .where(eq(adminUsers.id, session.user.id))
          .limit(1);
        break;
      default:
        return NextResponse.json({ error: "Invalid user role" }, { status: 400 });
    }

    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has a password set
    if (!userRecord.passwordHash) {
      return NextResponse.json({ error: "No password set for this account" }, { status: 400 });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      validatedData.currentPassword,
      userRecord.passwordHash
    );

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 12);

    // Update password
    await db
      .update(table)
      .set({
        passwordHash: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(table.id, session.user.id));

    // Log password change event
    await logPasswordEvent({
      action: 'password_changed',
      userId: session.user.id,
      userEmail: session.user.email!,
      userType: session.user.role,
      details: {
        changedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}