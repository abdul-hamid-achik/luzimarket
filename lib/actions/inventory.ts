"use server";

import { db } from "@/db";
import { products, orderItems, stockReservations } from "@/db/schema";
import { eq, sql, and, gte, gt, isNull } from "drizzle-orm";

export interface CartItem {
  id: string;
  quantity: number;
  name: string;
  price: number;
}

export interface StockValidationResult {
  isValid: boolean;
  errors: Array<{
    productId: string;
    productName: string;
    requestedQuantity: number;
    availableStock: number;
  }>;
}

/**
 * Checks stock availability for a single product considering reservations
 */
export async function checkProductStock(productId: string, requestedQuantity: number = 1, userId?: string, sessionId?: string): Promise<{
  isAvailable: boolean;
  availableStock: number;
  productName: string;
}> {
  try {
    // Clean up any expired reservations first
    await cleanupExpiredReservations();

    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, productId),
        eq(products.isActive, true)
      ),
      columns: {
        id: true,
        name: true,
        stock: true,
      }
    });

    if (!product) {
      return {
        isAvailable: false,
        availableStock: 0,
        productName: 'Producto no encontrado',
      };
    }

    // Check stock with reservations
    const availableStock = await getAvailableStock(productId);
    const isAvailable = availableStock >= requestedQuantity;

    return {
      isAvailable,
      availableStock,
      productName: product.name,
    };
  } catch (error) {
    console.error("Error checking product stock:", error);
    return {
      isAvailable: false,
      availableStock: 0,
      productName: 'Error al verificar stock',
    };
  }
}

/**
 * Validates if all items in the cart have sufficient stock
 */
