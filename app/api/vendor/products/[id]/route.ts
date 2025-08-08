import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { createImageModerationRecords } from "@/lib/actions/image-moderation";

const updateProductSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  categoryId: z.number().int(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string()).min(1),
  isActive: z.boolean(),
});

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

    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, id),
        eq(products.vendorId, session.user.vendor.id)
      ),
      with: {
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
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
    const validatedData = updateProductSchema.parse(body);

    // Verify the product belongs to the vendor
    const existingProduct = await db.query.products.findFirst({
      where: and(
        eq(products.id, id),
        eq(products.vendorId, session.user.vendor!.id)
      ),
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Check if images have changed
    const imagesChanged = JSON.stringify(existingProduct.images) !== JSON.stringify(validatedData.images);

    // Update the product
    const [updatedProduct] = await db
      .update(products)
      .set({
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price.toString(),
        stock: validatedData.stock,
        categoryId: validatedData.categoryId,
        images: validatedData.images,
        tags: validatedData.tags || [],
        isActive: validatedData.isActive,
        updatedAt: new Date(),
        // If images changed, reset approval status
        ...(imagesChanged && {
          imagesPendingModeration: validatedData.images.length > 0,
          imagesApproved: false,
        }),
      })
      .where(
        and(
          eq(products.id, id),
          eq(products.vendorId, session.user.vendor.id)
        )
      )
      .returning();

    // If images changed, create new moderation records
    if (imagesChanged && validatedData.images.length > 0) {
      await createImageModerationRecords(
        id,
        session.user.vendor.id,
        validatedData.images
      );
    }

    return NextResponse.json(updatedProduct);
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

    // Verify the product belongs to the vendor
    const existingProduct = await db.query.products.findFirst({
      where: and(
        eq(products.id, id),
        eq(products.vendorId, session.user.vendor!.id)
      ),
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Delete the product
    await db
      .delete(products)
      .where(
        and(
          eq(products.id, id),
          eq(products.vendorId, session.user.vendor.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Error al eliminar el producto" },
      { status: 500 }
    );
  }
}