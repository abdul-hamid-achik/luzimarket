"use server";

/**
 * Vendor Actions
 * These actions now delegate to VendorService for consistency
 * Kept for backward compatibility with existing components that use server actions
 */

import { registerVendor as registerVendorService, getVendorDetails } from "@/lib/services/vendor-service";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

/**
 * Register vendor - delegates to VendorService
 */
export async function registerVendor(data: unknown) {
  try {
    const result = await registerVendorService(data);

    if (result.success) {
      revalidatePath("/");
    }

    // Map error messages for backward compatibility
    if (!result.success && result.error?.includes("ya está registrado")) {
      return { success: false, error: "emailExists" };
    }

    return result.success
      ? { success: true, vendor: result.vendor }
      : { success: false, error: "tryAgain" };
  } catch (error) {
    console.error("Error registering vendor:", error);
    return { success: false, error: "tryAgain" };
  }
}

/**
 * Get vendor from session - delegates to VendorService
 */
export async function getVendorFromSession() {
  try {
    const session = await auth();

    if (!session || !session.user || session.user.role !== "vendor") {
      return { success: false, error: "Unauthorized" };
    }

    const vendorId = session.user.vendor?.id || session.user.id;
    const result = await getVendorDetails(vendorId);

    if (!result.success) {
      return { success: false, error: result.error || "Vendor not found" };
    }

    return { success: true, data: result.vendor };
  } catch (error) {
    console.error("Error getting vendor from session:", error);
    return { success: false, error: "Failed to get vendor information" };
  }
}