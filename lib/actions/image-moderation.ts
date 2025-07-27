"use server";

import { db } from "@/db";
import { products, productImageModeration, vendors } from "@/db/schema";
import { eq, desc, and, inArray, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schema for approving images
const approveImagesSchema = z.object({
  imageIds: z.array(z.string().uuid()),
});

// Schema for rejecting images
const rejectImagesSchema = z.object({
  imageIds: z.array(z.string().uuid()),
  reason: z.string().min(1),
  category: z.enum(["quality", "inappropriate", "copyright", "misleading", "other"]),
  notes: z.string().optional(),
});

// Get all pending images for moderation
export async function getPendingImages() {
  try {
    const session = await auth();
    if (!session?.user?.role || !["admin", "super_admin"].includes(session.user.role)) {
      throw new Error("Unauthorized");
    }

    const pendingImages = await db
      .select({
        id: productImageModeration.id,
        productId: productImageModeration.productId,
        vendorId: productImageModeration.vendorId,
        imageUrl: productImageModeration.imageUrl,
        imageIndex: productImageModeration.imageIndex,
        createdAt: productImageModeration.createdAt,
        product: {
          name: products.name,
          slug: products.slug,
        },
        vendor: {
          businessName: vendors.businessName,
          slug: vendors.slug,
        },
      })
      .from(productImageModeration)
      .leftJoin(products, eq(productImageModeration.productId, products.id))
      .leftJoin(vendors, eq(productImageModeration.vendorId, vendors.id))
      .where(eq(productImageModeration.status, "pending"))
      .orderBy(desc(productImageModeration.createdAt));

    return { success: true, data: pendingImages };
  } catch (error) {
    console.error("Error fetching pending images:", error);
    return { success: false, error: "Failed to fetch pending images" };
  }
}

// Get moderated images (approved or rejected)
export async function getModeratedImages(status?: "approved" | "rejected") {
  try {
    const session = await auth();
    if (!session?.user?.role || !["admin", "super_admin"].includes(session.user.role)) {
      throw new Error("Unauthorized");
    }

    const conditions = status 
      ? eq(productImageModeration.status, status)
      : or(
          eq(productImageModeration.status, "approved"),
          eq(productImageModeration.status, "rejected")
        );

    const moderatedImages = await db
      .select({
        id: productImageModeration.id,
        productId: productImageModeration.productId,
        vendorId: productImageModeration.vendorId,
        imageUrl: productImageModeration.imageUrl,
        imageIndex: productImageModeration.imageIndex,
        status: productImageModeration.status,
        reviewedAt: productImageModeration.reviewedAt,
        rejectionReason: productImageModeration.rejectionReason,
        rejectionCategory: productImageModeration.rejectionCategory,
        notes: productImageModeration.notes,
        product: {
          name: products.name,
          slug: products.slug,
        },
        vendor: {
          businessName: vendors.businessName,
          slug: vendors.slug,
        },
      })
      .from(productImageModeration)
      .leftJoin(products, eq(productImageModeration.productId, products.id))
      .leftJoin(vendors, eq(productImageModeration.vendorId, vendors.id))
      .where(conditions)
      .orderBy(desc(productImageModeration.reviewedAt));

    return { success: true, data: moderatedImages };
  } catch (error) {
    console.error("Error fetching moderated images:", error);
    return { success: false, error: "Failed to fetch moderated images" };
  }
}

// Approve selected images
export async function approveImages(data: z.infer<typeof approveImagesSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.role || !["admin", "super_admin"].includes(session.user.role)) {
      throw new Error("Unauthorized");
    }

    const validatedData = approveImagesSchema.parse(data);

    // Update image moderation records
    await db
      .update(productImageModeration)
      .set({
        status: "approved",
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          inArray(productImageModeration.id, validatedData.imageIds),
          eq(productImageModeration.status, "pending")
        )
      );

    // Get unique product IDs to update
    const moderationRecords = await db
      .select({
        productId: productImageModeration.productId,
      })
      .from(productImageModeration)
      .where(inArray(productImageModeration.id, validatedData.imageIds));

    const productIds = [...new Set(moderationRecords.map(r => r.productId))];

    // Check if all images for each product are approved
    for (const productId of productIds) {
      const productImages = await db
        .select()
        .from(productImageModeration)
        .where(eq(productImageModeration.productId, productId));

      const allApproved = productImages.every(img => img.status === "approved");
      const hasPending = productImages.some(img => img.status === "pending");

      await db
        .update(products)
        .set({
          imagesApproved: allApproved,
          imagesPendingModeration: hasPending,
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId));
    }

    revalidatePath("/admin/moderation/images");
    return { success: true, message: "Images approved successfully" };
  } catch (error) {
    console.error("Error approving images:", error);
    return { success: false, error: "Failed to approve images" };
  }
}

