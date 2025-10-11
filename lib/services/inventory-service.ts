import { db } from "@/db";
import { inventoryAlerts, products, vendors } from "@/db/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import { sendEmail } from "@/lib/email";

export interface InventoryAlertConfig {
  productId: string;
  alertType: "low_stock" | "out_of_stock";
  threshold: number;
  isActive?: boolean;
}

export interface InventorySettings {
  lowStockThreshold?: number;
  enableAutoDeactivate?: boolean;
  notificationPreferences?: {
    email?: boolean;
    lowStock?: boolean;
    outOfStock?: boolean;
  };
}

/**
 * Creates or updates an inventory alert for a product
 */
export async function createInventoryAlert(
  vendorId: string,
  config: InventoryAlertConfig
) {
  try {
    // Check if alert already exists
    const existing = await db
      .select()
      .from(inventoryAlerts)
      .where(
        and(
          eq(inventoryAlerts.vendorId, vendorId),
          eq(inventoryAlerts.productId, config.productId),
          eq(inventoryAlerts.alertType, config.alertType)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing alert
      const [updated] = await db
        .update(inventoryAlerts)
        .set({
          threshold: config.threshold,
          isActive: config.isActive ?? true,
          updatedAt: new Date(),
        })
        .where(eq(inventoryAlerts.id, existing[0].id))
        .returning();

      return { success: true, alert: updated };
    }

    // Create new alert
    const [alert] = await db
      .insert(inventoryAlerts)
      .values({
        vendorId,
        productId: config.productId,
        alertType: config.alertType,
        threshold: config.threshold,
        isActive: config.isActive ?? true,
      })
      .returning();

    return { success: true, alert };
  } catch (error) {
    console.error("Error creating inventory alert:", error);
    return { success: false, error: "Failed to create inventory alert" };
  }
}

/**
 * Gets all active inventory alerts for a vendor
 */
export async function getVendorInventoryAlerts(vendorId: string) {
  try {
    const alerts = await db
      .select({
        alert: inventoryAlerts,
        product: products,
      })
      .from(inventoryAlerts)
      .leftJoin(products, eq(inventoryAlerts.productId, products.id))
      .where(
        and(
          eq(inventoryAlerts.vendorId, vendorId),
          eq(inventoryAlerts.isActive, true)
        )
      );

    return { success: true, alerts };
  } catch (error) {
    console.error("Error fetching inventory alerts:", error);
    return { success: false, error: "Failed to fetch inventory alerts", alerts: [] };
  }
}

/**
 * Deletes an inventory alert
 */
export async function deleteInventoryAlert(alertId: string, vendorId: string) {
  try {
    await db
      .delete(inventoryAlerts)
      .where(
        and(
          eq(inventoryAlerts.id, alertId),
          eq(inventoryAlerts.vendorId, vendorId)
        )
      );

    return { success: true };
  } catch (error) {
    console.error("Error deleting inventory alert:", error);
    return { success: false, error: "Failed to delete inventory alert" };
  }
}

/**
 * Updates vendor inventory settings
 */
export async function updateInventorySettings(
  vendorId: string,
  settings: InventorySettings
) {
  try {
    await db
      .update(vendors)
      .set({
        inventorySettings: settings,
        updatedAt: new Date(),
      })
      .where(eq(vendors.id, vendorId));

    return { success: true };
  } catch (error) {
    console.error("Error updating inventory settings:", error);
    return { success: false, error: "Failed to update inventory settings" };
  }
}

/**
 * Gets vendor inventory settings
 */
export async function getInventorySettings(vendorId: string) {
  try {
    const [vendor] = await db
      .select({ inventorySettings: vendors.inventorySettings })
      .from(vendors)
      .where(eq(vendors.id, vendorId))
      .limit(1);

    return {
      success: true,
      settings: (vendor?.inventorySettings as InventorySettings) || {},
    };
  } catch (error) {
    console.error("Error fetching inventory settings:", error);
    return {
      success: false,
      error: "Failed to fetch inventory settings",
      settings: {},
    };
  }
}

/**
 * Checks stock levels and triggers alerts
 * This is called by the cron job
 */
export async function checkInventoryLevels() {
  try {
    // Get all active alerts with their products
    const alertsToCheck = await db
      .select({
        alert: inventoryAlerts,
        product: products,
        vendor: vendors,
      })
      .from(inventoryAlerts)
      .leftJoin(products, eq(inventoryAlerts.productId, products.id))
      .leftJoin(vendors, eq(inventoryAlerts.vendorId, vendors.id))
      .where(eq(inventoryAlerts.isActive, true));

    const triggeredAlerts = [];

    for (const { alert, product, vendor } of alertsToCheck) {
      if (!product || !vendor) continue;

      const currentStock = product.stock || 0;
      let shouldTrigger = false;

      if (alert.alertType === "out_of_stock" && currentStock === 0) {
        shouldTrigger = true;
      } else if (alert.alertType === "low_stock" && currentStock <= alert.threshold && currentStock > 0) {
        shouldTrigger = true;
      }

      // Check if alert was triggered in last 24 hours to avoid spam
      const lastTriggered = alert.lastTriggeredAt;
      const hoursSinceLastTrigger = lastTriggered
        ? (Date.now() - new Date(lastTriggered).getTime()) / (1000 * 60 * 60)
        : 999;

      if (shouldTrigger && hoursSinceLastTrigger > 24) {
        // Send notification
        const settings = vendor.inventorySettings as InventorySettings || {};
        const preferences = settings.notificationPreferences || {};

        if (preferences.email &&
          ((alert.alertType === "low_stock" && preferences.lowStock) ||
            (alert.alertType === "out_of_stock" && preferences.outOfStock))) {

          await sendInventoryAlertEmail({
            vendorEmail: vendor.email,
            vendorName: vendor.businessName,
            productName: product.name,
            currentStock,
            threshold: alert.threshold,
            alertType: alert.alertType,
          });
        }

        // Update last triggered timestamp
        await db
          .update(inventoryAlerts)
          .set({ lastTriggeredAt: new Date() })
          .where(eq(inventoryAlerts.id, alert.id));

        triggeredAlerts.push({
          alertId: alert.id,
          productId: product.id,
          productName: product.name,
          currentStock,
        });

        // Auto-deactivate product if enabled and out of stock
        if (
          alert.alertType === "out_of_stock" &&
          settings.enableAutoDeactivate &&
          product.isActive
        ) {
          await db
            .update(products)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(products.id, product.id));
        }
      }
    }

    return {
      success: true,
      triggered: triggeredAlerts.length,
      alerts: triggeredAlerts,
    };
  } catch (error) {
    console.error("Error checking inventory levels:", error);
    return { success: false, error: "Failed to check inventory levels" };
  }
}

