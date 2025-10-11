import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProduct, updateProduct, deleteProduct } from "@/lib/services/product-service";
import { z } from "zod";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session || session.user.role !== "vendor" || !session.user.vendor?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Get product using ProductService
    const result = await getProduct(id);

    if (!result.success || !result.product) {
      return NextResponse.json(
        { error: result.error || "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (result.product.vendorId !== session.user.vendor.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    return NextResponse.json(result.product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Error al obtener el producto" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session || session.user.role !== "vendor" || !session.user.vendor?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Update product using ProductService
    const result = await updateProduct(
      id,
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

    return NextResponse.json(result.product);
  } catch (error) {
    console.error("Error updating product:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar el producto" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session || session.user.role !== "vendor" || !session.user.vendor?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Delete product using ProductService
    const result = await deleteProduct(
      id,
      session.user.vendor.id,
      session.user.email!
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Error al eliminar el producto" },
      { status: 500 }
    );
  }
}