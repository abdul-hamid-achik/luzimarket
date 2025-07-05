"use server";

import { z } from "zod";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

const updateTrackingSchema = z.object({
  orderId: z.string().uuid(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  estimatedDeliveryDate: z.date().optional(),
  trackingEvent: z.object({
    status: z.string(),
    location: z.string(),
    description: z.string(),
    timestamp: z.date(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }).optional(),
});

export async function updateOrderTracking(data: z.infer<typeof updateTrackingSchema>) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate input
    const validatedData = updateTrackingSchema.parse(data);

    // Get current order
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, validatedData.orderId))
      .limit(1);

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Prepare update data
    const updateData: any = {};

    if (validatedData.trackingNumber !== undefined) {
      updateData.trackingNumber = validatedData.trackingNumber;
    }

    if (validatedData.carrier !== undefined) {
      updateData.carrier = validatedData.carrier;
    }

    if (validatedData.estimatedDeliveryDate !== undefined) {
      updateData.estimatedDeliveryDate = validatedData.estimatedDeliveryDate;
    }

    // Add new tracking event if provided
    if (validatedData.trackingEvent) {
      const currentHistory = order.trackingHistory || [];
      updateData.trackingHistory = [...currentHistory, validatedData.trackingEvent];
    }

    // Update order
    await db
      .update(orders)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, validatedData.orderId));

    return { success: true };
  } catch (error) {
    console.error("Error updating tracking:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update tracking" 
    };
  }
}

export async function markOrderAsDelivered(orderId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Update order status and add delivery tracking event
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    const currentHistory = order.trackingHistory || [];
    const deliveryEvent = {
      status: "Delivered",
      location: order.shippingAddress?.city || "Customer Address",
      description: "Package has been delivered",
      timestamp: new Date(),
      coordinates: {
        lat: 19.4126,
        lng: -99.1616,
      },
    };

    await db
      .update(orders)
      .set({
        status: "delivered",
        actualDeliveryDate: new Date(),
        trackingHistory: [...currentHistory, deliveryEvent],
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    return { success: true };
  } catch (error) {
    console.error("Error marking as delivered:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to mark as delivered" 
    };
  }
}