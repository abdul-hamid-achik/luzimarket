"use server";

import {
    updateOrderStatus,
    getOrderById,
    getUserOrders,
    getVendorOrders,
    getRelatedOrders,
    getOrderStatistics,
    getCurrentVendorOrders,
    type OrderWithDetails,
    type OrderStatus,
} from "@/lib/actions/orders";
import {
    sendOrderConfirmationEmail,
    sendVendorNewOrderNotificationEmail,
    sendShippingNotificationEmail,
    sendDeliveryNotificationEmail,
    sendOrderCancelledNotificationEmail,
    sendRefundNotificationEmail,
} from "@/lib/services/email-service";
import { db } from "@/db";
import { orders, orderItems, products, vendors, users } from "@/db/schema";
import { eq, and, desc, sql, ilike, gte, lte, or } from "drizzle-orm";
import { ordersQuerySchema } from "@/lib/services/validation-service";
import { logOrderEvent } from "@/lib/audit-helpers";

/**
 * OrderService
 * Centralized service for order operations
 * Consolidates order management from routes and actions
 * Integrates email notifications
 */

// ============================================================================
// RE-EXPORT CORE ORDER FUNCTIONS FROM ACTIONS
// ============================================================================

export {
    updateOrderStatus,
    getOrderById,
    getUserOrders,
    getVendorOrders,
    getRelatedOrders,
    getOrderStatistics,
    getCurrentVendorOrders,
    type OrderWithDetails,
    type OrderStatus,
};

// ============================================================================
// ENHANCED ORDER OPERATIONS WITH EMAIL NOTIFICATIONS
// ============================================================================

/**
 * Update order status and send appropriate notifications
 */
export async function updateOrderStatusWithNotifications(
    orderId: string,
    newStatus: OrderStatus,
    notes?: string,
    trackingNumber?: string,
    carrier?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Get order details before update
        const order = await getOrderById(orderId);

        if (!order) {
            return { success: false, error: "Orden no encontrada" };
        }

        // Update the status
        const success = await updateOrderStatus(orderId, newStatus, notes, trackingNumber);

        if (!success) {
            return { success: false, error: "Error al actualizar el estado de la orden" };
        }

        // Send notifications based on new status
        await sendOrderNotifications(order, newStatus, trackingNumber);

        return { success: true };
    } catch (error) {
        console.error("Error updating order status with notifications:", error);
        return { success: false, error: "Error al actualizar el estado de la orden" };
    }
}

/**
 * Send notifications based on order status
 */
async function sendOrderNotifications(
  order: any, // Using any since we need guestEmail/guestName which aren't in OrderWithDetails
  newStatus: OrderStatus,
  trackingNumber?: string
): Promise<void> {
  try {
    const customerEmail = order.user?.email || order.guestEmail || '';
    const customerName = order.user?.name || order.guestName || 'Cliente';

        const orderData = {
            orderNumber: order.orderNumber,
            customerName,
            customerEmail,
            vendorName: order.vendor.businessName,
            items: order.items.map((item: any) => ({
                name: item.product.name,
                quantity: item.quantity,
                price: parseFloat(item.price),
            })),
            subtotal: parseFloat(order.subtotal),
            tax: parseFloat(order.tax),
            shipping: parseFloat(order.shipping),
            total: parseFloat(order.total),
            currency: order.currency,
            shippingAddress: order.shippingAddress,
        };

        switch (newStatus) {
            case "processing":
                // Send customer confirmation
                if (customerEmail) {
                    await sendOrderConfirmationEmail(orderData);
                }
                // Notify vendor
                await sendVendorNewOrderNotificationEmail({
                    ...orderData,
                    vendorEmail: order.vendor.email,
                });
                break;

            case "shipped":
                if (customerEmail) {
                    await sendShippingNotificationEmail({
                        ...orderData,
                        trackingNumber,
                    });
                }
                break;

            case "delivered":
                if (customerEmail) {
                    await sendDeliveryNotificationEmail(orderData);
                }
                break;

            case "cancelled":
                if (customerEmail) {
                    await sendOrderCancelledNotificationEmail(orderData);
                }
                break;

            case "refunded":
                if (customerEmail) {
                    await sendRefundNotificationEmail(orderData);
                }
                break;
        }
    } catch (error) {
        console.error("Error sending order notifications:", error);
        // Don't throw - notification failures shouldn't break order updates
    }
}

/**
 * Get order by order number
 */
export async function getOrderByNumber(
  orderNumber: string,
  userId?: string
): Promise<{ success: boolean; order?: any; relatedOrders?: any[]; error?: string }> {
  try {
    // Use getOrderById from actions for consistency
    // First find the order
    const orderLookup = await db
      .select({ id: orders.id })
      .from(orders)
      .where(
        userId 
          ? and(eq(orders.orderNumber, orderNumber), eq(orders.userId, userId))
          : eq(orders.orderNumber, orderNumber)
      )
      .limit(1);

    if (!orderLookup || orderLookup.length === 0) {
      return { success: false, error: "Orden no encontrada" };
    }

    const order = await getOrderById(orderLookup[0].id);
    
    if (!order) {
      return { success: false, error: "Orden no encontrada" };
    }

    // Get related orders if part of multi-vendor
    let relatedOrders: any[] = [];
    if ((order as any).orderGroupId) {
      relatedOrders = await getRelatedOrders((order as any).orderGroupId);
    }

    return {
      success: true,
      order,
      relatedOrders: relatedOrders.length > 1 ? relatedOrders : [],
    };
  } catch (error) {
    console.error("Error getting order by number:", error);
    return { success: false, error: "Error al obtener la orden" };
  }
}

