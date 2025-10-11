import { db } from "@/db";
import { coupons, couponUsage, products, orders, users } from "@/db/schema";
import { eq, and, sql, gte, lte, or, isNull } from "drizzle-orm";

export interface CouponData {
    code: string;
    name: string;
    description?: string;
    type: "percentage" | "fixed_amount" | "free_shipping";
    value: number;
    minimumOrderAmount?: number;
    maximumDiscountAmount?: number;
    usageLimit?: number;
    userUsageLimit?: number;
    startsAt?: Date;
    expiresAt?: Date;
    restrictToProducts?: string[];
    isActive?: boolean;
}

export interface CouponValidationResult {
    isValid: boolean;
    discount?: number;
    error?: string;
    coupon?: any;
}

/**
 * Creates a vendor coupon
 */
export async function createVendorCoupon(vendorId: string, couponData: CouponData) {
    try {
        // Check if code already exists
        const [existing] = await db
            .select()
            .from(coupons)
            .where(eq(coupons.code, couponData.code.toUpperCase()))
            .limit(1);

        if (existing) {
            return {
                success: false,
                error: "Coupon code already exists",
            };
        }

        // Create coupon
        const [coupon] = await db
            .insert(coupons)
            .values({
                vendorId,
                code: couponData.code.toUpperCase(),
                name: couponData.name,
                description: couponData.description,
                type: couponData.type,
                value: couponData.value.toString(),
                minimumOrderAmount: couponData.minimumOrderAmount?.toString(),
                maximumDiscountAmount: couponData.maximumDiscountAmount?.toString(),
                usageLimit: couponData.usageLimit,
                userUsageLimit: couponData.userUsageLimit || 1,
                startsAt: couponData.startsAt,
                expiresAt: couponData.expiresAt,
                restrictToProducts: couponData.restrictToProducts,
                isActive: couponData.isActive ?? true,
                couponScope: "vendor",
            })
            .returning();

        return {
            success: true,
            coupon,
        };
    } catch (error) {
        console.error("Error creating vendor coupon:", error);
        return {
            success: false,
            error: "Failed to create coupon",
        };
    }
}

/**
 * Updates a vendor coupon
 */
export async function updateVendorCoupon(
    couponId: string,
    vendorId: string,
    couponData: Partial<CouponData>
) {
    try {
        const updateData: any = {};

        if (couponData.name) updateData.name = couponData.name;
        if (couponData.description !== undefined) updateData.description = couponData.description;
        if (couponData.value !== undefined) updateData.value = couponData.value.toString();
        if (couponData.minimumOrderAmount !== undefined) {
            updateData.minimumOrderAmount = couponData.minimumOrderAmount.toString();
        }
        if (couponData.maximumDiscountAmount !== undefined) {
            updateData.maximumDiscountAmount = couponData.maximumDiscountAmount.toString();
        }
        if (couponData.usageLimit !== undefined) updateData.usageLimit = couponData.usageLimit;
        if (couponData.userUsageLimit !== undefined) updateData.userUsageLimit = couponData.userUsageLimit;
        if (couponData.startsAt !== undefined) updateData.startsAt = couponData.startsAt;
        if (couponData.expiresAt !== undefined) updateData.expiresAt = couponData.expiresAt;
        if (couponData.restrictToProducts !== undefined) {
            updateData.restrictToProducts = couponData.restrictToProducts;
        }
        if (couponData.isActive !== undefined) updateData.isActive = couponData.isActive;

        updateData.updatedAt = new Date();

        const [updated] = await db
            .update(coupons)
            .set(updateData)
            .where(
                and(
                    eq(coupons.id, couponId),
                    eq(coupons.vendorId, vendorId)
                )
            )
            .returning();

        if (!updated) {
            return {
                success: false,
                error: "Coupon not found or unauthorized",
            };
        }

        return {
            success: true,
            coupon: updated,
        };
    } catch (error) {
        console.error("Error updating vendor coupon:", error);
        return {
            success: false,
            error: "Failed to update coupon",
        };
    }
}

/**
 * Deletes a vendor coupon
 */
