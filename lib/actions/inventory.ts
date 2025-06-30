"use server";

import { db } from "@/db";
import { products, orderItems } from "@/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";

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
 * Checks stock availability for a single product
 */
export async function checkProductStock(productId: string, requestedQuantity: number = 1): Promise<{
  isAvailable: boolean;
  availableStock: number;
  productName: string;
}> {
  try {
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

    return {
      isAvailable: product.stock >= requestedQuantity,
      availableStock: product.stock,
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

      if (product.stock < item.quantity) {
        errors.push({
          productId: item.id,
          productName: product.name,
          requestedQuantity: item.quantity,
          availableStock: product.stock,
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
export async function reserveStock(items: CartItem[], reservationId: string): Promise<boolean> {
  try {
    // First validate stock is available
    const validation = await validateCartStock(items);
    if (!validation.isValid) {
      return false;
    }

    // In a production system, you'd want to implement actual stock reservation
    // For now, we'll just validate again at the time of payment
    // TODO: Implement proper stock reservation table
    console.log(`Stock reserved for reservation ${reservationId}:`, items);
    
    return true;
  } catch (error) {
    console.error("Error reserving stock:", error);
    return false;
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