/**
 * Sends inventory alert email
 */
async function sendInventoryAlertEmail(params: {
  vendorEmail: string;
  vendorName: string;
  productName: string;
  currentStock: number;
  threshold: number;
  alertType: string;
}) {
  const { vendorEmail, vendorName, productName, currentStock, threshold, alertType } = params;

  const subject = alertType === "out_of_stock"
    ? `⚠️ Producto Agotado: ${productName}`
    : `📉 Stock Bajo: ${productName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">${alertType === "out_of_stock" ? "Producto Agotado" : "Alerta de Stock Bajo"}</h2>
      
      <p>Hola ${vendorName},</p>
      
      <p>Te informamos que el producto <strong>${productName}</strong> ${alertType === "out_of_stock"
      ? "está agotado."
      : `tiene stock bajo (${currentStock} unidades restantes, umbral: ${threshold}).`
    }</p>
      
      <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Stock actual:</strong> ${currentStock} unidades</p>
        ${alertType === "low_stock" ? `<p style="margin: 8px 0 0 0;"><strong>Umbral configurado:</strong> ${threshold} unidades</p>` : ""}
      </div>
      
      <p>Te recomendamos:</p>
      <ul>
        <li>Reabastecer el inventario lo antes posible</li>
        <li>Revisar tus alertas de inventario en el panel</li>
        ${alertType === "out_of_stock" ? "<li>El producto se ha desactivado automáticamente (si está configurado)</li>" : ""}
      </ul>
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/vendor/inventory" 
         style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
        Ver Panel de Inventario
      </a>
      
      <p style="color: #666; font-size: 12px; margin-top: 32px;">
        Este es un correo automático. Si no deseas recibir estas notificaciones, 
        puedes desactivarlas en la configuración de tu cuenta.
      </p>
    </div>
  `;

  await sendEmail({
    to: vendorEmail,
    subject,
    html,
  });
}

/**
 * Gets inventory overview for a vendor
 */
export async function getInventoryOverview(vendorId: string) {
  try {
    const settings = await getInventorySettings(vendorId);
    const threshold = (settings.settings as InventorySettings)?.lowStockThreshold || 10;

    // Get products grouped by stock status
    const allProducts = await db
      .select({
        id: products.id,
        name: products.name,
        stock: products.stock,
        isActive: products.isActive,
      })
      .from(products)
      .where(eq(products.vendorId, vendorId));

    const outOfStock = allProducts.filter((p) => (p.stock || 0) === 0);
    const lowStock = allProducts.filter(
      (p) => (p.stock || 0) > 0 && (p.stock || 0) <= threshold
    );
    const inStock = allProducts.filter((p) => (p.stock || 0) > threshold);

    return {
      success: true,
      overview: {
        total: allProducts.length,
        outOfStock: outOfStock.length,
        lowStock: lowStock.length,
        inStock: inStock.length,
        outOfStockProducts: outOfStock,
        lowStockProducts: lowStock,
      },
    };
  } catch (error) {
    console.error("Error fetching inventory overview:", error);
    return {
      success: false,
      error: "Failed to fetch inventory overview",
    };
  }
}