/**
 * List orders with filtering and pagination
 */
export async function listOrders(filters: {
    userId?: string;
    vendorId?: string;
    search?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}) {
    try {
        const validated = ordersQuerySchema.parse(filters);
        const { search, status, from, to, page = 1, limit = 10 } = validated;
        const { userId, vendorId } = filters;
        const offset = (page - 1) * limit;

        // Build where conditions
        const whereConditions: any[] = [];

        // User or vendor filter
        if (userId) {
            whereConditions.push(
                or(
                    eq(orders.userId, userId),
                    eq(orders.guestEmail, filters.userId || '')
                )
            );
        }

        if (vendorId) {
            whereConditions.push(eq(orders.vendorId, vendorId));
        }

        // Search filter
        if (search) {
            whereConditions.push(
                or(
                    ilike(orders.orderNumber, `%${search}%`),
                    ilike(orders.guestName, `%${search}%`),
                    ilike(orders.guestEmail, `%${search}%`)
                )
            );
        }

        // Status filter
        if (status && status !== 'all') {
            whereConditions.push(eq(orders.status, status));
        }

        // Date filters
        if (from) {
            whereConditions.push(gte(orders.createdAt, new Date(from)));
        }

        if (to) {
            whereConditions.push(lte(orders.createdAt, new Date(to)));
        }

        // Get orders
        const ordersList = await db
            .select({
                id: orders.id,
                orderNumber: orders.orderNumber,
                total: orders.total,
                subtotal: orders.subtotal,
                tax: orders.tax,
                shipping: orders.shipping,
                status: orders.status,
                paymentStatus: orders.paymentStatus,
                createdAt: orders.createdAt,
                vendor: {
                    businessName: vendors.businessName,
                },
            })
            .from(orders)
            .leftJoin(vendors, eq(orders.vendorId, vendors.id))
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .orderBy(desc(orders.createdAt))
            .limit(limit)
            .offset(offset);

        // Get items for each order
        const ordersWithItems = await Promise.all(
            ordersList.map(async (order) => {
                const items = await db
                    .select({
                        id: orderItems.id,
                        quantity: orderItems.quantity,
                        price: orderItems.price,
                        product: {
                            name: products.name,
                            images: products.images,
                        },
                    })
                    .from(orderItems)
                    .leftJoin(products, eq(orderItems.productId, products.id))
                    .where(eq(orderItems.orderId, order.id));

                return {
                    ...order,
                    items: items.map(item => ({
                        id: item.id,
                        quantity: item.quantity,
                        price: item.price,
                        product: {
                            name: item.product?.name || 'Producto eliminado',
                            images: item.product?.images || [],
                        },
                    })),
                };
            })
        );

        // Get total count
        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(orders)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

        const total = Number(countResult[0]?.count || 0);

        return {
            success: true,
            orders: ordersWithItems,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error: any) {
        console.error("Error listing orders:", error);
        return {
            success: false,
            error: error.message || "Error al listar órdenes",
            orders: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        };
    }
}

/**
 * Cancel an order
 */
export async function cancelOrder(
  orderId: string,
  reason: string,
  cancelledBy?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const order = await getOrderById(orderId);
    
    if (!order) {
      return { success: false, error: "Orden no encontrada" };
    }

    // Check if order can be cancelled
    if (['shipped', 'delivered', 'cancelled', 'refunded'].includes(order.status)) {
      return {
        success: false,
        error: `No se puede cancelar una orden con estado: ${order.status}`,
      };
    }

    // Update order status
    await db
      .update(orders)
      .set({
        status: 'cancelled',
        cancellationStatus: 'approved',
        cancellationReason: reason,
        cancelledBy,
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // Log cancellation
    await logOrderEvent({
      action: 'cancelled',
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: order.user?.id || null,
      userEmail: order.user?.email,
      vendorId: order.vendor.id,
      details: {
        reason,
        cancelledBy,
      },
    });

    // Get full order data with guest fields
    const fullOrder: any = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        vendor: true,
        user: true,
        items: {
          with: {
            product: true,
          },
        },
      },
    });

    // Send notification
    const customerEmail = fullOrder.user?.email || fullOrder.guestEmail || '';
    if (customerEmail) {
      await sendOrderCancelledNotificationEmail({
        orderNumber: fullOrder.orderNumber,
        customerName: fullOrder.user?.name || fullOrder.guestName || 'Cliente',
        customerEmail,
        vendorName: fullOrder.vendor.businessName,
        items: fullOrder.items.map((item: any) => ({
          name: item.product?.name || 'Producto',
          quantity: item.quantity,
          price: parseFloat(item.price),
        })),
        subtotal: parseFloat(fullOrder.subtotal),
        tax: parseFloat(fullOrder.tax),
        shipping: parseFloat(fullOrder.shipping),
        total: parseFloat(fullOrder.total),
        currency: fullOrder.currency,
        shippingAddress: fullOrder.shippingAddress,
      }, reason);
    }

    return { success: true };
  } catch (error) {
    console.error("Error cancelling order:", error);
    return { success: false, error: "Error al cancelar la orden" };
  }
}

/**
 * Add tracking information to an order
 */
export async function addTrackingInfo(
    orderId: string,
    carrier: string,
    trackingNumber: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await db
            .update(orders)
            .set({
                carrier,
                trackingNumber,
                status: 'shipped',
                updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

        // Get order and send notification
        const order = await getOrderById(orderId);
        if (order) {
            await sendOrderNotifications(order, 'shipped', trackingNumber);
        }

        return { success: true };
    } catch (error) {
        console.error("Error adding tracking info:", error);
        return { success: false, error: "Error al agregar información de envío" };
    }
}

