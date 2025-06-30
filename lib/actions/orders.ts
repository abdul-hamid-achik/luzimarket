"use server";

import { db } from "@/db";
import { orders, orderItems, vendors, users, products } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { sendEmail } from "@/lib/email";

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

export interface OrderWithDetails {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  subtotal: string;
  tax: string;
  shipping: string;
  total: string;
  currency: string;
  shippingAddress: any;
  billingAddress: any;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  vendor: {
    id: string;
    businessName: string;
    email: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: string;
    total: string;
    product: {
      id: string;
      name: string;
      images: string[];
    };
  }>;
}

/**
 * Updates order status and sends appropriate notifications
 */
export async function updateOrderStatus(
  orderId: string, 
  newStatus: OrderStatus, 
  notes?: string,
  trackingNumber?: string
): Promise<boolean> {
  try {
    // Get current order with all details
    const order = await getOrderById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Update order status
    await db
      .update(orders)
      .set({
        status: newStatus,
        notes: notes || order.notes,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // Send notifications based on status change
    await handleStatusChangeNotifications(order, newStatus, trackingNumber);

    console.log(`Order ${orderId} status updated to ${newStatus}`);
    return true;
  } catch (error) {
    console.error("Error updating order status:", error);
    return false;
  }
}

/**
 * Gets order by ID with full details
 */
export async function getOrderById(orderId: string): Promise<OrderWithDetails | null> {
  try {
    const orderData = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        vendor: {
          columns: {
            id: true,
            businessName: true,
            email: true,
          }
        },
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          }
        },
        items: {
          with: {
            product: {
              columns: {
                id: true,
                name: true,
                images: true,
              }
            }
          }
        }
      }
    });

    if (!orderData) {
      return null;
    }

    return {
      ...orderData,
      status: orderData.status as OrderStatus,
    };
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}

/**
 * Gets orders for a specific vendor
 */
export async function getVendorOrders(vendorId: string, status?: OrderStatus): Promise<OrderWithDetails[]> {
  try {
    const conditions = [eq(orders.vendorId, vendorId)];
    if (status) {
      conditions.push(eq(orders.status, status));
    }

    const vendorOrders = await db.query.orders.findMany({
      where: and(...conditions),
      with: {
        vendor: {
          columns: {
            id: true,
            businessName: true,
            email: true,
          }
        },
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          }
        },
        items: {
          with: {
            product: {
              columns: {
                id: true,
                name: true,
                images: true,
              }
            }
          }
        }
      },
      orderBy: desc(orders.createdAt),
    });

    return vendorOrders.map((order: any) => ({
      ...order,
      status: order.status as OrderStatus,
    }));
  } catch (error) {
    console.error("Error fetching vendor orders:", error);
    return [];
  }
}

/**
 * Gets orders for a specific user
 */
