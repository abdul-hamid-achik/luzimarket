"use server";

import {
  checkProductStock,
  validateCartStock,
  reserveStock,
  releaseReservation,
  cleanupExpiredReservations,
  getAvailableStock,
  reduceStock,
  restoreStock,
  getLowStockProducts,
  updateProductStock,
  type CartItem,
  type StockValidationResult,
} from "@/lib/actions/inventory";
import { sendVendorLowStockAlert } from "@/lib/services/email-service";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * InventoryService
 * Enhanced inventory management with notification capabilities
 * Wraps existing inventory actions and adds email notifications for low stock
 */

// ============================================================================
// RE-EXPORT CORE INVENTORY FUNCTIONS
// ============================================================================

export {
  checkProductStock,
  validateCartStock,
  reserveStock,
  releaseReservation,
  cleanupExpiredReservations,
  getAvailableStock,
  reduceStock,
  restoreStock,
  getLowStockProducts,
  updateProductStock,
  type CartItem,
  type StockValidationResult,
};

// ============================================================================
// ENHANCED FUNCTIONS WITH NOTIFICATIONS
// ============================================================================

const LOW_STOCK_THRESHOLD = 5;

/**
 * Reduce stock and notify vendor if stock becomes low
 */
export async function reduceStockWithNotification(orderId: string): Promise<boolean> {
  try {
    // Reduce stock using existing function
    const success = await reduceStock(orderId);

    if (!success) {
      return false;
    }

    // Check for low stock and notify vendors
    await checkAndNotifyLowStock();

    return true;
  } catch (error) {
    console.error("Error reducing stock with notification:", error);
    return false;
  }
}

/**
 * Update product stock and notify vendor if it becomes low
 */
export async function updateProductStockWithNotification(
  productId: string,
  newStock: number
): Promise<boolean> {
  try {
    // Update stock using existing function
    const success = await updateProductStock(productId, newStock);

    if (!success) {
      return false;
    }

    // Check if stock is low and notify
    if (newStock <= LOW_STOCK_THRESHOLD) {
      await notifyVendorAboutLowStock(productId);
    }

    return true;
  } catch (error) {
    console.error("Error updating stock with notification:", error);
    return false;
  }
}

/**
 * Check for low stock products and notify their vendors
 */
export async function checkAndNotifyLowStock(threshold: number = LOW_STOCK_THRESHOLD): Promise<void> {
  try {
    const lowStockProducts = await getLowStockProducts(threshold);

    for (const product of lowStockProducts) {
      await notifyVendorAboutLowStock(product.id);
    }
  } catch (error) {
    console.error("Error checking and notifying low stock:", error);
  }
}

/**
 * Notify vendor about a specific low stock product
 */
export async function notifyVendorAboutLowStock(productId: string): Promise<void> {
  try {
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
      with: {
        vendor: {
          columns: {
            id: true,
            businessName: true,
            email: true,
          },
        },
      },
    });

    if (!product || !product.vendor) {
      console.warn(`Product ${productId} or vendor not found`);
      return;
    }

    // Only notify if stock is actually low
    const currentStock = product.stock ?? 0;
    if (currentStock > LOW_STOCK_THRESHOLD) {
      return;
    }

    // Send email notification
    await sendVendorLowStockAlert(
      {
        email: product.vendor.email,
        businessName: product.vendor.businessName,
      },
      {
        name: product.name,
        stock: currentStock,
        id: product.id,
      }
    );

    console.log(`Low stock notification sent for product ${product.name} (${product.stock} units)`);
  } catch (error) {
    console.error("Error notifying vendor about low stock:", error);
    // Don't throw - notification failures shouldn't break stock management
  }
}

/**
 * Auto-reserve stock during checkout with validation
 */
export async function autoReserveOnCheckout(
  cartItems: CartItem[],
  checkoutSessionId: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First validate stock availability
    const validation = await validateCartStock(cartItems);

    if (!validation.isValid) {
      return {
        success: false,
        error: `Stock insuficiente: ${validation.errors.map(e => `${e.productName} (disponible: ${e.availableStock})`).join(', ')}`,
      };
    }

    // Reserve stock for checkout (15 minute expiration)
    const reserved = await reserveStock(cartItems, checkoutSessionId, userId, checkoutSessionId, 'checkout', 15);

    if (!reserved) {
      return {
        success: false,
        error: 'No se pudo reservar el stock. Por favor, intenta de nuevo.',
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error auto-reserving on checkout:", error);
    return {
      success: false,
      error: 'Error al reservar el stock',
    };
  }
}

/**
 * Get detailed stock information for a product
 */
export async function getDetailedStockInfo(productId: string): Promise<{
  success: boolean;
  stock?: {
    total: number;
    available: number;
    reserved: number;
    isLowStock: boolean;
    threshold: number;
  };
  error?: string;
}> {
  try {
    const productStock = await checkProductStock(productId);

    if (!productStock.isAvailable && productStock.availableStock === 0) {
      return {
        success: false,
        error: 'Producto no encontrado',
      };
    }

    const availableStock = await getAvailableStock(productId);
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
      columns: { stock: true },
    });

    const totalStock = product?.stock || 0;
    const reserved = totalStock - availableStock;

    return {
      success: true,
      stock: {
        total: totalStock,
        available: availableStock,
        reserved: Math.max(0, reserved),
        isLowStock: availableStock <= LOW_STOCK_THRESHOLD,
        threshold: LOW_STOCK_THRESHOLD,
      },
    };
  } catch (error) {
    console.error("Error getting detailed stock info:", error);
    return {
      success: false,
      error: 'Error al obtener información de stock',
    };
  }
}

/**
 * Batch check stock for multiple products
 */
export async function batchCheckStock(productIds: string[]): Promise<{
  success: boolean;
  stockInfo?: Record<string, { available: number; isLowStock: boolean }>;
  error?: string;
}> {
  try {
    const stockInfo: Record<string, { available: number; isLowStock: boolean }> = {};

    for (const productId of productIds) {
      const available = await getAvailableStock(productId);
      stockInfo[productId] = {
        available,
        isLowStock: available <= LOW_STOCK_THRESHOLD,
      };
    }

    return {
      success: true,
      stockInfo,
    };
  } catch (error) {
    console.error("Error batch checking stock:", error);
    return {
      success: false,
      error: 'Error al verificar stock de productos',
    };
  }
}

