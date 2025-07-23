import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, categories, vendors } from "@/db/schema";
import { ilike, or, and, eq, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  
  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Search products
    const productResults = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        price: products.price,
        image: sql<string>`${products.images}->0`,
        type: sql<string>`'product'`,
      })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          or(
            ilike(products.name, `%${query}%`),
            ilike(products.description, `%${query}%`)
          )
        )
      )
      .limit(5);

    // Search categories
    const categoryResults = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        type: sql<string>`'category'`,
      })
      .from(categories)
      .where(
        and(
          eq(categories.isActive, true),
          ilike(categories.name, `%${query}%`)
        )
      )
      .limit(3);

    // Search vendors
    const vendorResults = await db
      .select({
        id: vendors.id,
        name: vendors.businessName,
        slug: vendors.slug,
        type: sql<string>`'vendor'`,
      })
      .from(vendors)
      .where(
        and(
          eq(vendors.isActive, true),
          ilike(vendors.businessName, `%${query}%`)
        )
      )
      .limit(3);

    const results = [
      ...productResults,
      ...categoryResults,
      ...vendorResults,
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search" },
      { status: 500 }
    );
  }
}