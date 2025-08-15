"use server";

import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { eq, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Category schemas
const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean(),
  displayOrder: z.number().int().min(0),
});

// Category actions
export async function createCategory(data: z.infer<typeof categorySchema>) {
  try {
    const validated = categorySchema.parse(data);

    // Check if slug already exists
    const existing = await db.query.categories.findFirst({
      where: eq(categories.slug, validated.slug),
    });

    if (existing) {
      return { success: false, error: "A category with this slug already exists" };
    }

    await db.insert(categories).values(validated);

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    console.error("Error creating category:", error);
    return { success: false, error: "Failed to create category" };
  }
}

export async function updateCategory(id: number, data: z.infer<typeof categorySchema>) {
  try {
    const validated = categorySchema.parse(data);

    // Check if slug already exists (excluding current category)
    const existing = await db.query.categories.findFirst({
      where: sql`${categories.slug} = ${validated.slug} AND ${categories.id} != ${id}`,
    });

    if (existing) {
      return { success: false, error: "A category with this slug already exists" };
    }

    await db.update(categories)
      .set(validated)
      .where(eq(categories.id, id));

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    console.error("Error updating category:", error);
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteCategory(id: number) {
  try {
    // Check if category has products
    const productCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.categoryId, id));

    if (productCount[0]?.count > 0) {
      return {
        success: false,
        error: "Cannot delete category with products. Please reassign or delete products first."
      };
    }

    await db.delete(categories).where(eq(categories.id, id));

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false, error: "Failed to delete category" };
  }
}

// Product actions
export async function toggleProductStatus(productId: string, currentStatus: boolean) {
  try {
    const result = await db
      .update(products)
      .set({ isActive: !currentStatus })
      .where(eq(products.id, productId))
      .returning();

    if (result.length === 0) {
      throw new Error("Product not found");
    }

    // Revalidate all possible paths
    revalidatePath("/admin/products");
    revalidatePath("/es/admin/products");
    revalidatePath("/en/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath(`/es/admin/products/${productId}`);
    revalidatePath(`/en/admin/products/${productId}`);

    return { success: true };
  } catch (error) {
    console.error("Error toggling product status:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function bulkUpdateProductStatus(
  productIds: string[],
  action: 'approve' | 'reject' | 'delete'
) {
  try {
    if (!productIds || productIds.length === 0) {
      return { success: false, error: "No products selected" };
    }

    let updateData: any = {};
    let message = "";

    switch (action) {
      case 'approve':
        updateData = { isActive: true };
        message = `Successfully approved ${productIds.length} product(s)`;
        break;
      case 'reject':
        updateData = { isActive: false };
        message = `Successfully rejected ${productIds.length} product(s)`;
        break;
      case 'delete':
        // For delete action, we'll use a delete query instead
        await db.delete(products).where(inArray(products.id, productIds));

        // Revalidate paths
        revalidatePath("/admin/products");
        revalidatePath("/es/admin/products");
        revalidatePath("/en/admin/products");

        return {
          success: true,
          message: `Successfully deleted ${productIds.length} product(s)`
        };
      default:
        return { success: false, error: "Invalid action" };
    }

    // For approve/reject actions, update the products
    // if (action !== 'delete') { // This check is unnecessary since delete returns early
    await db
      .update(products)
      .set(updateData)
      .where(inArray(products.id, productIds));
    // }

    // Revalidate paths
    revalidatePath("/admin/products");
    revalidatePath("/es/admin/products");
    revalidatePath("/en/admin/products");

    return { success: true, message };
  } catch (error) {
    console.error("Error bulk updating products:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update products"
    };
  }
}