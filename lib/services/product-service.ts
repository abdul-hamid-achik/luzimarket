"use server";

import { db } from "@/db";
import { products, categories } from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createProductSchema, updateProductSchema } from "@/lib/services/validation-service";
import { createImageModerationRecords } from "@/lib/actions/image-moderation";
import { logProductEvent } from "@/lib/audit-helpers";
import {
    getFilteredProducts,
    type ProductWithRelations as ProductWithRelationsType,
    type ProductFilters as ProductFiltersType,
} from "@/lib/actions/products";

// Re-export types
export type ProductWithRelations = ProductWithRelationsType;
export type ProductFilters = ProductFiltersType;

/**
 * ProductService
 * Centralized service for product operations
 * Consolidates product CRUD from routes and actions
 */

// ============================================================================
// RE-EXPORT QUERY FUNCTIONS FROM ACTIONS
// ============================================================================

export {
    getFilteredProducts,
};

// ============================================================================
// PRODUCT CRUD OPERATIONS
// ============================================================================

/**
 * Create a new product
 */
export async function createProduct(
    vendorId: string,
    userEmail: string,
    data: unknown
): Promise<{
    success: boolean;
    product?: any;
    error?: string;
}> {
    try {
        // Validate data with Zod - safeParse to avoid throwing
        const validation = createProductSchema.safeParse(data);
        if (!validation.success) {
            const errorMsg = validation.error.errors[0]?.message || "Datos inválidos";
            console.log("Product validation failed:", errorMsg);
            return {
                success: false,
                error: errorMsg,
            };
        }

        const validatedData = validation.data;

        // Validate that the category exists
        const [category] = await db
            .select()
            .from(categories)
            .where(eq(categories.id, validatedData.categoryId))
            .limit(1);

        if (!category) {
            return {
                success: false,
                error: "Categoría no encontrada",
            };
        }

        // Generate a slug from the name
        const slug = generateSlug(validatedData.name);

        // Create the product
        const [newProduct] = await db.insert(products).values({
            vendorId,
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

        // Create image moderation records if there are images (non-blocking)
        if (validatedData.images.length > 0) {
            try {
                await createImageModerationRecords(
                    newProduct.id,
                    vendorId,
                    validatedData.images
                );
            } catch (moderationError) {
                console.error("Failed to create image moderation records:", moderationError);
                // Don't fail product creation if moderation records fail
            }
        }

        // Log product creation (non-blocking)
        try {
            await logProductEvent({
                action: 'created',
                productId: newProduct.id,
                productName: newProduct.name,
                vendorId,
                userId: vendorId,
                userEmail,
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
        } catch (logError) {
            console.error("Failed to log product creation:", logError);
            // Don't fail product creation if logging fails
        }

        return { success: true, product: newProduct };
    } catch (error: any) {
        console.error("Error creating product (service):", error);
        console.error("Error stack (service):", error.stack);
        return {
            success: false,
            error: error.message || "Error al crear el producto",
        };
    }
}

/**
 * Update an existing product
 */
export async function updateProduct(
    productId: string,
    vendorId: string,
    userEmail: string,
    data: unknown
): Promise<{
    success: boolean;
    product?: any;
    error?: string;
}> {
    try {
        // Validate data with Zod
        const validation = updateProductSchema.safeParse(data);
        if (!validation.success) {
            return {
                success: false,
                error: validation.error.errors[0]?.message || "Datos inválidos",
            };
        }

        const validatedData = validation.data;

        // Get existing product
        const existingProduct = await db.query.products.findFirst({
            where: eq(products.id, productId),
        });

        if (!existingProduct) {
            return {
                success: false,
                error: "Producto no encontrado",
            };
        }

        // Verify ownership
        if (existingProduct.vendorId !== vendorId) {
            return {
                success: false,
                error: "No autorizado",
            };
        }

        // Validate category if provided
        if (validatedData.categoryId) {
            const [category] = await db
                .select()
                .from(categories)
                .where(eq(categories.id, validatedData.categoryId))
                .limit(1);

            if (!category) {
                return {
                    success: false,
                    error: "Categoría no encontrada",
                };
            }
        }

        // Handle image updates
        let imagesPendingModeration = existingProduct.imagesPendingModeration;
        if (validatedData.images && validatedData.images.length > 0) {
            const newImages = validatedData.images.filter(
                (img) => !existingProduct.images?.includes(img)
            );

            if (newImages.length > 0) {
                await createImageModerationRecords(productId, vendorId, newImages);
                imagesPendingModeration = true;
            }
        }

        // Update the product
        const [updated] = await db
            .update(products)
            .set({
                ...validatedData,
                price: validatedData.price?.toString() || existingProduct.price,
                imagesPendingModeration,
                updatedAt: new Date(),
            })
            .where(eq(products.id, productId))
            .returning();

        // Log product update
        await logProductEvent({
            action: 'updated',
            productId: updated.id,
            productName: updated.name,
            vendorId,
            userId: vendorId,
            userEmail,
            userType: 'vendor',
            details: {
                updatedFields: Object.keys(validatedData),
                pendingModeration: imagesPendingModeration,
            },
        });

        return { success: true, product: updated };
    } catch (error: any) {
        console.error("Error updating product:", error);
        return {
            success: false,
            error: error.message || "Error al actualizar el producto",
        };
    }
}

/**
 * Delete a product
 */
export async function deleteProduct(
    productId: string,
    vendorId: string,
    userEmail: string
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        // Get existing product
        const existingProduct = await db.query.products.findFirst({
            where: eq(products.id, productId),
        });

        if (!existingProduct) {
            return {
                success: false,
                error: "Producto no encontrado",
            };
        }

        // Verify ownership
        if (existingProduct.vendorId !== vendorId) {
            return {
                success: false,
                error: "No autorizado",
            };
        }

        // Soft delete by marking as inactive
        await db
            .update(products)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(eq(products.id, productId));

        // Log product deletion
        await logProductEvent({
            action: 'deleted',
            productId,
            productName: existingProduct.name,
            vendorId,
            userId: vendorId,
            userEmail,
            userType: 'vendor',
            details: {
                deletedAt: new Date().toISOString(),
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Error deleting product:", error);
        return {
            success: false,
            error: "Error al eliminar el producto",
        };
    }
}

/**
 * Get a single product by ID
 */
export async function getProduct(productId: string) {
    try {
        const product = await db.query.products.findFirst({
            where: eq(products.id, productId),
            with: {
                category: true,
                vendor: {
                    columns: {
                        id: true,
                        businessName: true,
                        slug: true,
                    },
                },
            },
        });

        if (!product) {
            return { success: false, error: "Producto no encontrado" };
        }

        return { success: true, product };
    } catch (error) {
        console.error("Error getting product:", error);
        return { success: false, error: "Error al obtener el producto" };
    }
}

/**
 * Get all products for a vendor
 */
export async function getVendorProducts(vendorId: string) {
    try {
        const vendorProducts = await db.query.products.findMany({
            where: eq(products.vendorId, vendorId),
            with: {
                category: true,
            },
            orderBy: (products, { desc }) => desc(products.createdAt),
        });

        return { success: true, products: vendorProducts };
    } catch (error) {
        console.error("Error fetching vendor products:", error);
        return { success: false, error: "Error al obtener productos", products: [] };
    }
}

/**
 * Approve product images
 */
export async function approveProductImages(
    productId: string,
    adminUserId: string,
    adminEmail: string
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const product = await db.query.products.findFirst({
            where: eq(products.id, productId),
        });

        if (!product) {
            return { success: false, error: "Producto no encontrado" };
        }

        await db
            .update(products)
            .set({
                imagesApproved: true,
                imagesPendingModeration: false,
                updatedAt: new Date(),
            })
            .where(eq(products.id, productId));

        // Log image approval
        await logProductEvent({
            action: 'images_approved',
            productId,
            productName: product.name,
            vendorId: product.vendorId,
            userId: adminUserId,
            userEmail: adminEmail,
            userType: 'admin',
            details: {
                approvedAt: new Date().toISOString(),
                imageCount: product.images?.length || 0,
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Error approving product images:", error);
        return { success: false, error: "Error al aprobar imágenes" };
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique slug from a product name
 */
function generateSlug(name: string): string {
    const baseSlug = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    return `${baseSlug}-${nanoid(6)}`;
}

/**
 * Validate category exists
 */
export async function validateCategory(categoryId: number): Promise<boolean> {
    try {
        const [category] = await db
            .select()
            .from(categories)
            .where(eq(categories.id, categoryId))
            .limit(1);

        return !!category;
    } catch (error) {
        console.error("Error validating category:", error);
        return false;
    }
}

/**
 * Bulk update product status
 */
export async function bulkUpdateProductStatus(
    productIds: string[],
    isActive: boolean,
    vendorId: string
): Promise<{
    success: boolean;
    updatedCount?: number;
    error?: string;
}> {
    try {
        // Verify all products belong to the vendor
        const vendorProducts = await db
            .select({ id: products.id })
            .from(products)
            .where(
                sql`${products.id} = ANY(${productIds}) AND ${products.vendorId} = ${vendorId}`
            );

        if (vendorProducts.length !== productIds.length) {
            return {
                success: false,
                error: "Algunos productos no pertenecen al vendedor",
            };
        }

        // Update products
        await db
            .update(products)
            .set({
                isActive,
                updatedAt: new Date(),
            })
            .where(
                sql`${products.id} = ANY(${productIds})`
            );

        return {
            success: true,
            updatedCount: productIds.length,
        };
    } catch (error) {
        console.error("Error bulk updating products:", error);
        return {
            success: false,
            error: "Error al actualizar productos",
        };
    }
}

