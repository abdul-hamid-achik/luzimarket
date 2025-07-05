"use server";

import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";

const convertGuestOrdersSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
});

export async function convertGuestOrdersToUser(data: z.infer<typeof convertGuestOrdersSchema>) {
  try {
    const validatedData = convertGuestOrdersSchema.parse(data);

    // Find all guest orders with matching email
    const guestOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.guestEmail, validatedData.email),
        isNull(orders.userId)
      ),
    });

    if (guestOrders.length === 0) {
      return {
        success: true,
        convertedCount: 0,
        message: "No guest orders found for this email",
      };
    }

    // Update all guest orders to link them to the user
    const orderIds = guestOrders.map(order => order.id);
    
    await db
      .update(orders)
      .set({
        userId: validatedData.userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(orders.guestEmail, validatedData.email),
          isNull(orders.userId)
        )
      );

    return {
      success: true,
      convertedCount: guestOrders.length,
      orderIds,
      message: `Successfully converted ${guestOrders.length} guest orders`,
    };
  } catch (error) {
    console.error("Error converting guest orders:", error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid data provided",
        details: error.errors,
      };
    }

    return {
      success: false,
      error: "Failed to convert guest orders",
    };
  }
}

const lookupGuestOrderSchema = z.object({
  email: z.string().email(),
  orderNumber: z.string().min(1),
});

export async function lookupGuestOrder(data: z.infer<typeof lookupGuestOrderSchema>) {
  try {
    const validatedData = lookupGuestOrderSchema.parse(data);

    // Find order by email and order number
    const order = await db.query.orders.findFirst({
      where: and(
        eq(orders.orderNumber, validatedData.orderNumber),
        eq(orders.guestEmail, validatedData.email)
      ),
      with: {
        items: {
          with: {
            product: true,
          },
        },
        vendor: true,
      },
    });

    if (!order) {
      return {
        success: false,
        error: "Order not found",
      };
    }

    return {
      success: true,
      order,
    };
  } catch (error) {
    console.error("Error looking up guest order:", error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid data provided",
        details: error.errors,
      };
    }

    return {
      success: false,
      error: "Failed to lookup order",
    };
  }
}