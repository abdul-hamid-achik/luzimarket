export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { verifyEmail } from "@/lib/services/auth-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/login?error=invalid-token", request.url)
      );
    }

    // Verify email using AuthService
    const result = await verifyEmail(token);

    if (!result.success) {
      return NextResponse.redirect(
        new URL("/login?error=expired-token", request.url)
      );
    }

    // Redirect to login with success message
    return NextResponse.redirect(
      new URL("/login?verified=true", request.url)
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(
      new URL("/login?error=verification-failed", request.url)
    );
  }
}