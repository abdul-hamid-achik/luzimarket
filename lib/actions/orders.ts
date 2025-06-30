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
    <h2>🎉 ¡Nueva orden recibida en Luzimarket!</h2>
    <p>Estimado(a) ${order.vendor.businessName},</p>
    <p>Has recibido una nueva orden en tu tienda de Luzimarket:</p>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>📋 Detalles de la orden:</h3>
      <ul style="list-style: none; padding: 0;">
        <li><strong>🔢 Número de orden:</strong> ${order.orderNumber}</li>
        <li><strong>💰 Total:</strong> $${Number(order.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${order.currency}</li>
        <li><strong>📅 Fecha:</strong> ${order.createdAt.toLocaleDateString('es-MX', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</li>
      </ul>
    </div>
    
    <h3>🛍️ Productos ordenados:</h3>
    <div style="background-color: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px;">
      <pre style="margin: 0; font-family: Arial, sans-serif;">${itemsList}</pre>
    </div>
    
    <h3>📍 Dirección de envío:</h3>
    <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
      <p style="margin: 0;">
        ${order.shippingAddress.street}<br>
        ${order.shippingAddress.city}, ${order.shippingAddress.state}<br>
        C.P. ${order.shippingAddress.postalCode}<br>
        ${order.shippingAddress.country}
      </p>
    </div>
    
    <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
      <p style="margin: 0;"><strong>⏰ Acción requerida:</strong> Por favor, procesa esta orden dentro de las próximas 24 horas para mantener una excelente experiencia del cliente.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/vendor/orders/${order.id}" 
         style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        📦 Ver orden completa
      </a>
    </div>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e9ecef;">
    <p style="font-size: 12px; color: #6c757d; text-align: center;">
      Este correo fue enviado automáticamente por Luzimarket. Si tienes alguna pregunta, contacta a nuestro equipo de soporte.
    </p>
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
    <h2>🎉 ¡Gracias por tu compra en Luzimarket!</h2>
    <p>Estimado(a) ${order.user.name},</p>
    <p>Tu orden ha sido confirmada exitosamente y está siendo procesada por nuestro vendedor. ¡Estamos emocionados de que hayas elegido productos únicos de México!</p>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>📋 Resumen de tu orden:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td><strong>🔢 Número de orden:</strong></td><td>${order.orderNumber}</td></tr>
        <tr><td><strong>🏪 Vendedor:</strong></td><td>${order.vendor.businessName}</td></tr>
        <tr><td><strong>💵 Subtotal:</strong></td><td>$${Number(order.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${order.currency}</td></tr>
        <tr><td><strong>🧾 IVA (16%):</strong></td><td>$${Number(order.tax).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${order.currency}</td></tr>
        <tr><td><strong>📦 Envío:</strong></td><td>$${Number(order.shipping).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${order.currency}</td></tr>
        <tr style="border-top: 2px solid #007bff; font-size: 18px; font-weight: bold;">
          <td><strong>💰 Total:</strong></td>
          <td><strong>$${Number(order.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${order.currency}</strong></td>
        </tr>
      </table>
    </div>
    
    <h3>🛍️ Productos ordenados:</h3>
    <div style="background-color: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px;">
      <pre style="margin: 0; font-family: Arial, sans-serif;">${itemsList}</pre>
    </div>
    
    <div style="margin: 30px 0; padding: 20px; background-color: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
      <p style="margin: 0;"><strong>📱 ¿Qué sigue?</strong></p>
      <p style="margin: 5px 0 0 0;">Te notificaremos por correo cuando tu orden sea enviada. Normalmente esto ocurre dentro de 1-2 días hábiles.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}" 
         style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
        📱 Rastrear mi orden
      </a>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/support" 
         style="background-color: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        💬 Contactar soporte
      </a>
    </div>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e9ecef;">
    <p style="font-size: 12px; color: #6c757d; text-align: center;">
      ¡Gracias por apoyar a los artesanos y emprendedores mexicanos! 🇲🇽<br>
      Este correo fue enviado automáticamente por Luzimarket.
    </p>
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
    <h2>📦 ¡Tu orden está en camino!</h2>
    <p>Estimado(a) ${order.user.name},</p>
    <p>¡Excelentes noticias! Tu orden #${order.orderNumber} ha sido enviada por <strong>${order.vendor.businessName}</strong> y está en camino hacia ti.</p>
    
    <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
      <h3>🚚 Información de envío:</h3>
      ${trackingInfo}
      <p style="margin: 10px 0 0 0;"><strong>⏰ Tiempo estimado de entrega:</strong> 3-5 días hábiles</p>
      <p style="margin: 5px 0 0 0;"><strong>📍 Destino:</strong> ${order.shippingAddress.city}, ${order.shippingAddress.state}</p>
    </div>
    
    <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
      <p style="margin: 0;"><strong>📱 Mantente informado:</strong></p>
      <p style="margin: 5px 0 0 0;">Te notificaremos tan pronto como tu paquete sea entregado. Mientras tanto, puedes rastrear tu orden en tiempo real.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}" 
         style="background-color: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
        📱 Rastrear mi orden
      </a>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/support" 
         style="background-color: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        💬 ¿Necesitas ayuda?
      </a>
    </div>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e9ecef;">
    <p style="font-size: 12px; color: #6c757d; text-align: center;">
      ¡Gracias por elegir productos mexicanos únicos! 🇲🇽<br>
      Luzimarket - Conectando México con el mundo
    </p>
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