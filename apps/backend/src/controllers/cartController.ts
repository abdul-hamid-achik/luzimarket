import { Response } from "express";
import { db } from "@/db";
import { eq, isNull, and } from "drizzle-orm";
import { carts, cartItems } from "@/schema";
import { AuthRequest } from "@/middleware/auth";
import { StatusCodes } from "http-status-codes";
import strapi from '@/utils/strapiClient';

export const getCart = async (req: AuthRequest, res: Response) => {
  const { id: userId, guestId } = req.user ?? {};
  if (!userId && !guestId) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Unauthorized" });
  }
  const filter = userId ? eq(carts.userId, userId) : eq(carts.guestId, guestId!);
  let cart = await db.select().from(carts).where(filter).limit(1);
  if (cart.length === 0) {
    const values: any = {};
    if (userId) values.userId = userId;
    if (guestId) values.guestId = guestId;
    const [newCart] = await db.insert(carts).values(values).returning();
    cart = [newCart];
  }
  const itemsRaw = await db.select().from(cartItems).where(eq(cartItems.cartId, cart[0].id));
  try {
    const items = await Promise.all(itemsRaw.map(async (item: any) => {
      try {
        const { data: prodResp } = await strapi.get(`/api/products/${item.productId}?populate=variants`);
        const prod = prodResp.data;
        const variant = item.variantId
          ? prod.attributes.variants?.data.find((v: any) => v.id === item.variantId)
          : null;
        return {
          id: item.id,
          quantity: item.quantity,
          productId: prod.id,
          productName: prod.attributes.name,
          productPrice: parseFloat(prod.attributes.price),
          variantId: variant?.id,
          variantName: variant?.attributes.name,
          additionalPrice: variant ? parseFloat(variant.attributes.additionalPrice) : 0,
        };
      } catch (err: any) {
        // If product not found, skip it and remove from cart
        if (err.message.includes('404')) {
          await db.delete(cartItems).where(eq(cartItems.id, item.id));
          return null;
        }
        throw err;
      }
    }));
    // Filter out null items (products that were not found and removed)
    const validItems = items.filter(item => item !== null);
    return res.json({ cart: cart[0], items: validItems });
  } catch (err: any) {
    console.error('Error fetching product details for cart items', err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};

export const addItemToCart = async (req: AuthRequest, res: Response) => {
  const { id: userId, guestId } = req.user ?? {};
  if (!userId && !guestId) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Unauthorized" });
  }
  const filter = userId ? eq(carts.userId, userId) : eq(carts.guestId, guestId!);
  let cart = await db.select().from(carts).where(filter).limit(1);
  if (cart.length === 0) {
    const values: any = {};
    if (userId) values.userId = userId;
    if (guestId) values.guestId = guestId;
    const [newCart] = await db.insert(carts).values(values).returning();
    cart = [newCart];
  }
  const { productId, variantId, quantity } = req.body;
  // Check if item already exists in cart (same product and variant)
  // Build where clause for Drizzle ORM
  const whereClause = [
    eq(cartItems.cartId, cart[0].id),
    eq(cartItems.productId, productId),
  ];
  if (variantId) {
    whereClause.push(eq(cartItems.variantId, variantId));
  } else {
    whereClause.push(isNull(cartItems.variantId));
  }
  const existing = await db
    .select()
    .from(cartItems)
    .where(and(...whereClause));
  if (existing.length > 0) {
    // Increment quantity
    const newQuantity = existing[0].quantity + (quantity || 1);
    const [updated] = await db
      .update(cartItems)
      .set({ quantity: newQuantity })
      .where(eq(cartItems.id, existing[0].id))
      .returning();
    return res.json(updated);
  }
  // Insert new item
  const [item] = await db
    .insert(cartItems)
    .values({ cartId: cart[0].id, productId, variantId: variantId || null, quantity: quantity || 1 })
    .returning();
  res.status(201).json(item);
};

export const updateCartItem = async (req: AuthRequest, res: Response) => {
  const itemId = req.params.itemId;
  const { quantity } = req.body;
  const updated = await db
    .update(cartItems)
    .set({ quantity })
    .where(eq(cartItems.id, itemId))
    .returning();
  if (updated.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: "Cart item not found" });
  }
  res.json(updated[0]);
};

export const removeCartItem = async (req: AuthRequest, res: Response) => {
  const itemId = req.params.itemId;
  await db.delete(cartItems).where(eq(cartItems.id, itemId));
  res.json({ success: true });
};

export const clearCart = async (req: AuthRequest, res: Response) => {
  const { id: userId, guestId } = req.user ?? {};
  if (!userId && !guestId) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Unauthorized" });
  }
  const filter = userId ? eq(carts.userId, userId) : eq(carts.guestId, guestId!);
  const cart = await db.select().from(carts).where(filter).limit(1);
  if (cart.length > 0) {
    await db.delete(cartItems).where(eq(cartItems.cartId, cart[0].id));
  }
  res.json({ success: true });
};