// Reject selected images
export async function rejectImages(data: z.infer<typeof rejectImagesSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.role || !["admin", "super_admin"].includes(session.user.role)) {
      throw new Error("Unauthorized");
    }

    const validatedData = rejectImagesSchema.parse(data);

    // Update image moderation records
    await db
      .update(productImageModeration)
      .set({
        status: "rejected",
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        rejectionReason: validatedData.reason,
        rejectionCategory: validatedData.category,
        notes: validatedData.notes,
        updatedAt: new Date(),
      })
      .where(
        and(
          inArray(productImageModeration.id, validatedData.imageIds),
          eq(productImageModeration.status, "pending")
        )
      );

    // Get unique product IDs to update
    const moderationRecords = await db
      .select({
        productId: productImageModeration.productId,
      })
      .from(productImageModeration)
      .where(inArray(productImageModeration.id, validatedData.imageIds));

    const productIds = [...new Set(moderationRecords.map(r => r.productId))];

    // Update product status
    for (const productId of productIds) {
      const productImages = await db
        .select()
        .from(productImageModeration)
        .where(eq(productImageModeration.productId, productId));

      const allApproved = productImages.every(img => img.status === "approved");
      const hasPending = productImages.some(img => img.status === "pending");

      await db
        .update(products)
        .set({
          imagesApproved: allApproved,
          imagesPendingModeration: hasPending,
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId));
    }

    revalidatePath("/admin/moderation/images");
    return { success: true, message: "Images rejected successfully" };
  } catch (error) {
    console.error("Error rejecting images:", error);
    return { success: false, error: "Failed to reject images" };
  }
}

// Create image moderation records when product is created/updated
export async function createImageModerationRecords(
  productId: string,
  vendorId: string,
  imageUrls: string[]
) {
  try {
    // Delete existing moderation records for this product
    await db
      .delete(productImageModeration)
      .where(eq(productImageModeration.productId, productId));

    // Create new moderation records for each image
    if (imageUrls.length > 0) {
      const moderationRecords = imageUrls.map((url, index) => ({
        productId,
        vendorId,
        imageUrl: url,
        imageIndex: index,
        status: "pending" as const,
      }));

      await db.insert(productImageModeration).values(moderationRecords);

      // Update product to indicate images are pending moderation
      await db
        .update(products)
        .set({
          imagesPendingModeration: true,
          imagesApproved: false,
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId));
    }

    return { success: true };
  } catch (error) {
    console.error("Error creating image moderation records:", error);
    return { success: false, error: "Failed to create moderation records" };
  }
}

// Get moderation stats
export async function getModerationStats() {
  try {
    const session = await auth();
    if (!session?.user?.role || !["admin", "super_admin"].includes(session.user.role)) {
      throw new Error("Unauthorized");
    }

    const [pending, approved, rejected] = await Promise.all([
      db
        .select({ count: productImageModeration.id })
        .from(productImageModeration)
        .where(eq(productImageModeration.status, "pending")),
      db
        .select({ count: productImageModeration.id })
        .from(productImageModeration)
        .where(eq(productImageModeration.status, "approved")),
      db
        .select({ count: productImageModeration.id })
        .from(productImageModeration)
        .where(eq(productImageModeration.status, "rejected")),
    ]);

    return {
      success: true,
      data: {
        pending: pending[0]?.count || 0,
        approved: approved[0]?.count || 0,
        rejected: rejected[0]?.count || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching moderation stats:", error);
    return { success: false, error: "Failed to fetch stats" };
  }
}