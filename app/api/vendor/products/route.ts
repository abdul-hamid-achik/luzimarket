export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createProduct, getVendorProducts } from "@/lib/services/product-service";
import { z } from "zod";

export async function POST(req: NextRequest) {
  // Comprehensive error boundary
  try {
    const session = await auth();

    if (!session || session.user.role !== "vendor" || !session.user.vendor?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Create product using ProductService
    const result = await createProduct(
      session.user.vendor.id,
      session.user.email!,
      body
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.product, { status: 201 });
  } catch (error) {
    // Log error for debugging
    console.error("[API /vendor/products POST] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    // Always return JSON, never let Next.js render error page
    return NextResponse.json(
      {
        error: "Error al crear el producto",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "vendor" || !session.user.vendor?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Get vendor products using ProductService
    const result = await getVendorProducts(session.user.vendor.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 }
    );
  }
}