export async function getUserOrders(userId: string): Promise<OrderWithDetails[]> {
  try {
    const userOrders = await db.query.orders.findMany({
      where: eq(orders.userId, userId),
      with: {
        vendor: {
          columns: {
            id: true,
            businessName: true,
            email: true,
          }
        },
        items: {
          with: {
            product: {
              columns: {
                id: true,
                name: true,
                images: true,
              }
            }
          }
        }
      },
      orderBy: desc(orders.createdAt),
    });

    return userOrders.map((order: any) => ({
      ...order,
      status: order.status as OrderStatus,
    }));
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
}

/**
 * Handles notifications when order status changes
 */
async function handleStatusChangeNotifications(
  order: OrderWithDetails, 
  newStatus: OrderStatus, 
  trackingNumber?: string
): Promise<void> {
  try {
    switch (newStatus) {
      case "processing":
        // Notify vendor of new order
        await sendVendorNewOrderNotification(order);
        // Notify customer of order confirmation
        if (order.user) {
          await sendCustomerOrderConfirmation(order);
        }
        break;

      case "shipped":
        // Notify customer that order has shipped
        if (order.user) {
          await sendCustomerShippingNotification(order, trackingNumber);
        }
        break;

      case "delivered":
        // Notify customer of delivery and request review
        if (order.user) {
          await sendCustomerDeliveryNotification(order);
        }
        break;

      case "cancelled":
        // Notify both vendor and customer
        await sendVendorOrderCancelledNotification(order);
        if (order.user) {
          await sendCustomerOrderCancelledNotification(order);
        }
        break;

      case "refunded":
        // Notify customer of refund
        if (order.user) {
          await sendCustomerRefundNotification(order);
        }
        break;
    }
  } catch (error) {
    console.error("Error sending status change notifications:", error);
  }
}

/**
 * Sends new order notification to vendor
 */
async function sendVendorNewOrderNotification(order: OrderWithDetails): Promise<void> {
  const itemsList = order.items.map(item => 
    `- ${item.product.name} (Cantidad: ${item.quantity}) - $${item.total} MXN`
  ).join('\n');

  const emailContent = `
    <h2>¡Nueva orden recibida!</h2>
    <p>Hola ${order.vendor.businessName},</p>
    <p>Has recibido una nueva orden en Luzimarket:</p>
    
    <h3>Detalles de la orden:</h3>
    <ul>
      <li><strong>Número de orden:</strong> ${order.orderNumber}</li>
      <li><strong>Total:</strong> $${order.total} ${order.currency}</li>
      <li><strong>Fecha:</strong> ${order.createdAt.toLocaleDateString('es-MX')}</li>
    </ul>
    
    <h3>Productos:</h3>
    <pre>${itemsList}</pre>
    
    <h3>Dirección de envío:</h3>
    <p>
      ${order.shippingAddress.street}<br>
      ${order.shippingAddress.city}, ${order.shippingAddress.state}<br>
      ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}
    </p>
    
    <p>Por favor, procesa esta orden lo antes posible.</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/vendor/orders/${order.id}">Ver orden completa</a></p>
  `;

  await sendEmail({
    to: order.vendor.email,
    subject: `Nueva orden #${order.orderNumber} - Luzimarket`,
    html: emailContent,
  });
}

/**
 * Sends order confirmation to customer
 */
async function sendCustomerOrderConfirmation(order: OrderWithDetails): Promise<void> {
  if (!order.user) return;

  const itemsList = order.items.map(item => 
    `- ${item.product.name} (Cantidad: ${item.quantity}) - $${item.total} MXN`
  ).join('\n');

  const emailContent = `
    <h2>¡Gracias por tu compra!</h2>
    <p>Hola ${order.user.name},</p>
    <p>Tu orden ha sido confirmada y está siendo procesada.</p>
    
    <h3>Detalles de tu orden:</h3>
    <ul>
      <li><strong>Número de orden:</strong> ${order.orderNumber}</li>
      <li><strong>Vendedor:</strong> ${order.vendor.businessName}</li>
      <li><strong>Subtotal:</strong> $${order.subtotal} ${order.currency}</li>
      <li><strong>Impuestos:</strong> $${order.tax} ${order.currency}</li>
      <li><strong>Envío:</strong> $${order.shipping} ${order.currency}</li>
      <li><strong>Total:</strong> $${order.total} ${order.currency}</li>
    </ul>
    
    <h3>Productos:</h3>
    <pre>${itemsList}</pre>
    
    <p>Te notificaremos cuando tu orden sea enviada.</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}">Rastrear mi orden</a></p>
  `;

  await sendEmail({
    to: order.user.email,
    subject: `Confirmación de orden #${order.orderNumber} - Luzimarket`,
    html: emailContent,
  });
}

/**
 * Sends shipping notification to customer
 */
async function sendCustomerShippingNotification(order: OrderWithDetails, trackingNumber?: string): Promise<void> {
  if (!order.user) return;

  const trackingInfo = trackingNumber 
    ? `<p><strong>Número de rastreo:</strong> ${trackingNumber}</p>`
    : '';

  const emailContent = `
    <h2>¡Tu orden ha sido enviada!</h2>
    <p>Hola ${order.user.name},</p>
    <p>Tu orden #${order.orderNumber} ha sido enviada por ${order.vendor.businessName}.</p>
    
    ${trackingInfo}
    
    <p>Recibirás tu pedido en los próximos 3-5 días hábiles.</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}">Rastrear mi orden</a></p>
  `;

  await sendEmail({
    to: order.user.email,
    subject: `Tu orden #${order.orderNumber} ha sido enviada - Luzimarket`,
    html: emailContent,
  });
}

/**
 * Sends delivery notification to customer
 */
async function sendCustomerDeliveryNotification(order: OrderWithDetails): Promise<void> {
  if (!order.user) return;

  const emailContent = `
    <h2>¡Tu orden ha sido entregada!</h2>
    <p>Hola ${order.user.name},</p>
    <p>Tu orden #${order.orderNumber} ha sido entregada exitosamente.</p>
    
    <p>Esperamos que disfrutes tus productos de ${order.vendor.businessName}.</p>
    
    <h3>¿Te gustó tu experiencia?</h3>
    <p>Nos encantaría conocer tu opinión sobre los productos que compraste.</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}/review">Escribir reseña</a></p>
  `;

  await sendEmail({
    to: order.user.email,
    subject: `Tu orden #${order.orderNumber} ha sido entregada - Luzimarket`,
    html: emailContent,
  });
}

/**
 * Sends cancellation notification to vendor
 */
async function sendVendorOrderCancelledNotification(order: OrderWithDetails): Promise<void> {
  const emailContent = `
    <h2>Orden cancelada</h2>
    <p>Hola ${order.vendor.businessName},</p>
    <p>La orden #${order.orderNumber} ha sido cancelada.</p>
    
    <p>Si ya habías preparado los productos, por favor detén el proceso de envío.</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/vendor/orders/${order.id}">Ver detalles</a></p>
  `;

  await sendEmail({
    to: order.vendor.email,
    subject: `Orden cancelada #${order.orderNumber} - Luzimarket`,
    html: emailContent,
  });
}

/**
 * Sends cancellation notification to customer
 */
async function sendCustomerOrderCancelledNotification(order: OrderWithDetails): Promise<void> {
  if (!order.user) return;

  const emailContent = `
    <h2>Orden cancelada</h2>
    <p>Hola ${order.user.name},</p>
    <p>Tu orden #${order.orderNumber} ha sido cancelada.</p>
    
    <p>Si se realizó algún cargo, será reembolsado en los próximos 3-5 días hábiles.</p>
    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
  `;

  await sendEmail({
    to: order.user.email,
    subject: `Orden cancelada #${order.orderNumber} - Luzimarket`,
    html: emailContent,
  });
}

/**
 * Sends refund notification to customer
 */
async function sendCustomerRefundNotification(order: OrderWithDetails): Promise<void> {
  if (!order.user) return;

  const emailContent = `
    <h2>Reembolso procesado</h2>
    <p>Hola ${order.user.name},</p>
    <p>El reembolso de tu orden #${order.orderNumber} ha sido procesado.</p>
    
    <p><strong>Monto reembolsado:</strong> $${order.total} ${order.currency}</p>
    <p>El reembolso aparecerá en tu método de pago original en los próximos 3-5 días hábiles.</p>
  `;

  await sendEmail({
    to: order.user.email,
    subject: `Reembolso procesado #${order.orderNumber} - Luzimarket`,
    html: emailContent,
  });
}

/**
 * Gets order statistics for admin dashboard
 */
export async function getOrderStatistics() {
  try {
    const stats = await db
      .select({
        totalOrders: sql<number>`count(*)`,
        pendingOrders: sql<number>`count(*) filter (where status = 'pending')`,
        processingOrders: sql<number>`count(*) filter (where status = 'processing')`,
        shippedOrders: sql<number>`count(*) filter (where status = 'shipped')`,
        deliveredOrders: sql<number>`count(*) filter (where status = 'delivered')`,
        cancelledOrders: sql<number>`count(*) filter (where status = 'cancelled')`,
        totalRevenue: sql<number>`sum(cast(total as decimal))`,
        averageOrderValue: sql<number>`avg(cast(total as decimal))`,
      })
      .from(orders);

    return stats[0] || {};
  } catch (error) {
    console.error("Error fetching order statistics:", error);
    return {};
  }
}