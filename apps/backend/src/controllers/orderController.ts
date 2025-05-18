import Stripe from "stripe";
import { Response } from "express";
import { db } from "@/db";
import { eq, and } from "drizzle-orm";
import {
  carts,
  cartItems,
  orders,
  orderItems,
  coupons,
} from "@/schema";
import { AuthRequest } from "@/middleware/auth";
import dotenv from "dotenv";
import { StatusCodes } from "http-status-codes";
import strapi from '@/utils/strapiClient';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2022-11-15",
});

export const createOrder = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Unauthorized" });
  }
  const cart = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
  if (!cart[0]) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: "Cart is empty" });
  }
  const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cart[0].id));
  if (items.length === 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: "Cart is empty" });
  }

  let total = 0;
  const itemDetails = await Promise.all(
    items.map(async (item: any) => {
      const { data: prodResp } = await strapi.get(`/api/products/${item.productId}?populate=variants`);
      const prod = prodResp.data;
      const basePrice = parseFloat(prod.attributes.price);
      const variantData = item.variantId
        ? prod.attributes.variants?.data.find((v: any) => v.id === item.variantId)
        : null;
      const additionalPrice = variantData ? parseFloat(variantData.attributes.additionalPrice) : 0;
      const price = basePrice + additionalPrice;
      total += price * item.quantity;
      return { ...item, price };
    })
  );

  if (req.body.couponCode) {
    const couponRec = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, req.body.couponCode))
      .limit(1);
    const coupon = couponRec[0];
    if (!coupon) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid coupon" });
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Coupon expired" });
    }
    total = (total * (100 - coupon.discountPercent)) / 100;
  }

  if (req.body.stripePaymentMethodId) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: "usd",
        payment_method: req.body.stripePaymentMethodId,
        confirm: true,
      });
      if (paymentIntent.status !== "succeeded") {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "Payment failed" });
      }
    } catch (err) {
      const error = err as { message?: string };
      return res.status(StatusCodes.BAD_REQUEST).json({ error: error.message || "Payment failed" });
    }
  }

  const [order] = await db
    .insert(orders)
    .values({ userId, total: total.toString() })
    .returning();

  for (const item of itemDetails) {
    await db.insert(orderItems).values({
      orderId: order.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      price: item.price.toString(),
    });
  }

  await db.delete(cartItems).where(eq(cartItems.cartId, cart[0].id));

  res.status(StatusCodes.CREATED).json(order);
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Unauthorized" });
  }
  const userOrders = await db.select().from(orders).where(eq(orders.userId, userId));
  res.json(userOrders);
};

export const getOrder = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Unauthorized" });
  }
  const orderIdParam = req.params.id;
  const orderId = parseInt(orderIdParam, 10);
  if (isNaN(orderId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid order id" });
  }
  const orderRec = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);
  const order = orderRec[0];
  if (!order) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: "Order not found" });
  }
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  res.json({ order, items });
};