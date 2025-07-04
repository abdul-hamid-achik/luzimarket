"use server";

import { db } from "@/db";
import { products, stockReservations } from "@/db/schema";
import { eq, and, gte, lte, isNull, sql } from "drizzle-orm";
import { auth } from "@/auth";

const CART_RESERVATION_DURATION = 15 * 60 * 1000; // 15 minutes
const CHECKOUT_RESERVATION_DURATION = 10 * 60 * 1000; // 10 minutes

interface ReservationResult {
  success: boolean;
  reservationId?: string;
  error?: string;
}

/**
 * Get available stock considering active reservations
 */
export async function getAvailableStock(productId: string): Promise<number> {
  try {
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
      columns: {
        stock: true,
      },
    });

    if (!product) return 0;

    // Get active reservations
    const activeReservations = await db.query.stockReservations.findMany({
      where: and(
        eq(stockReservations.productId, productId),
        gte(stockReservations.expiresAt, new Date()),
        isNull(stockReservations.releasedAt)
      ),
    });

    const reservedQuantity = activeReservations.reduce(
      (sum, reservation) => sum + reservation.quantity,
      0
    );

    return Math.max(0, (product.stock || 0) - reservedQuantity);
  } catch (error) {
    console.error("Error getting available stock:", error);
    return 0;
  }
}

/**
 * Create a stock reservation
 */
export async function createStockReservation(
  productId: string,
  quantity: number,
  type: 'cart' | 'checkout' = 'cart',
  sessionId?: string
): Promise<ReservationResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId && !sessionId) {
      return {
        success: false,
        error: "User ID or session ID required for reservation",
      };
    }

    // Check available stock
    const availableStock = await getAvailableStock(productId);
    
    if (availableStock < quantity) {
      return {
        success: false,
        error: `Only ${availableStock} units available`,
      };
    }

    // Release any existing reservations for this user/product
    await releaseUserProductReservations(productId, userId, sessionId);

    // Create new reservation
    const duration = type === 'checkout' ? CHECKOUT_RESERVATION_DURATION : CART_RESERVATION_DURATION;
    const expiresAt = new Date(Date.now() + duration);

    const [reservation] = await db.insert(stockReservations).values({
      productId,
      quantity,
      userId,
      sessionId: !userId ? sessionId : undefined,
      reservationType: type,
      expiresAt,
    }).returning({ id: stockReservations.id });

    return {
      success: true,
      reservationId: reservation.id,
    };
  } catch (error) {
    console.error("Error creating stock reservation:", error);
    return {
      success: false,
      error: "Failed to create reservation",
    };
  }
}

/**
 * Release stock reservations for a specific user and product
 */
async function releaseUserProductReservations(
  productId: string,
  userId?: string,
  sessionId?: string
): Promise<void> {
  const conditions = [
    eq(stockReservations.productId, productId),
    isNull(stockReservations.releasedAt),
  ];

  if (userId) {
    conditions.push(eq(stockReservations.userId, userId));
  } else if (sessionId) {
    conditions.push(eq(stockReservations.sessionId, sessionId));
  }

  await db
    .update(stockReservations)
    .set({
      releasedAt: new Date(),
    })
    .where(and(...conditions));
}

/**
 * Release a specific stock reservation
 */
export async function releaseStockReservation(reservationId: string): Promise<boolean> {
  try {
    await db
      .update(stockReservations)
      .set({
        releasedAt: new Date(),
      })
      .where(
        and(
          eq(stockReservations.id, reservationId),
          isNull(stockReservations.releasedAt)
        )
      );

    return true;
  } catch (error) {
    console.error("Error releasing stock reservation:", error);
    return false;
  }
}

/**
 * Convert cart reservations to checkout reservations
 */
export async function convertToCheckoutReservations(
  items: Array<{ productId: string; quantity: number }>,
  sessionId?: string
): Promise<boolean> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    // Release all existing cart reservations
    await releaseAllUserReservations(userId, sessionId, 'cart');

    // Create checkout reservations
    const results = await Promise.all(
      items.map(item =>
        createStockReservation(item.productId, item.quantity, 'checkout', sessionId)
      )
    );

    return results.every(result => result.success);
  } catch (error) {
    console.error("Error converting to checkout reservations:", error);
    return false;
  }
}

/**
 * Release all reservations for a user
 */
export async function releaseAllUserReservations(
  userId?: string,
  sessionId?: string,
  type?: 'cart' | 'checkout'
): Promise<void> {
  const conditions = [isNull(stockReservations.releasedAt)];

  if (userId) {
    conditions.push(eq(stockReservations.userId, userId));
  } else if (sessionId) {
    conditions.push(eq(stockReservations.sessionId, sessionId));
  }

  if (type) {
    conditions.push(eq(stockReservations.reservationType, type));
  }

  await db
    .update(stockReservations)
    .set({
      releasedAt: new Date(),
    })
    .where(and(...conditions));
}

/**
 * Clean up expired reservations
 */
export async function cleanupExpiredReservations(): Promise<number> {
  try {
    const result = await db
      .update(stockReservations)
      .set({
        releasedAt: new Date(),
      })
      .where(
        and(
          lte(stockReservations.expiresAt, new Date()),
          isNull(stockReservations.releasedAt)
        )
      );

    return result.count || 0;
  } catch (error) {
    console.error("Error cleaning up expired reservations:", error);
    return 0;
  }
}

/**
 * Check if product has sufficient stock for purchase considering reservations
 */
export async function checkStockWithReservations(
  productId: string,
  requestedQuantity: number,
  excludeUserId?: string,
  excludeSessionId?: string
): Promise<{
  isAvailable: boolean;
  availableStock: number;
  totalStock: number;
  reservedStock: number;
}> {
  try {
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
      columns: {
        stock: true,
      },
    });

    if (!product) {
      return {
        isAvailable: false,
        availableStock: 0,
        totalStock: 0,
        reservedStock: 0,
      };
    }

    // Get active reservations excluding the current user's
    const conditions = [
      eq(stockReservations.productId, productId),
      gte(stockReservations.expiresAt, new Date()),
      isNull(stockReservations.releasedAt),
    ];

    // Exclude current user's reservations
    if (excludeUserId) {
      conditions.push(sql`${stockReservations.userId} != ${excludeUserId}`);
    } else if (excludeSessionId) {
      conditions.push(sql`${stockReservations.sessionId} != ${excludeSessionId}`);
    }

    const activeReservations = await db.query.stockReservations.findMany({
      where: and(...conditions),
    });

    const reservedQuantity = activeReservations.reduce(
      (sum, reservation) => sum + reservation.quantity,
      0
    );

    const totalStock = product.stock || 0;
    const availableStock = Math.max(0, totalStock - reservedQuantity);

    return {
      isAvailable: availableStock >= requestedQuantity,
      availableStock,
      totalStock,
      reservedStock: reservedQuantity,
    };
  } catch (error) {
    console.error("Error checking stock with reservations:", error);
    return {
      isAvailable: false,
      availableStock: 0,
      totalStock: 0,
      reservedStock: 0,
    };
  }
}