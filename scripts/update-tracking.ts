import { config } from "dotenv";
import { db } from "../db";
import { orders } from "../db/schema";
import { eq, or } from "drizzle-orm";

// Load environment variables
config({ path: ".env.local" });

const CARRIERS = ["fedex", "ups", "dhl", "estafeta", "correos-de-mexico"];

const LOCATIONS = [
  "Ciudad de México",
  "Guadalajara",
  "Monterrey",
  "Puebla",
  "Querétaro",
  "Tijuana",
  "León",
  "Mérida",
  "Cancún",
  "Oaxaca",
];

function generateTrackingNumber(carrier: string): string {
  const prefix = carrier.slice(0, 3).toUpperCase();
  const numbers = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join("");
  return `${prefix}${numbers}`;
}

function generateTrackingHistory(orderDate: Date, status: string) {
  const history = [];
  let currentDate = new Date(orderDate);

  // Order placed
  history.push({
    status: "Order Placed",
    location: "Online",
    timestamp: new Date(currentDate),
    description: "Su pedido ha sido recibido",
    coordinates: {
      lat: 19.4326 + (Math.random() - 0.5) * 0.1,
      lng: -99.1332 + (Math.random() - 0.5) * 0.1,
    },
  });

  // Payment confirmed (30 mins later)
  currentDate = new Date(currentDate.getTime() + 30 * 60 * 1000);
  history.push({
    status: "Payment Confirmed",
    location: "Sistema de Pago",
    timestamp: new Date(currentDate),
    description: "El pago ha sido procesado exitosamente",
    coordinates: {
      lat: 19.4326 + (Math.random() - 0.5) * 0.1,
      lng: -99.1332 + (Math.random() - 0.5) * 0.1,
    },
  });

  if (status === "shipped" || status === "delivered") {
    // Package picked up (1 day later)
    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    history.push({
      status: "Package Picked Up",
      location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)] + " Centro de Distribución",
      timestamp: new Date(currentDate),
      description: "El paquete ha sido recogido por el transportista",
      coordinates: {
        lat: 14 + Math.random() * 19,
        lng: -117 + Math.random() * 31,
      },
    });

    // In transit events (1-3 events)
    const transitCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < transitCount; i++) {
      currentDate = new Date(currentDate.getTime() + (8 + Math.random() * 16) * 60 * 60 * 1000);
      history.push({
        status: "In Transit",
        location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)] + " Hub",
        timestamp: new Date(currentDate),
        description: "El paquete está en tránsito",
        coordinates: {
          lat: 14 + Math.random() * 19,
          lng: -117 + Math.random() * 31,
        },
      });
    }

    // Out for delivery
    currentDate = new Date(currentDate.getTime() + 12 * 60 * 60 * 1000);
    history.push({
      status: "Out for Delivery",
      location: "Estación de Entrega Local",
      timestamp: new Date(currentDate),
      description: "El paquete está en camino para su entrega",
      coordinates: {
        lat: 19.4126 + (Math.random() - 0.5) * 0.05,
        lng: -99.1616 + (Math.random() - 0.5) * 0.05,
      },
    });

    if (status === "delivered") {
      // Delivered
      currentDate = new Date(currentDate.getTime() + 4 * 60 * 60 * 1000);
      history.push({
        status: "Delivered",
        location: "Dirección del Cliente",
        timestamp: new Date(currentDate),
        description: "El paquete ha sido entregado exitosamente",
        coordinates: {
          lat: 19.4126 + (Math.random() - 0.5) * 0.02,
          lng: -99.1616 + (Math.random() - 0.5) * 0.02,
        },
      });
    }
  }

  return history;
}

async function updateOrdersWithTracking() {
  console.log("🚚 Updating orders with tracking information...");

  try {
    // Get all shipped and delivered orders
    const ordersToUpdate = await db
      .select()
      .from(orders)
      .where(or(eq(orders.status, "shipped"), eq(orders.status, "delivered")));

    console.log(`Found ${ordersToUpdate.length} orders to update`);

    for (const order of ordersToUpdate) {
      const carrier = CARRIERS[Math.floor(Math.random() * CARRIERS.length)];
      const trackingNumber = generateTrackingNumber(carrier);
      const orderDate = new Date(order.createdAt!);
      const estimatedDeliveryDate = new Date(orderDate.getTime() + (1 + Math.random() * 4) * 24 * 60 * 60 * 1000);
      const trackingHistory = generateTrackingHistory(orderDate, order.status);

      const updateData: any = {
        trackingNumber,
        carrier,
        estimatedDeliveryDate,
        trackingHistory,
      };

      if (order.status === "delivered") {
        const lastEvent = trackingHistory[trackingHistory.length - 1];
        updateData.actualDeliveryDate = lastEvent.timestamp;
      }

      await db
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, order.id));

      console.log(`✅ Updated order ${order.orderNumber} with tracking ${trackingNumber}`);
    }

    console.log("🎉 All orders updated successfully!");
  } catch (error) {
    console.error("❌ Error updating orders:", error);
  }
}

// Run the update
updateOrdersWithTracking();