export async function validateCartStock(items: CartItem[]): Promise<StockValidationResult> {
  const errors: StockValidationResult['errors'] = [];
  
  try {
    for (const item of items) {
      const product = await db.query.products.findFirst({
        where: and(
          eq(products.id, item.id),
          eq(products.isActive, true)
        ),
        columns: {
          id: true,
          name: true,
          stock: true,
        }
      });

      if (!product) {
        errors.push({
          productId: item.id,
          productName: item.name,
          requestedQuantity: item.quantity,
          availableStock: 0,
        });
        continue;
      }

      const currentStock = product.stock ?? 0;
      
      if (currentStock < item.quantity) {
        errors.push({
          productId: item.id,
          productName: product.name,
          requestedQuantity: item.quantity,
          availableStock: currentStock,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  } catch (error) {
    console.error("Error validating cart stock:", error);
    throw new Error("Failed to validate stock availability");
  }
}

/**
 * Reserves stock for items during checkout process
 * This prevents overselling during the payment process
 */
export async function reserveStock(
  items: CartItem[],
  reservationId: string,
  userId?: string,
  sessionId?: string,
  reservationType: 'cart' | 'checkout' = 'checkout',
  expirationMinutes: number = 15
): Promise<boolean> {
  try {
    // First validate stock is available
    const validation = await validateCartStock(items);
    if (!validation.isValid) {
      return false;
    }

    // Clean up expired reservations first
    await cleanupExpiredReservations();

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

    // Create stock reservations for each item
    const reservations = items.map(item => ({
      productId: item.id,
      quantity: item.quantity,
      userId,
      sessionId: sessionId || reservationId,
      reservationType,
      expiresAt,
    }));

    // Insert reservations
    await db.insert(stockReservations).values(reservations);

    console.log(`Stock reserved for ${reservationType} ${reservationId}:`, items);
    return true;
  } catch (error) {
    console.error("Error reserving stock:", error);
    return false;
  }
}

/**
 * Releases stock reservations
 */
export async function releaseReservation(
  sessionId: string,
  userId?: string
): Promise<boolean> {
  try {
    const conditions = [eq(stockReservations.sessionId, sessionId)];
    if (userId) {
      conditions.push(eq(stockReservations.userId, userId));
    }

    // Mark reservations as released
    await db
      .update(stockReservations)
      .set({ releasedAt: new Date() })
      .where(and(...conditions));

    console.log(`Stock reservation released for session ${sessionId}`);
    return true;
  } catch (error) {
    console.error("Error releasing reservation:", error);
    return false;
  }
}

/**
 * Cleans up expired stock reservations
 */
export async function cleanupExpiredReservations(): Promise<number> {
  try {
    const now = new Date();

    // Find and release expired reservations
    const result = await db
      .update(stockReservations)
      .set({ releasedAt: now })
      .where(
        and(
          isNull(stockReservations.releasedAt),
          gt(stockReservations.expiresAt, now)
        )
      );

    // Note: result doesn't have a standard count property in Drizzle
    // We'll log the operation success
    console.log('Expired reservations cleanup completed');
    const count = 0;
    if (count > 0) {
      console.log(`Cleaned up ${count} expired stock reservations`);
    }

    return count;
  } catch (error) {
    console.error("Error cleaning up expired reservations:", error);
    return 0;
  }
}

/**
 * Gets available stock considering reservations
 */
export async function getAvailableStock(productId: string): Promise<number> {
  try {
    // Clean up expired reservations first
    await cleanupExpiredReservations();

    // Get product stock
    const [product] = await db
      .select({ stock: products.stock })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return 0;
    }

    // Get active reservations
    const activeReservations = await db
      .select({
        totalReserved: sql<number>`SUM(${stockReservations.quantity})`
      })
      .from(stockReservations)
      .where(
        and(
          eq(stockReservations.productId, productId),
          isNull(stockReservations.releasedAt),
          gt(stockReservations.expiresAt, new Date())
        )
      );

    const reserved = activeReservations[0]?.totalReserved || 0;
    const available = Math.max(0, (product.stock || 0) - reserved);

    return available;
  } catch (error) {
    console.error("Error getting available stock:", error);
    return 0;
  }
}

/**
 * Reduces stock levels when an order is completed
 */
export async function reduceStock(orderId: string): Promise<boolean> {
  try {
    // Get all order items for this order
    const items = await db.query.orderItems.findMany({
      where: eq(orderItems.orderId, orderId),
      with: {
        product: {
          columns: {
            id: true,
            name: true,
            stock: true,
          }
        }
      }
    });

    if (items.length === 0) {
      console.warn(`No items found for order ${orderId}`);
      return false;
    }

    // Reduce stock for each item
    const stockReductions = await Promise.allSettled(
      items.map(async (item) => {
        const currentStock = item.product?.stock || 0;
        const newStock = Math.max(0, currentStock - item.quantity);
        
        if (currentStock < item.quantity) {
          console.warn(
            `Insufficient stock for product ${item.product?.name} (${item.productId}). ` +
            `Requested: ${item.quantity}, Available: ${currentStock}`
          );
        }

        return await db
          .update(products)
          .set({
            stock: newStock,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      })
    );

    // Check if any stock reductions failed
    const failures = stockReductions.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      console.error(`Failed to reduce stock for ${failures.length} items in order ${orderId}`);
      failures.forEach((failure, index) => {
        console.error(`Item ${index}:`, failure.reason);
      });
      return false;
    }

    console.log(`Successfully reduced stock for ${items.length} items in order ${orderId}`);
    return true;
  } catch (error) {
    console.error("Error reducing stock:", error);
    return false;
  }
}

/**
 * Restores stock levels when an order is cancelled or refunded
 */
export async function restoreStock(orderId: string): Promise<boolean> {
  try {
    // Get all order items for this order
    const items = await db.query.orderItems.findMany({
      where: eq(orderItems.orderId, orderId),
    });

    if (items.length === 0) {
      console.warn(`No items found for order ${orderId}`);
      return false;
    }

    // Restore stock for each item
    const stockRestorations = await Promise.allSettled(
      items.map(async (item) => {
        return await db
          .update(products)
          .set({
            stock: sql`${products.stock} + ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      })
    );

    // Check if any stock restorations failed
    const failures = stockRestorations.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      console.error(`Failed to restore stock for ${failures.length} items in order ${orderId}`);
      return false;
    }

    console.log(`Successfully restored stock for ${items.length} items in order ${orderId}`);
    return true;
  } catch (error) {
    console.error("Error restoring stock:", error);
    return false;
  }
}

/**
 * Gets products with low stock (below threshold)
 */
export async function getLowStockProducts(threshold: number = 5) {
  try {
    const lowStockProducts = await db.query.products.findMany({
      where: and(
        eq(products.isActive, true),
        gte(products.stock, 0),
        sql`${products.stock} <= ${threshold}`
      ),
      with: {
        vendor: {
          columns: {
            id: true,
            businessName: true,
            email: true,
          }
        },
        category: {
          columns: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: products.stock,
    });

    return lowStockProducts;
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    throw new Error("Failed to fetch low stock products");
  }
}

/**
 * Updates stock level for a specific product
 */
export async function updateProductStock(productId: string, newStock: number): Promise<boolean> {
  try {
    if (newStock < 0) {
      throw new Error("Stock cannot be negative");
    }

    await db
      .update(products)
      .set({
        stock: newStock,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    return true;
  } catch (error) {
    console.error("Error updating product stock:", error);
    return false;
  }
}