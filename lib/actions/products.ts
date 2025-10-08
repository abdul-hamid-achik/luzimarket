"use server";


import { db } from "@/db";
import { products, categories, vendors, reviews } from "@/db/schema";
import { eq, and, gte, lte, inArray, sql, desc, asc, or, avg } from "drizzle-orm";

export interface ProductFilters {
  categoryIds?: string[];
  vendorIds?: string[];
  productIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  minRating?: number;
  availability?: "in-stock" | "out-of-stock" | "low-stock";
  sortBy?: "price-asc" | "price-desc" | "name" | "newest" | "rating" | "popularity";
  page?: number;
  limit?: number;
}

export interface ProductWithRelations {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  images: string[];
  tags: string[];
  stock: number;
  isActive: boolean;
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
  vendor: {
    id: string;
    businessName: string;
  } | null;
}

export async function getFilteredProducts(filters: ProductFilters = {}) {
  try {
    const {
      categoryIds = [],
      vendorIds = [],
      productIds = [],
      minPrice,
      maxPrice,
      tags = [],
      minRating,
      availability,
      sortBy = "newest",
      page = 1,
      limit = Math.min(filters.limit || 12, 50), // Cap limit to prevent excessive data transfer
    } = filters;

    // Build where conditions
    const conditions = [];

    // Only show active products with approved images
    conditions.push(eq(products.isActive, true));

    // Re-enabled: Only show products with approved images in production
    // In development/testing, you can set imagesApproved=true via db:studio
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_IMAGE_APPROVAL === 'true') {
      conditions.push(eq(products.imagesApproved, true));
    }

    if (productIds.length > 0) {
      conditions.push(inArray(products.id, productIds));
    }

    if (categoryIds.length > 0) {
      conditions.push(inArray(products.categoryId, categoryIds.map(id => parseInt(id))));
    }

    if (vendorIds.length > 0) {
      conditions.push(inArray(products.vendorId, vendorIds));
    }

    if (minPrice !== undefined) {
      conditions.push(gte(products.price, minPrice.toString()));
    }

    if (maxPrice !== undefined) {
      conditions.push(lte(products.price, maxPrice.toString()));
    }

    if (tags.length > 0) {
      // Match any of the provided tags in the product tags JSON array
      // Uses Postgres jsonb key existence operator (?) per tag and combines with OR
      const tagConds = tags.map((tag) => sql`(${products.tags}::jsonb) ? ${tag}`);
      conditions.push(or(...tagConds));
    }

    // Availability filter
    if (availability) {
      switch (availability) {
        case "in-stock":
          conditions.push(gte(products.stock, 1));
          break;
        case "out-of-stock":
          conditions.push(eq(products.stock, 0));
          break;
        case "low-stock":
          conditions.push(and(gte(products.stock, 1), lte(products.stock, 5)));
          break;
      }
    }

    // Build order by
    let orderBy;
    switch (sortBy) {
      case "price-asc":
        orderBy = asc(products.price);
        break;
      case "price-desc":
        orderBy = desc(products.price);
        break;
      case "name":
        orderBy = asc(products.name);
        break;
      case "rating":
        // For now, order by creation date (can be enhanced later with rating calculation)
        orderBy = desc(products.createdAt);
        break;
      case "popularity":
        // For now, order by creation date (can be enhanced later with popularity metrics)
        orderBy = desc(products.createdAt);
        break;
      case "newest":
      default:
        orderBy = desc(products.createdAt);
        break;
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // For rating filter, we need to modify the query to include rating calculations
    let baseQuery, countQuery;

    if (minRating) {
      // Query with rating calculation when rating filter is applied
      baseQuery = db
        .select({
          product: products,
          category: categories,
          vendor: vendors,
          avgRating: sql<number>`coalesce(avg(${reviews.rating}), 0)`,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(vendors, eq(products.vendorId, vendors.id))
        .leftJoin(reviews, eq(products.id, reviews.productId))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(products.id, categories.id, vendors.id)
        .having(sql`coalesce(avg(${reviews.rating}), 0) >= ${minRating}`)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(
          db
            .select({ id: products.id })
            .from(products)
            .leftJoin(reviews, eq(products.id, reviews.productId))
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .groupBy(products.id)
            .having(sql`coalesce(avg(${reviews.rating}), 0) >= ${minRating}`)
            .as("filtered_products")
        );
    } else {
      // Standard query without rating calculations
      baseQuery = db
        .select({
          product: products,
          category: categories,
          vendor: vendors,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(vendors, eq(products.vendorId, vendors.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
    }

    // Execute queries in parallel
    const [result, countResult] = await Promise.all([
      baseQuery,
      countQuery
    ]);

    const totalCount = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / limit);

    // Format the results
    const formattedProducts: ProductWithRelations[] = result.map(({ product, category, vendor }) => ({
      ...product,
      images: product.images || [],
      tags: product.tags || [],
      stock: product.stock || 0,
      isActive: product.isActive ?? true,
      category: category ? {
        id: category.id,
        name: category.name,
        slug: category.slug,
      } : null,
      vendor: vendor ? {
        id: vendor.id,
        businessName: vendor.businessName,
      } : null,
    }));

    return {
      products: formattedProducts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  } catch (error) {
    console.error("Error fetching filtered products:", error);
    throw new Error("Failed to fetch products");
  }
}

export async function getProductFilterOptions(baseFilters: ProductFilters = {}) {
  try {
    const {
      categoryIds = [],
      vendorIds = [],
      productIds = [],
      minPrice,
      maxPrice,
      tags = [],
    } = baseFilters;

    // Helper: build conditions applied to products for facet queries
    const buildProductConditions = (opts: {
      includeCategoryFilter?: boolean;
      includeVendorFilter?: boolean;
    }) => {
      const conds: any[] = [eq(products.isActive, true)];
      if (productIds.length > 0) conds.push(inArray(products.id, productIds));
      if (opts.includeCategoryFilter && categoryIds.length > 0) {
        conds.push(inArray(products.categoryId, categoryIds.map((id) => parseInt(id))));
      }
      if (opts.includeVendorFilter && vendorIds.length > 0) {
        conds.push(inArray(products.vendorId, vendorIds));
      }
      if (minPrice !== undefined) conds.push(gte(products.price, minPrice.toString()));
      if (maxPrice !== undefined) conds.push(lte(products.price, maxPrice.toString()));
      // Note: tag-based faceting omitted in counts for simplicity
      return conds;
    };

    // Execute all filter option queries in parallel for better performance
    const [categoriesWithCounts, vendorsWithCounts, priceRange] = await Promise.all([
      // Get all active categories with product counts
      db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          count: sql<number>`count(${products.id})`,
        })
        .from(categories)
        .leftJoin(
          products,
          and(
            eq(products.categoryId, categories.id),
            ...buildProductConditions({ includeCategoryFilter: false, includeVendorFilter: true })
          )
        )
        .where(eq(categories.isActive, true))
        .groupBy(categories.id)
        .orderBy(categories.displayOrder),

      // Get all vendors with product counts
      db
        .select({
          id: vendors.id,
          name: vendors.businessName,
          count: sql<number>`count(${products.id})`,
        })
        .from(vendors)
        .leftJoin(
          products,
          and(
            eq(products.vendorId, vendors.id),
            ...buildProductConditions({ includeCategoryFilter: true, includeVendorFilter: false })
          )
        )
        .where(eq(vendors.isActive, true))
        .groupBy(vendors.id)
        .orderBy(vendors.businessName)
        .limit(100), // Limit vendors to prevent excessive results

      // Get price range
      db
        .select({
          min: sql<number>`min(cast(${products.price} as decimal))`,
          max: sql<number>`max(cast(${products.price} as decimal))`,
        })
        .from(products)
        .where(and(...buildProductConditions({ includeCategoryFilter: true, includeVendorFilter: true })))
    ]);

    // Get all unique tags
    const allProducts = await db
      .select({ tags: products.tags })
      .from(products)
      .where(eq(products.isActive, true));

    const uniqueTags = Array.from(
      new Set(allProducts.flatMap(p => p.tags))
    ).sort();

    return {
      categories: categoriesWithCounts.filter(c => Number(c.count) > 0),
      vendors: vendorsWithCounts.filter(v => Number(v.count) > 0),
      priceRange: {
        min: Number(priceRange[0]?.min || 0),
        max: Number(priceRange[0]?.max || 0),
      },
      tags: uniqueTags,
    };
  } catch (error) {
    console.error("Error fetching filter options:", error);
    throw new Error("Failed to fetch filter options");
  }
}

export async function getVendorProductById(productId: string) {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session || session.user.role !== "vendor" || !session.user.vendor?.id) {
    throw new Error("Unauthorized");
  }

  const product = await db.query.products.findFirst({
    where: and(
      eq(products.id, productId),
      eq(products.vendorId, session.user.vendor.id)
    ),
    with: {
      category: true,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
}

export async function updateVendorProduct(
  productId: string,
  data: {
    name: string;
    description: string;
    price: number;
    stock: number;
    categoryId: number;
    tags: string[];
    images: string[];
    isActive: boolean;
  }
) {
  const { auth } = await import("@/lib/auth");
  const { createImageModerationRecords } = await import("@/lib/actions/image-moderation");
  const session = await auth();
  if (!session || session.user.role !== "vendor" || !session.user.vendor?.id) {
    throw new Error("Unauthorized");
  }

  const existing = await db.query.products.findFirst({
    where: and(
      eq(products.id, productId),
      eq(products.vendorId, session.user.vendor.id)
    ),
  });
  if (!existing) {
    throw new Error("Product not found");
  }

  const imagesChanged = JSON.stringify(existing.images) !== JSON.stringify(data.images);

  const [updatedProduct] = await db
    .update(products)
    .set({
      name: data.name,
      description: data.description,
      price: data.price.toString(),
      stock: data.stock,
      categoryId: data.categoryId,
      images: data.images,
      tags: data.tags || [],
      isActive: data.isActive,
      updatedAt: new Date(),
      ...(imagesChanged && {
        imagesPendingModeration: data.images.length > 0,
        imagesApproved: false,
      }),
    })
    .where(and(eq(products.id, productId), eq(products.vendorId, session.user.vendor.id)))
    .returning();

  if (imagesChanged && data.images.length > 0) {
    await createImageModerationRecords(productId, session.user.vendor.id, data.images);
  }

  return updatedProduct;
}

export async function deleteVendorProduct(productId: string) {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session || session.user.role !== "vendor" || !session.user.vendor?.id) {
    throw new Error("Unauthorized");
  }

  const existing = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.vendorId, session.user.vendor.id)),
  });
  if (!existing) {
    throw new Error("Product not found");
  }

  await db.delete(products).where(and(eq(products.id, productId), eq(products.vendorId, session.user.vendor.id)));
  return { success: true };
}

export async function createVendorProduct(data: {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: number;
  tags: string[];
  images: string[];
}) {
  const { auth } = await import("@/lib/auth");
  const { createImageModerationRecords } = await import("@/lib/actions/image-moderation");
  const session = await auth();
  if (!session || session.user.role !== "vendor" || !session.user.vendor?.id) {
    throw new Error("Unauthorized");
  }

  // Ensure category exists to avoid FK violations and provide a clear error
  const existingCategory = await db.query.categories.findFirst({
    where: eq(categories.id, data.categoryId),
  });
  if (!existingCategory) {
    throw new Error("Category not found");
  }

  // Basic slugging: name + random suffix
  const { customAlphabet } = await import("nanoid");
  const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 6);
  const slug = `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${nanoid()}`;

  const [product] = await db
    .insert(products)
    .values({
      vendorId: session.user.vendor.id,
      name: data.name,
      slug,
      description: data.description,
      price: data.price.toString(),
      stock: data.stock,
      categoryId: data.categoryId,
      images: data.images,
      tags: data.tags || [],
      isActive: true,
      imagesPendingModeration: data.images.length > 0,
      imagesApproved: false,
    })
    .returning();

  if (data.images.length > 0) {
    await createImageModerationRecords(product.id, session.user.vendor.id, data.images);
  }

  return product;
}