import { db } from "@/db";
import { orders, shippingLabels, shippingMethods } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendEmail } from "@/lib/email";

export interface TrackingInfo {
    trackingNumber: string;
    carrier: string;
    trackingUrl?: string;
    estimatedDeliveryDate?: Date;
}

export interface ShippingLabelData {
    orderId: string;
    vendorId: string;
    carrier: string;
    serviceType: string;
    labelUrl: string;
    trackingNumber?: string;
    cost?: number;
    weight?: number;
    dimensions?: {
        length: number;
        width: number;
        height: number;
        unit: string;
    };
}

/**
 * Carrier tracking URL patterns
 */
const CARRIER_TRACKING_URLS: Record<string, string> = {
    fedex: "https://www.fedex.com/fedextrack/?trknbr={trackingNumber}",
    ups: "https://www.ups.com/track?loc=en_US&tracknum={trackingNumber}",
    dhl: "https://www.dhl.com/en/express/tracking.html?AWB={trackingNumber}",
    estafeta: "https://www.estafeta.com/Herramientas/Rastreo?wayBillType=0&wayBill={trackingNumber}",
    "correos-de-mexico": "https://www.correosdemexico.gob.mx/SSLServicios/RastreoEnvios/Rastreo.aspx?codigo={trackingNumber}",
    "99minutos": "https://99minutos.com/rastreo/{trackingNumber}",
};

/**
 * Validates tracking number format
 */
export function validateTrackingNumber(trackingNumber: string, carrier?: string): boolean {
    // Remove whitespace
    const cleaned = trackingNumber.trim().replace(/\s+/g, "");

    if (cleaned.length < 5) return false;

    // Basic validation - can be enhanced per carrier
    const patterns: Record<string, RegExp> = {
        fedex: /^[0-9]{12,22}$/,
        ups: /^1Z[A-Z0-9]{16}$/i,
        dhl: /^[0-9]{10,11}$/,
        estafeta: /^[0-9]{10,22}$/,
    };

    if (carrier && patterns[carrier.toLowerCase()]) {
        return patterns[carrier.toLowerCase()].test(cleaned);
    }

    // Generic validation if carrier not specified or not in patterns
    return /^[A-Z0-9]{5,30}$/i.test(cleaned);
}

/**
 * Generates tracking URL for a carrier
 */
export function generateTrackingUrl(trackingNumber: string, carrier: string): string {
    const pattern = CARRIER_TRACKING_URLS[carrier.toLowerCase()];

    if (!pattern) {
        // Default fallback
        return `https://www.google.com/search?q=${encodeURIComponent(carrier + " tracking " + trackingNumber)}`;
    }

    return pattern.replace("{trackingNumber}", trackingNumber);
}

/**
 * Adds tracking information to an order
 */
export async function addTrackingToOrder(
    orderId: string,
    vendorId: string,
    trackingInfo: TrackingInfo
) {
    try {
        // Validate tracking number
        if (!validateTrackingNumber(trackingInfo.trackingNumber, trackingInfo.carrier)) {
            return {
                success: false,
                error: "Invalid tracking number format",
            };
        }

        // Verify vendor owns this order
        const [order] = await db
            .select()
            .from(orders)
            .where(and(eq(orders.id, orderId), eq(orders.vendorId, vendorId)))
            .limit(1);

        if (!order) {
            return {
                success: false,
                error: "Order not found or unauthorized",
            };
        }

        // Generate tracking URL if not provided
        const trackingUrl = trackingInfo.trackingUrl ||
            generateTrackingUrl(trackingInfo.trackingNumber, trackingInfo.carrier);

        // Update order with tracking info
        const [updatedOrder] = await db
            .update(orders)
            .set({
                trackingNumber: trackingInfo.trackingNumber,
                carrier: trackingInfo.carrier,
                trackingUrl,
                shippedAt: new Date(),
                status: "shipped",
                estimatedDeliveryDate: trackingInfo.estimatedDeliveryDate,
                updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId))
            .returning();

        // Send shipping notification email to customer
        await sendShippingNotificationEmail(updatedOrder);

        return {
            success: true,
            order: updatedOrder,
            trackingUrl,
        };
    } catch (error) {
        console.error("Error adding tracking to order:", error);
        return {
            success: false,
            error: "Failed to add tracking information",
        };
    }
}

/**
 * Creates a shipping label record
 */
export async function createShippingLabel(labelData: ShippingLabelData) {
    try {
        const [label] = await db
            .insert(shippingLabels)
            .values({
                orderId: labelData.orderId,
                vendorId: labelData.vendorId,
                carrier: labelData.carrier,
                serviceType: labelData.serviceType,
                labelUrl: labelData.labelUrl,
                trackingNumber: labelData.trackingNumber,
                cost: labelData.cost?.toString(),
                weight: labelData.weight,
                dimensions: labelData.dimensions,
            })
            .returning();

        return {
            success: true,
            label,
        };
    } catch (error) {
        console.error("Error creating shipping label:", error);
        return {
            success: false,
            error: "Failed to create shipping label",
        };
    }
}

/**
 * Gets shipping labels for an order
 */