export async function deleteVendorCoupon(couponId: string, vendorId: string) {
    try {
        await db
            .delete(coupons)
            .where(
                and(
                    eq(coupons.id, couponId),
                    eq(coupons.vendorId, vendorId)
                )
            );

        return { success: true };
    } catch (error) {
        console.error("Error deleting vendor coupon:", error);
        return {
            success: false,
            error: "Failed to delete coupon",
        };
    }
}

/**
 * Gets all coupons for a vendor
 */
export async function getVendorCoupons(vendorId: string) {
    try {
        const vendorCoupons = await db
            .select()
            .from(coupons)
            .where(eq(coupons.vendorId, vendorId))
            .orderBy(sql`${coupons.createdAt} DESC`);

        // Get usage stats for each coupon
        const couponsWithStats = await Promise.all(
            vendorCoupons.map(async (coupon) => {
                const [usageStats] = await db
                    .select({
                        totalUses: sql<number>`count(*)`,
                        totalDiscount: sql<number>`COALESCE(SUM(${couponUsage.discountAmount}::numeric), 0)`,
                    })
                    .from(couponUsage)
                    .where(eq(couponUsage.couponId, coupon.id));

                return {
                    ...coupon,
                    stats: {
                        totalUses: usageStats?.totalUses || 0,
                        totalDiscount: usageStats?.totalDiscount || 0,
                    },
                };
            })
        );

        return {
            success: true,
            coupons: couponsWithStats,
        };
    } catch (error) {
        console.error("Error fetching vendor coupons:", error);
        return {
            success: false,
            error: "Failed to fetch coupons",
            coupons: [],
        };
    }
}

/**
 * Validates a coupon for checkout
 */
export async function validateCoupon(
    code: string,
    vendorId: string,
    userId: string | null,
    userEmail: string | null,
    cartTotal: number,
    productIds: string[]
): Promise<CouponValidationResult> {
    try {
        // Find coupon by code
        const [coupon] = await db
            .select()
            .from(coupons)
            .where(eq(coupons.code, code.toUpperCase()))
            .limit(1);

        if (!coupon) {
            return {
                isValid: false,
                error: "Cupón no válido",
            };
        }

        // Check if coupon is active
        if (!coupon.isActive) {
            return {
                isValid: false,
                error: "Este cupón ya no está activo",
            };
        }

        // Check if coupon is for this vendor (or platform-wide)
        if (coupon.couponScope === "vendor" && coupon.vendorId !== vendorId) {
            return {
                isValid: false,
                error: "Este cupón no es válido para este vendedor",
            };
        }

        // Check date validity
        const now = new Date();
        if (coupon.startsAt && new Date(coupon.startsAt) > now) {
            return {
                isValid: false,
                error: "Este cupón aún no está disponible",
            };
        }

        if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
            return {
                isValid: false,
                error: "Este cupón ha expirado",
            };
        }

        // Check usage limit
        if (coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit) {
            return {
                isValid: false,
                error: "Este cupón ha alcanzado su límite de uso",
            };
        }

        // Check user usage limit
        if (userId || userEmail) {
            const userUsages = await db
                .select({ count: sql<number>`count(*)` })
                .from(couponUsage)
                .where(
                    and(
                        eq(couponUsage.couponId, coupon.id),
                        userId
                            ? eq(couponUsage.userId, userId)
                            : eq(couponUsage.userEmail, userEmail!)
                    )
                );

            const userUseCount = userUsages[0]?.count || 0;
            const userLimit = coupon.userUsageLimit || 1;
            if (userUseCount >= userLimit) {
                return {
                    isValid: false,
                    error: "Ya has usado este cupón el máximo de veces permitido",
                };
            }
        }

        // Check minimum order amount
        if (coupon.minimumOrderAmount && Number(coupon.minimumOrderAmount) > cartTotal) {
            return {
                isValid: false,
                error: `Monto mínimo de compra: $${Number(coupon.minimumOrderAmount).toFixed(2)}`,
            };
        }

        // Check if coupon is restricted to specific products
        if (coupon.restrictToProducts && coupon.restrictToProducts.length > 0) {
            const hasValidProduct = productIds.some(id =>
                (coupon.restrictToProducts as string[])!.includes(id)
            );

            if (!hasValidProduct) {
                return {
                    isValid: false,
                    error: "Este cupón no es válido para los productos en tu carrito",
                };
            }
        }

        // Check first-time customer restriction
        if (coupon.restrictToFirstTimeCustomers && userId) {
            const [orderCount] = await db
                .select({ count: sql<number>`count(*)` })
                .from(orders)
                .where(
                    and(
                        eq(orders.userId, userId),
                        eq(orders.paymentStatus, "succeeded")
                    )
                );

            if ((orderCount?.count || 0) > 0) {
                return {
                    isValid: false,
                    error: "Este cupón es solo para clientes nuevos",
                };
            }
        }

        // Calculate discount
        let discount = 0;
        if (coupon.type === "percentage") {
            discount = (cartTotal * Number(coupon.value)) / 100;

            // Apply maximum discount cap if set
            if (coupon.maximumDiscountAmount) {
                discount = Math.min(discount, Number(coupon.maximumDiscountAmount));
            }
        } else if (coupon.type === "fixed_amount") {
            discount = Number(coupon.value);
        }

        // Ensure discount doesn't exceed cart total
        discount = Math.min(discount, cartTotal);

        return {
            isValid: true,
            discount: Math.round(discount * 100) / 100,
            coupon,
        };
    } catch (error) {
        console.error("Error validating coupon:", error);
        return {
            isValid: false,
            error: "Error al validar el cupón",
        };
    }
}

