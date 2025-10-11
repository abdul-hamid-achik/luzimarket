"use server";

/**
 * Admin Vendor Actions
 * These actions now delegate to VendorService for consistency
 * Kept for backward compatibility with existing admin components
 */

import { approveVendor as approveVendorService, rejectVendor as rejectVendorService } from "@/lib/services/vendor-service";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

/**
 * Approve vendor - delegates to VendorService
 */
export async function approveVendor(vendorId: string) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  try {
    const result = await approveVendorService(vendorId, session.user.id, session.user.email!);

    if (result.success) {
      revalidatePath("/admin/vendors");
    }

    return result;
  } catch (error) {
    console.error("Error approving vendor:", error);
    return { success: false, error: "Failed to approve vendor" };
  }
}

/**
 * Reject vendor - delegates to VendorService
 */
export async function rejectVendor(vendorId: string, reason?: string) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  try {
    const result = await rejectVendorService(vendorId, session.user.id, session.user.email!, reason);

    if (result.success) {
      revalidatePath("/admin/vendors");
    }

    return result;
  } catch (error) {
    console.error("Error rejecting vendor:", error);
    return { success: false, error: "Failed to reject vendor" };
  }
}