"use server";

/**
 * Auth Actions
 * These actions now delegate to AuthService for consistency
 * Kept for backward compatibility with existing components that use server actions
 */

import { authenticateUser as authenticateUserService } from "@/lib/services/auth-service";
import { unlockUserAccount as unlockUserAccountService } from "@/lib/services/user-service";
import { db } from "@/db";
import { users, vendors, adminUsers } from "@/db/schema";
import { and, gt } from "drizzle-orm";
import { headers } from "next/headers";

interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: "customer" | "vendor" | "admin";
  };
  error?: string;
  isLocked?: boolean;
  remainingAttempts?: number;
}

/**
 * Authenticate user - delegates to AuthService
 */
export async function authenticateUser(
  email: string,
  password: string,
  userType: "customer" | "vendor" | "admin",
  locale: string = "es"
): Promise<AuthResult> {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";

    // Delegate to AuthService
    return await authenticateUserService(email, password, userType, ip);
  } catch (error) {
    console.error("Authentication error:", error);
    return { success: false, error: "Error de autenticación" };
  }
}

/**
 * Unlock user account - delegates to UserService
 */
export async function unlockUserAccount(
  userId: string,
  userType: "customer" | "vendor" | "admin"
): Promise<{ success: boolean; error?: string }> {
  return await unlockUserAccountService(userId, userType);
}

/**
 * Get locked accounts - kept as action since it's read-only
 */
export async function getLockedAccounts() {
  try {
    const now = new Date();

    // Get locked users from all tables
    const [lockedCustomers, lockedVendors, lockedAdmins] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          lockedUntil: users.lockedUntil,
          failedLoginAttempts: users.failedLoginAttempts,
          lastFailedLoginAt: users.lastFailedLoginAt,
        })
        .from(users)
        .where(and(
          gt(users.lockedUntil, now),
          gt(users.failedLoginAttempts, 0)
        )),
      db
        .select({
          id: vendors.id,
          email: vendors.email,
          name: vendors.contactName,
          lockedUntil: vendors.lockedUntil,
          failedLoginAttempts: vendors.failedLoginAttempts,
          lastFailedLoginAt: vendors.lastFailedLoginAt,
        })
        .from(vendors)
        .where(and(
          gt(vendors.lockedUntil, now),
          gt(vendors.failedLoginAttempts, 0)
        )),
      db
        .select({
          id: adminUsers.id,
          email: adminUsers.email,
          name: adminUsers.name,
          lockedUntil: adminUsers.lockedUntil,
          failedLoginAttempts: adminUsers.failedLoginAttempts,
          lastFailedLoginAt: adminUsers.lastFailedLoginAt,
        })
        .from(adminUsers)
        .where(and(
          gt(adminUsers.lockedUntil, now),
          gt(adminUsers.failedLoginAttempts, 0)
        )),
    ]);

    return {
      customers: lockedCustomers,
      vendors: lockedVendors,
      admins: lockedAdmins,
    };
  } catch (error) {
    console.error("Error fetching locked accounts:", error);
    return {
      customers: [],
      vendors: [],
      admins: [],
    };
  }
}

/**
 * Lock user account - delegates to UserService
 */
export async function lockUserAccount(
  userId: string,
  userType: "customer" | "vendor" | "admin",
  durationMinutes?: number
): Promise<{ success: boolean; error?: string }> {
  const { lockUserAccount: lockUserAccountService } = await import("@/lib/services/user-service");
  return await lockUserAccountService(userId, userType, durationMinutes);
}