/**
 * Records coupon usage
 */
export async function recordCouponUsage(
    couponId: string,
    orderId: string,
    userId: string | null,
    userEmail: string | null,
    discountAmount: number
) {
    try {
        // Insert usage record
        await db.insert(couponUsage).values({
            couponId,
            orderId,
            userId,
            userEmail,
            discountAmount: discountAmount.toString(),
        });

        // Increment usage count
        await db
            .update(coupons)
            .set({
                usageCount: sql`${coupons.usageCount} + 1`,
            })
            .where(eq(coupons.id, couponId));

        return { success: true };
    } catch (error) {
        console.error("Error recording coupon usage:", error);
        return {
            success: false,
            error: "Failed to record coupon usage",
        };
    }
}

/**
 * Gets coupon usage analytics
 */
export async function getCouponAnalytics(couponId: string, vendorId: string) {
    try {
        // Verify vendor owns this coupon
        const [coupon] = await db
            .select()
            .from(coupons)
            .where(
                and(
                    eq(coupons.id, couponId),
                    eq(coupons.vendorId, vendorId)
                )
            )
            .limit(1);

        if (!coupon) {
            return {
                success: false,
                error: "Coupon not found or unauthorized",
            };
        }

        // Get usage stats
        const [stats] = await db
            .select({
                totalUses: sql<number>`count(*)`,
                totalDiscount: sql<number>`COALESCE(SUM(${couponUsage.discountAmount}::numeric), 0)`,
                uniqueUsers: sql<number>`count(DISTINCT COALESCE(${couponUsage.userId}::text, ${couponUsage.userEmail}))`,
            })
            .from(couponUsage)
            .where(eq(couponUsage.couponId, couponId));

        // Get recent uses
        const recentUses = await db
            .select({
                usage: couponUsage,
                order: orders,
                user: users,
            })
            .from(couponUsage)
            .leftJoin(orders, eq(couponUsage.orderId, orders.id))
            .leftJoin(users, eq(couponUsage.userId, users.id))
            .where(eq(couponUsage.couponId, couponId))
            .orderBy(sql`${couponUsage.usedAt} DESC`)
            .limit(10);

        return {
            success: true,
            analytics: {
                coupon,
                totalUses: stats?.totalUses || 0,
                totalDiscount: stats?.totalDiscount || 0,
                uniqueUsers: stats?.uniqueUsers || 0,
                recentUses,
            },
        };
    } catch (error) {
        console.error("Error fetching coupon analytics:", error);
        return {
            success: false,
            error: "Failed to fetch analytics",
        };
    }
}

