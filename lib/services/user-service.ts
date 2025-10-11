"use server";

import { db } from "@/db";
import { users, vendors, adminUsers, orders } from "@/db/schema";
import { eq, and, gt, sql, or, ilike, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { changePasswordSchema, updateUserProfileSchema, adminUsersQuerySchema } from "@/lib/services/validation-service";
import { logPasswordEvent, logAuthEvent, logAdminEvent } from "@/lib/audit-helpers";
import { convertGuestOrdersToUser } from "@/lib/actions/guest-orders";
import { AuditLogger } from "@/lib/middleware/security";

/**
 * UserService
 * Centralized service for user management operations
 * Handles profile management, password changes, and admin user operations
 */

type UserType = "customer" | "vendor" | "admin";

// ============================================================================
// PROFILE MANAGEMENT
// ============================================================================

export async function getUserProfile(userId: string, userType: UserType) {
    try {
        let table;
        switch (userType) {
            case "customer":
                table = users;
                break;
            case "vendor":
                table = vendors;
                break;
            case "admin":
                table = adminUsers;
                break;
        }

        const [user] = await db
            .select()
            .from(table)
            .where(eq(table.id, userId))
            .limit(1);

        if (!user) {
            return { success: false, error: "Usuario no encontrado" };
        }

        // Remove sensitive fields
        const { passwordHash, twoFactorSecret, twoFactorBackupCodes, ...profile } = user as any;

        return { success: true, profile };
    } catch (error) {
        console.error("Error getting user profile:", error);
        return { success: false, error: "Error al obtener el perfil del usuario" };
    }
}

export async function updateUserProfile(
    userId: string,
    userType: UserType,
    data: unknown
): Promise<{ success: boolean; profile?: any; error?: string }> {
    try {
        const validatedData = updateUserProfileSchema.parse(data);

        let table;
        switch (userType) {
            case "customer":
                table = users;
                break;
            case "vendor":
                table = vendors;
                break;
            case "admin":
                table = adminUsers;
                break;
        }

        const [updated] = await db
            .update(table)
            .set({
                ...validatedData,
                updatedAt: new Date(),
            })
            .where(eq(table.id, userId))
            .returning();

        if (!updated) {
            return { success: false, error: "Error al actualizar el perfil" };
        }

        // Remove sensitive fields
        const { passwordHash, twoFactorSecret, twoFactorBackupCodes, ...profile } = updated as any;

        return { success: true, profile };
    } catch (error: any) {
        console.error("Error updating user profile:", error);
        return { success: false, error: error.message || "Error al actualizar el perfil" };
    }
}

export async function changePassword(
    userId: string,
    userType: UserType,
    userEmail: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const validatedData = changePasswordSchema.parse({ currentPassword, newPassword, confirmPassword });

        let table;
        switch (userType) {
            case "customer":
                table = users;
                break;
            case "vendor":
                table = vendors;
                break;
            case "admin":
                table = adminUsers;
                break;
        }

        // Get user record
        const [userRecord] = await db
            .select()
            .from(table)
            .where(eq(table.id, userId))
            .limit(1);

        if (!userRecord) {
            return { success: false, error: "Usuario no encontrado" };
        }

        // Check if user has a password set
        if (!userRecord.passwordHash) {
            return { success: false, error: "No hay contraseña configurada para esta cuenta" };
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(validatedData.currentPassword, userRecord.passwordHash);

        if (!isPasswordValid) {
            return { success: false, error: "La contraseña actual es incorrecta" };
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(validatedData.newPassword, 12);

        // Update password
        await db
            .update(table)
            .set({
                passwordHash: hashedPassword,
                updatedAt: new Date(),
            })
            .where(eq(table.id, userId));

        // Log password change event
        await logPasswordEvent({
            action: 'password_changed',
            userId,
            userEmail,
            userType,
            details: {
                changedAt: new Date().toISOString(),
            },
        });

        return { success: true };
    } catch (error: any) {
        console.error("Error changing password:", error);
        return { success: false, error: error.message || "Error al cambiar la contraseña" };
    }
}

export async function deactivateUser(
    userId: string,
    userType: UserType,
    reason?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        let table;
        switch (userType) {
            case "customer":
                table = users;
                break;
            case "vendor":
                table = vendors;
                break;
            case "admin":
                table = adminUsers;
                break;
        }

        await db
            .update(table)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(eq(table.id, userId));

        // Log deactivation
        const [user] = await db.select().from(table).where(eq(table.id, userId)).limit(1);
        if (user) {
            await logAdminEvent({
                action: 'account_deactivated',
                category: 'user_management',
                adminUserId: userId,
                adminEmail: (user as any).email,
                resourceType: 'user',
                resourceId: userId,
                severity: 'warning',
                details: {
                    reason: reason || 'Not specified',
                    deactivatedAt: new Date().toISOString(),
                },
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Error deactivating user:", error);
        return { success: false, error: "Error al desactivar el usuario" };
    }
}

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

export async function listUsers(filters: {
    search?: string;
    userType?: 'customer' | 'vendor' | 'admin' | 'all';
    status?: 'active' | 'inactive' | 'locked' | 'all';
    page?: number;
    limit?: number;
}) {
    try {
        const validatedFilters = adminUsersQuerySchema.parse(filters);
        const { search, userType = 'all', status = 'all', page = 1, limit = 20 } = validatedFilters;
        const offset = (page - 1) * limit;

        let results: any[] = [];

        // Helper to build where conditions
        const buildConditions = (table: any) => {
            const conditions = [];

            if (status === 'active') {
                conditions.push(eq(table.isActive, true));
            } else if (status === 'inactive') {
                conditions.push(eq(table.isActive, false));
            } else if (status === 'locked') {
                conditions.push(gt(table.lockedUntil, new Date()));
            }

            if (search) {
                conditions.push(
                    or(
                        ilike(table.email, `%${search}%`),
                        ilike((table as any).name || (table as any).contactName || (table as any).businessName, `%${search}%`)
                    )
                );
            }

            return conditions.length > 0 ? and(...conditions) : undefined;
        };

        // Fetch users based on userType filter
        if (userType === 'all' || userType === 'customer') {
            const customers = await db
                .select({
                    id: users.id,
                    name: users.name,
                    email: users.email,
                    isActive: users.isActive,
                    emailVerified: users.emailVerified,
                    createdAt: users.createdAt,
                    lockedUntil: users.lockedUntil,
                    userType: sql<string>`'customer'`,
                })
                .from(users)
                .where(buildConditions(users))
                .orderBy(desc(users.createdAt))
                .limit(limit)
                .offset(offset);
            results.push(...customers);
        }

        if (userType === 'all' || userType === 'vendor') {
            const vendorUsers = await db
                .select({
                    id: vendors.id,
                    name: vendors.businessName,
                    email: vendors.email,
                    isActive: vendors.isActive,
                    emailVerified: sql<boolean>`true`,
                    createdAt: vendors.createdAt,
                    lockedUntil: vendors.lockedUntil,
                    userType: sql<string>`'vendor'`,
                })
                .from(vendors)
                .where(buildConditions(vendors))
                .orderBy(desc(vendors.createdAt))
                .limit(limit)
                .offset(offset);
            results.push(...vendorUsers);
        }

        if (userType === 'all' || userType === 'admin') {
            const admins = await db
                .select({
                    id: adminUsers.id,
                    name: adminUsers.name,
                    email: adminUsers.email,
                    isActive: adminUsers.isActive,
                    emailVerified: sql<boolean>`true`,
                    createdAt: adminUsers.createdAt,
                    lockedUntil: adminUsers.lockedUntil,
                    userType: sql<string>`'admin'`,
                })
                .from(adminUsers)
                .where(buildConditions(adminUsers))
                .orderBy(desc(adminUsers.createdAt))
                .limit(limit)
                .offset(offset);
            results.push(...admins);
        }

        // Sort combined results by createdAt
        results.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

        return { success: true, users: results.slice(0, limit), total: results.length };
    } catch (error: any) {
        console.error("Error listing users:", error);
        return { success: false, error: error.message || "Error al listar usuarios", users: [], total: 0 };
    }
}

export async function getUserDetails(userId: string, userType?: UserType) {
    try {
        // Try to find the user in all tables if userType is not specified
        let userRecord: any = null;
        let actualUserType: UserType = 'customer';

        if (!userType || userType === 'customer') {
            const [customer] = await db
                .select({
                    id: users.id,
                    name: users.name,
                    email: users.email,
                    isActive: users.isActive,
                    emailVerified: users.emailVerified,
                    createdAt: users.createdAt,
                    updatedAt: users.updatedAt,
                    lockedUntil: users.lockedUntil,
                    failedLoginAttempts: users.failedLoginAttempts,
                    twoFactorEnabled: users.twoFactorEnabled,
                    orderCount: sql<number>`(
            SELECT COUNT(*) FROM ${orders}
            WHERE ${orders.userId} = ${users.id}
          )`,
                    totalSpent: sql<number>`(
            SELECT COALESCE(SUM(${orders.total}::numeric), 0) FROM ${orders}
            WHERE ${orders.userId} = ${users.id}
            AND ${orders.paymentStatus} = 'succeeded'
          )`,
                })
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);

            if (customer) {
                userRecord = { ...customer, userType: 'customer' };
                actualUserType = 'customer';
            }
        }

        if (!userRecord && (!userType || userType === 'vendor')) {
            const [vendor] = await db
                .select({
                    id: vendors.id,
                    name: vendors.businessName,
                    email: vendors.email,
                    isActive: vendors.isActive,
                    emailVerified: sql<boolean>`true`,
                    createdAt: vendors.createdAt,
                    updatedAt: vendors.updatedAt,
                    lockedUntil: vendors.lockedUntil,
                    failedLoginAttempts: vendors.failedLoginAttempts,
                    twoFactorEnabled: vendors.twoFactorEnabled,
                    phone: vendors.phone,
                    street: vendors.street,
                    city: vendors.city,
                    state: vendors.state,
                })
                .from(vendors)
                .where(eq(vendors.id, userId))
                .limit(1);

            if (vendor) {
                userRecord = { ...vendor, userType: 'vendor', orderCount: 0, totalSpent: 0 };
                actualUserType = 'vendor';
            }
        }

        if (!userRecord && (!userType || userType === 'admin')) {
            const [admin] = await db
                .select({
                    id: adminUsers.id,
                    name: adminUsers.name,
                    email: adminUsers.email,
                    isActive: adminUsers.isActive,
                    emailVerified: sql<boolean>`true`,
                    createdAt: adminUsers.createdAt,
                    updatedAt: adminUsers.updatedAt,
                    lockedUntil: adminUsers.lockedUntil,
                    failedLoginAttempts: adminUsers.failedLoginAttempts,
                    twoFactorEnabled: adminUsers.twoFactorEnabled,
                })
                .from(adminUsers)
                .where(eq(adminUsers.id, userId))
                .limit(1);

            if (admin) {
                userRecord = { ...admin, userType: 'admin', orderCount: 0, totalSpent: 0 };
                actualUserType = 'admin';
            }
        }

        if (!userRecord) {
            return { success: false, error: "Usuario no encontrado" };
        }

        return { success: true, user: userRecord, userType: actualUserType };
    } catch (error) {
        console.error("Error getting user details:", error);
        return { success: false, error: "Error al obtener detalles del usuario" };
    }
}

export async function lockUserAccount(
    userId: string,
    userType: UserType,
    durationMinutes?: number,
    reason?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        let table;
        switch (userType) {
            case "customer":
                table = users;
                break;
            case "vendor":
                table = vendors;
                break;
            case "admin":
                table = adminUsers;
                break;
        }

        const now = new Date();
        const minutes = typeof durationMinutes === "number" && durationMinutes > 0 ? durationMinutes : 30;
        const lockedUntil = new Date(now.getTime() + minutes * 60 * 1000);

        await db
            .update(table)
            .set({
                lockedUntil,
                lastFailedLoginAt: now,
                failedLoginAttempts: 5,
            })
            .where(eq(table.id, userId));

        // Log account lock
        const [user] = await db.select().from(table).where(eq(table.id, userId)).limit(1);
        if (user) {
            await AuditLogger.log({
                action: 'user.account_locked',
                category: 'security',
                severity: 'warning',
                userId,
                userType,
                userEmail: (user as any).email,
                ip: 'system',
                resourceType: 'user',
                resourceId: userId,
                details: {
                    reason: reason || 'Manual lock',
                    lockedUntil: lockedUntil.toISOString(),
                    durationMinutes: minutes,
                },
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Error locking account:", error);
        return { success: false, error: "Failed to lock account" };
    }
}

export async function unlockUserAccount(
    userId: string,
    userType: UserType
): Promise<{ success: boolean; error?: string }> {
    try {
        let table;
        switch (userType) {
            case "customer":
                table = users;
                break;
            case "vendor":
                table = vendors;
                break;
            case "admin":
                table = adminUsers;
                break;
        }

        await db
            .update(table)
            .set({
                failedLoginAttempts: 0,
                lastFailedLoginAt: null,
                lockedUntil: null,
            })
            .where(eq(table.id, userId));

        // Log account unlock
        const [user] = await db.select().from(table).where(eq(table.id, userId)).limit(1);
        if (user) {
            await AuditLogger.log({
                action: 'user.account_unlocked',
                category: 'security',
                severity: 'info',
                userId,
                userType,
                userEmail: (user as any).email,
                ip: 'system',
                resourceType: 'user',
                resourceId: userId,
                details: {
                    unlockedAt: new Date().toISOString(),
                },
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Error unlocking account:", error);
        return { success: false, error: "Failed to unlock account" };
    }
}

// ============================================================================
// GUEST TO USER CONVERSION
// ============================================================================

export async function convertGuestToUser(userId: string, email: string) {
    try {
        const result = await convertGuestOrdersToUser({ userId, email });
        return { success: true, convertedCount: result.convertedCount };
    } catch (error) {
        console.error("Error converting guest orders:", error);
        return { success: false, convertedCount: 0, error: "Error al convertir órdenes" };
    }
}

