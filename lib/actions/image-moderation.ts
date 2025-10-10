"use server";

import { db } from "@/db";
import { products, productImageModeration, vendors } from "@/db/schema";
import { eq, desc, and, inArray, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logImageModerationEvent } from "@/lib/audit-helpers";
import { z } from "zod";
import { sendImageApprovalNotification, sendImageRejectionNotification } from "@/lib/email";

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

    // Check if all images for each product are approved and send notifications
    for (const productId of productIds) {
      const productImages = await db
        .select()
        .from(productImageModeration)
        .where(eq(productImageModeration.productId, productId));

      const allApproved = productImages.every(img => img.status === "approved");
      const hasPending = productImages.some(img => img.status === "pending");
      const approvedCount = productImages.filter(img => img.status === "approved").length;

      await db
        .update(products)
        .set({
          imagesApproved: allApproved,
          imagesPendingModeration: hasPending,
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId));

      // Send notification to vendor if any images were approved
      if (approvedCount > 0) {
        try {
          const productDetails = await db
            .select({
              name: products.name,
              slug: products.slug,
              vendor: {
                email: vendors.email,
                businessName: vendors.businessName,
              },
            })
            .from(products)
            .leftJoin(vendors, eq(products.vendorId, vendors.id))
            .where(eq(products.id, productId))
            .limit(1);

          if (productDetails[0]?.vendor?.email) {
            await sendImageApprovalNotification({
              vendorEmail: productDetails[0].vendor.email,
              vendorName: productDetails[0].vendor.businessName || "Vendedor",
              productName: productDetails[0].name,
              productSlug: productDetails[0].slug,
              approvedImageCount: approvedCount,
              totalImageCount: productImages.length,
            });
          }
        } catch (error) {
          console.error("Failed to send approval notification:", error);
          // Don't fail the entire operation if email fails
        }
      }
    }

    // Log image moderation approval
    await logImageModerationEvent({
      action: 'approved',
      imageIds: validatedData.imageIds,
      productId: validatedData.imageIds.length > 0 ? moderationRecords[0]?.productId : undefined,
      adminUserId: session.user.id,
      adminEmail: session.user.email!,
      details: {
        imageCount: validatedData.imageIds.length,
        approvedAt: new Date().toISOString(),
      },
    });

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

    // Update product status and send notifications
    for (const productId of productIds) {
      const productImages = await db
        .select()
        .from(productImageModeration)
        .where(eq(productImageModeration.productId, productId));

      const allApproved = productImages.every(img => img.status === "approved");
      const hasPending = productImages.some(img => img.status === "pending");
      const rejectedCount = productImages.filter(img => img.status === "rejected").length;

      await db
        .update(products)
        .set({
          imagesApproved: allApproved,
          imagesPendingModeration: hasPending,
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId));

      // Send notification to vendor if any images were rejected
      if (rejectedCount > 0) {
        try {
          const productDetails = await db
            .select({
              name: products.name,
              slug: products.slug,
              vendor: {
                email: vendors.email,
                businessName: vendors.businessName,
              },
            })
            .from(products)
            .leftJoin(vendors, eq(products.vendorId, vendors.id))
            .where(eq(products.id, productId))
            .limit(1);

          if (productDetails[0]?.vendor?.email) {
            await sendImageRejectionNotification({
              vendorEmail: productDetails[0].vendor.email,
              vendorName: productDetails[0].vendor.businessName || "Vendedor",
              productName: productDetails[0].name,
              productSlug: productDetails[0].slug,
              rejectedImageCount: rejectedCount,
              totalImageCount: productImages.length,
              rejectionReason: validatedData.reason,
              rejectionCategory: validatedData.category,
              notes: validatedData.notes,
            });
          }
        } catch (error) {
          console.error("Failed to send rejection notification:", error);
          // Don't fail the entire operation if email fails
        }
      }
    }

    // Log image moderation rejection
    await logImageModerationEvent({
      action: 'rejected',
      imageIds: validatedData.imageIds,
      productId: validatedData.imageIds.length > 0 ? moderationRecords[0]?.productId : undefined,
      adminUserId: session.user.id,
      adminEmail: session.user.email!,
      details: {
        imageCount: validatedData.imageIds.length,
        rejectedAt: new Date().toISOString(),
        reason: validatedData.reason,
        category: validatedData.category,
        notes: validatedData.notes,
      },
      severity: 'warning',
    });

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
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length,
      },
    };
  } catch (error) {
    console.error("Error fetching moderation stats:", error);
    return { success: false, error: "Failed to fetch stats" };
  }
}