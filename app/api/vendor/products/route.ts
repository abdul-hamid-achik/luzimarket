import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { products, categories } from "@/db/schema";
import { z } from "zod";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { createImageModerationRecords } from "@/lib/actions/image-moderation";
import { logProductEvent } from "@/lib/audit-helpers";

const createProductSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  categoryId: z.number().int(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string()).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "vendor" || !session.user.vendor?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = createProductSchema.parse(body);

    // Validate that the category exists
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, validatedData.categoryId))
      .limit(1);

    if (!category) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 400 }
      );
    }

    // Generate a slug from the name
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
      "-" + nanoid(6);

    // Create the product
    const [newProduct] = await db.insert(products).values({
      vendorId: session.user.vendor.id,
      name: validatedData.name,
      slug,
      description: validatedData.description,
      price: validatedData.price.toString(),
      stock: validatedData.stock,
      categoryId: validatedData.categoryId,
      images: validatedData.images,
      tags: validatedData.tags || [],
      isActive: true,
      imagesPendingModeration: validatedData.images.length > 0,
      imagesApproved: false,
    }).returning();

    // Create image moderation records if there are images
    if (validatedData.images.length > 0) {
      await createImageModerationRecords(
        newProduct.id,
        session.user.vendor.id,
        validatedData.images
      );
    }

    // Log product creation
    await logProductEvent({
      action: 'created',
      productId: newProduct.id,
      productName: newProduct.name,
      vendorId: session.user.vendor.id,
      userId: session.user.id,
      userEmail: session.user.email!,
      userType: 'vendor',
      details: {
        slug: newProduct.slug,
        categoryId: newProduct.categoryId,
        price: newProduct.price,
        stock: newProduct.stock,
        imageCount: validatedData.images.length,
        pendingModeration: newProduct.imagesPendingModeration,
      },
    });

    return NextResponse.json(newProduct);
  } catch (error) {
    console.error("Error creating product:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear el producto" },
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

    const vendorProducts = await db.query.products.findMany({
      where: (products, { eq }) => eq(products.vendorId, session.user.vendor!.id),
      with: {
        category: true,
      },
      orderBy: (products, { desc }) => desc(products.createdAt),
    });

    return NextResponse.json(vendorProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 }
    );
  }
}