export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { changePassword } from "@/lib/services/user-service";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Change password using UserService
    const result = await changePassword(
      session.user.id,
      session.user.role as any,
      session.user.email!,
      body.currentPassword,
      body.newPassword,
      body.confirmPassword
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

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