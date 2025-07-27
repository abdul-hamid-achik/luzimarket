"use server";


import { db } from "@/db";
import { products, categories, vendors } from "@/db/schema";
import { eq, and, gte, lte, inArray, sql, desc, asc } from "drizzle-orm";

export interface ProductFilters {
  categoryIds?: string[];
  vendorIds?: string[];
  productIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  sortBy?: "price-asc" | "price-desc" | "name" | "newest";
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
      sortBy = "newest",
      page = 1,
      limit = 12,
    } = filters;

    // Build where conditions
    const conditions = [];
    
    // Only show active products (temporarily allow non-approved images for development)
    conditions.push(eq(products.isActive, true));
    // TODO: Re-enable after fixing image approval workflow
    // conditions.push(eq(products.imagesApproved, true));
    
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
      case "newest":
      default:
        orderBy = desc(products.createdAt);
        break;
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Query products with joins
    const result = await db
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

    // Count total products for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

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

export async function getProductFilterOptions() {
  try {
    // Get all active categories with product counts
    const categoriesWithCounts = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        count: sql<number>`count(${products.id})`,
      })
      .from(categories)
      .leftJoin(products, and(
        eq(products.categoryId, categories.id),
        eq(products.isActive, true)
      ))
      .where(eq(categories.isActive, true))
      .groupBy(categories.id)
      .orderBy(categories.displayOrder);

    // Get all vendors with product counts
    const vendorsWithCounts = await db
      .select({
        id: vendors.id,
        name: vendors.businessName,
        count: sql<number>`count(${products.id})`,
      })
      .from(vendors)
      .leftJoin(products, and(
        eq(products.vendorId, vendors.id),
        eq(products.isActive, true)
      ))
      .where(eq(vendors.isActive, true))
      .groupBy(vendors.id)
      .orderBy(vendors.businessName);

    // Get price range
    const priceRange = await db
      .select({
        min: sql<number>`min(cast(${products.price} as decimal))`,
        max: sql<number>`max(cast(${products.price} as decimal))`,
      })
      .from(products)
      .where(eq(products.isActive, true));

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