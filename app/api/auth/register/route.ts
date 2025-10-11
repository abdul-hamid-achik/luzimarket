export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { registerUser } from "@/lib/services/auth-service";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Register user using AuthService
    const result = await registerUser(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      user: result.user,
      message: result.message,
      guestOrdersConverted: result.guestOrdersConverted || 0,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Error al crear la cuenta" },
      { status: 500 }
    );
  }
}