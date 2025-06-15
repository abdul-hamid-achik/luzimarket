import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { products } from "@/db/schema";
import { z } from "zod";
import { nanoid } from "nanoid";

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
    
    if (!session || session.user.role !== "vendor") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = createProductSchema.parse(body);

    // Generate a slug from the name
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + 
      "-" + nanoid(6);

    // Create the product
    const [newProduct] = await db.insert(products).values({
      id: nanoid(),
      vendorId: session.user.id,
      name: validatedData.name,
      slug,
      description: validatedData.description,
      price: validatedData.price.toString(),
      stock: validatedData.stock,
      categoryId: validatedData.categoryId,
      images: validatedData.images,
      tags: validatedData.tags || [],
      isActive: true,
    }).returning();

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
    
    if (!session || session.user.role !== "vendor") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const vendorProducts = await db.query.products.findMany({
      where: (products, { eq }) => eq(products.vendorId, session.user.id),
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