"use server";

import { db } from "@/db";
import { coupons, couponUsage, users, orders } from "@/db/schema";
import { eq, and, gte, lte, lt, sql, desc, or, isNull } from "drizzle-orm";
import { z } from "zod";

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: any;
  error?: string;
  discount?: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  categoryId?: string;
  vendorId?: string;
}

// Validation schema for coupon code
const couponCodeSchema = z.string().min(1).max(50);

export async function validateCoupon(
  code: string,
  cartItems: CartItem[],
  userId?: string,
  userEmail?: string
): Promise<CouponValidationResult> {
  try {
    // Validate input
    const validCode = couponCodeSchema.parse(code.toUpperCase().trim());

    // Get coupon details
    const coupon = await db.query.coupons.findFirst({
      where: and(
        eq(coupons.code, validCode),
        eq(coupons.isActive, true)
      ),
      with: {
        usage: true,
      }
    });

    if (!coupon) {
      return {
        isValid: false,
        error: "Coupon code not found or inactive"
      };
    }

    // Check if coupon has started
    if (coupon.startsAt && new Date() < coupon.startsAt) {
      return {
        isValid: false,
        error: "Coupon is not yet active"
      };
    }

    // Check if coupon has expired
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return {
        isValid: false,
        error: "Coupon has expired"
      };
    }

    // Check global usage limit
    if (coupon.usageLimit && (coupon.usageCount ?? 0) >= coupon.usageLimit) {
      return {
        isValid: false,
        error: "Coupon usage limit exceeded"
      };
    }

    // Check user usage limit (if user is logged in)
    if (userId && coupon.userUsageLimit) {
      const userUsageCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(couponUsage)
        .where(
          and(
            eq(couponUsage.couponId, coupon.id),
            eq(couponUsage.userId, userId)
          )
        );

      if (userUsageCount[0]?.count >= coupon.userUsageLimit) {
        return {
          isValid: false,
          error: "You have already used this coupon the maximum number of times"
        };
      }
    }

    // Check user usage limit for guest users by email
    if (!userId && userEmail && coupon.userUsageLimit) {
      const guestUsageCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(couponUsage)
        .where(
          and(
            eq(couponUsage.couponId, coupon.id),
            eq(couponUsage.userEmail, userEmail)
          )
        );

      if (guestUsageCount[0]?.count >= coupon.userUsageLimit) {
        return {
          isValid: false,
          error: "You have already used this coupon the maximum number of times"
        };
      }
    }

    // Check first-time customer restriction
    if (coupon.restrictToFirstTimeCustomers && userId) {
      const userOrderCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.userId, userId));

      if (userOrderCount[0]?.count > 0) {
        return {
          isValid: false,
          error: "This coupon is only available for first-time customers"
        };
      }
    }

    // Calculate cart totals and check restrictions
    const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const eligibleItems = getEligibleCartItems(cartItems, coupon);
    const eligibleTotal = eligibleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Check minimum order amount
    if (coupon.minimumOrderAmount && cartTotal < parseFloat(coupon.minimumOrderAmount)) {
      return {
        isValid: false,
        error: `Minimum order amount of $${coupon.minimumOrderAmount} required`
      };
    }

    // Check if there are eligible items
    if (eligibleItems.length === 0) {
      return {
        isValid: false,
        error: "No items in your cart are eligible for this coupon"
      };
    }

    // Calculate discount
    const discount = calculateDiscount(coupon, eligibleTotal, cartTotal);

    return {
      isValid: true,
      coupon,
      discount
    };

  } catch (error) {
    console.error("Coupon validation error:", error);
    return {
      isValid: false,
      error: "Invalid coupon code format"
    };
  }
}

function getEligibleCartItems(cartItems: CartItem[], coupon: any): CartItem[] {
  // If no restrictions, all items are eligible
  if (!coupon.restrictToCategories?.length &&
    !coupon.restrictToVendors?.length &&
    !coupon.restrictToProducts?.length) {
    return cartItems;
  }

  return cartItems.filter(item => {
    // Check category restriction
    if (coupon.restrictToCategories?.length) {
      if (!item.categoryId || !coupon.restrictToCategories.includes(item.categoryId.toString())) {
        return false;
      }
    }

    // Check vendor restriction
    if (coupon.restrictToVendors?.length) {
      if (!item.vendorId || !coupon.restrictToVendors.includes(item.vendorId)) {
        return false;
      }
    }

    // Check product restriction
    if (coupon.restrictToProducts?.length) {
      if (!coupon.restrictToProducts.includes(item.id)) {
        return false;
      }
    }

    return true;
  });
}

function calculateDiscount(coupon: any, eligibleTotal: number, cartTotal: number): number {
  let discount = 0;

  switch (coupon.type) {
    case 'percentage':
      discount = (eligibleTotal * parseFloat(coupon.value)) / 100;
      // Apply maximum discount cap if set
      if (coupon.maximumDiscountAmount) {
        discount = Math.min(discount, parseFloat(coupon.maximumDiscountAmount));
      }
      break;

    case 'fixed_amount':
      discount = Math.min(parseFloat(coupon.value), eligibleTotal);
      break;

    case 'free_shipping':
      // This would need to be handled in the checkout/shipping calculation
      discount = 0;
      break;

    default:
      discount = 0;
  }

  return Math.round(discount * 100) / 100; // Round to 2 decimal places
}

export async function applyCouponToOrder(
  couponCode: string,
  orderId: string,
  discountAmount: number,
  userId?: string,
  userEmail?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const coupon = await db.query.coupons.findFirst({
      where: eq(coupons.code, couponCode.toUpperCase().trim())
    });

    if (!coupon) {
      return { success: false, error: "Coupon not found" };
    }

    // Record coupon usage
    await db.insert(couponUsage).values({
      couponId: coupon.id,
      userId: userId || null,
      orderId,
      userEmail: userEmail || null,
      discountAmount: discountAmount.toString(),
    });

    // Update coupon usage count
    await db
      .update(coupons)
      .set({
        usageCount: sql`${coupons.usageCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(coupons.id, coupon.id));

    return { success: true };

  } catch (error) {
    console.error("Error applying coupon to order:", error);
    return { success: false, error: "Failed to apply coupon" };
  }
}

export async function getAvailableCoupons(userId?: string) {
  try {
    const now = new Date();

    const availableCoupons = await db.query.coupons.findMany({
      where: and(
        eq(coupons.isActive, true),
        // Only show coupons that haven't expired
        or(
          isNull(coupons.expiresAt),
          gte(coupons.expiresAt, now)
        ),
        // Only show coupons that have started
        or(
          isNull(coupons.startsAt),
          lte(coupons.startsAt, now)
        ),
        // Only show coupons that haven't reached their usage limit
        or(
          isNull(coupons.usageLimit),
          lt(coupons.usageCount, coupons.usageLimit)
        )
      ),
      orderBy: [desc(coupons.createdAt)]
    });

    return availableCoupons;
  } catch (error) {
    console.error("Error fetching available coupons:", error);
    return [];
  }
}

export async function getCouponByCode(code: string) {
  try {
    return await db.query.coupons.findFirst({
      where: eq(coupons.code, code.toUpperCase().trim())
    });
  } catch (error) {
    console.error("Error fetching coupon:", error);
    return null;
  }
}