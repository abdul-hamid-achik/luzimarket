"use server";

/**
 * Admin User Actions
 * These actions now delegate to UserService for consistency
 * Kept for backward compatibility with existing admin components
 */

import { listUsers } from "@/lib/services/user-service";
import { auth } from "@/lib/auth";

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date | null;
  orderCount: number;
  totalSpent: number;
  userType: "customer" | "vendor" | "admin";
  lockedUntil?: Date | null;
};

/**
 * Get admin users - delegates to UserService
 */
export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  try {
    const result = await listUsers({
      userType: 'all',
      status: 'all',
      page: 1,
      limit: 1000, // Get all users for admin
    });

    if (!result.success) {
      console.error("Error from UserService:", result.error);
      return [];
    }

    // Map to AdminUserRow format for backward compatibility
    return result.users.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt,
      orderCount: u.orderCount || 0,
      totalSpent: u.totalSpent || 0,
      userType: u.userType as "customer" | "vendor" | "admin",
      lockedUntil: u.lockedUntil,
    }));
  } catch (error) {
    console.error("Error getting admin users:", error);
    return [];
  }
}