export async function getShippingLabels(orderId: string, vendorId: string) {
    try {
        const labels = await db
            .select()
            .from(shippingLabels)
            .where(
                and(
                    eq(shippingLabels.orderId, orderId),
                    eq(shippingLabels.vendorId, vendorId)
                )
            );

        return {
            success: true,
            labels,
        };
    } catch (error) {
        console.error("Error fetching shipping labels:", error);
        return {
            success: false,
            error: "Failed to fetch shipping labels",
            labels: [],
        };
    }
}

/**
 * Gets available shipping carriers
 */
export async function getAvailableCarriers() {
    try {
        const methods = await db
            .select({
                carrier: shippingMethods.carrier,
                name: shippingMethods.name,
                code: shippingMethods.code,
            })
            .from(shippingMethods)
            .where(eq(shippingMethods.isActive, true));

        // Group by carrier to get unique carriers
        const uniqueCarriers = Array.from(
            new Map(methods.map(m => [m.carrier, m])).values()
        );

        return {
            success: true,
            carriers: uniqueCarriers,
        };
    } catch (error) {
        console.error("Error fetching carriers:", error);
        return {
            success: false,
            error: "Failed to fetch carriers",
            carriers: [],
        };
    }
}

/**
 * Updates order tracking history
 */
export async function updateTrackingHistory(
    orderId: string,
    trackingUpdate: {
        status: string;
        location: string;
        description: string;
        coordinates?: { lat: number; lng: number };
    }
) {
    try {
        const [order] = await db
            .select()
            .from(orders)
            .where(eq(orders.id, orderId))
            .limit(1);

        if (!order) {
            return {
                success: false,
                error: "Order not found",
            };
        }

        const currentHistory = (order.trackingHistory as any[]) || [];
        const newHistory = [
            ...currentHistory,
            {
                ...trackingUpdate,
                timestamp: new Date(),
            },
        ];

        await db
            .update(orders)
            .set({
                trackingHistory: newHistory,
                updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

        // If status is "delivered", update order status and delivery date
        if (trackingUpdate.status.toLowerCase().includes("delivered")) {
            await db
                .update(orders)
                .set({
                    status: "delivered",
                    actualDeliveryDate: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(orders.id, orderId));
        }

        return {
            success: true,
            history: newHistory,
        };
    } catch (error) {
        console.error("Error updating tracking history:", error);
        return {
            success: false,
            error: "Failed to update tracking history",
        };
    }
}

/**
 * Sends shipping notification email to customer
 */
async function sendShippingNotificationEmail(order: any) {
    try {
        const customerEmail = order.guestEmail || order.userId; // Would need to fetch user email if userId

        if (!customerEmail || !customerEmail.includes("@")) {
            console.log("No valid customer email for shipping notification");
            return;
        }

        const subject = `📦 Tu pedido #${order.orderNumber} ha sido enviado - Luzimarket`;

        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">📦 ¡Tu pedido está en camino!</h2>
        
        <p>Hola,</p>
        
        <p>Excelentes noticias! Tu pedido <strong>#${order.orderNumber}</strong> ha sido enviado y está en camino.</p>
        
        <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Número de rastreo:</strong> ${order.trackingNumber}</p>
          <p style="margin: 8px 0 0 0;"><strong>Transportista:</strong> ${order.carrier.toUpperCase()}</p>
          ${order.estimatedDeliveryDate ? `<p style="margin: 8px 0 0 0;"><strong>Entrega estimada:</strong> ${new Date(order.estimatedDeliveryDate).toLocaleDateString("es-MX")}</p>` : ""}
        </div>
        
        <p>Puedes rastrear tu paquete en tiempo real:</p>
        
        <a href="${order.trackingUrl}" 
           style="display: inline-block; background-color: #059669; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          📱 Rastrear mi pedido
        </a>
        
        <p style="margin-top: 32px;">Te notificaremos cuando tu paquete esté cerca de ser entregado.</p>
        
        <p style="color: #666; font-size: 12px; margin-top: 32px;">
          Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos.
        </p>
      </div>
    `;

        await sendEmail({
            to: customerEmail,
            subject,
            html,
        });
    } catch (error) {
        console.error("Error sending shipping notification email:", error);
        // Don't throw error - email failure shouldn't block the tracking update
    }
}

/**
 * Gets tracking information for an order (public - for customers)
 */
export async function getOrderTracking(orderNumber: string) {
    try {
        const [order] = await db
            .select({
                id: orders.id,
                orderNumber: orders.orderNumber,
                status: orders.status,
                trackingNumber: orders.trackingNumber,
                carrier: orders.carrier,
                trackingUrl: orders.trackingUrl,
                shippedAt: orders.shippedAt,
                estimatedDeliveryDate: orders.estimatedDeliveryDate,
                actualDeliveryDate: orders.actualDeliveryDate,
                trackingHistory: orders.trackingHistory,
                shippingAddress: orders.shippingAddress,
            })
            .from(orders)
            .where(eq(orders.orderNumber, orderNumber))
            .limit(1);

        if (!order) {
            return {
                success: false,
                error: "Order not found",
            };
        }

        return {
            success: true,
            tracking: order,
        };
    } catch (error) {
        console.error("Error fetching order tracking:", error);
        return {
            success: false,
            error: "Failed to fetch tracking information",
        };
    }
}

