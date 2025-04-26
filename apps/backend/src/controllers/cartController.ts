import { Request, Response } from "express";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { carts, cartItems, products, productVariants } from "../schema";
import { AuthRequest } from "../middleware/auth";

export const getCart = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  let cart = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
  if (cart.length === 0) {
    const [newCart] = await db.insert(carts).values({ userId }).returning();
    cart = [newCart];
  }
  const items = await db
    .select({
      id: cartItems.id,
      productId: cartItems.productId,
      variantId: cartItems.variantId,
      quantity: cartItems.quantity,
      productName: products.name,
      productPrice: products.price,
      variantName: productVariants.name,
      additionalPrice: productVariants.additionalPrice,
    })
    .from(cartItems)
    .leftJoin(products, eq(products.id, cartItems.productId))
    .leftJoin(productVariants, eq(productVariants.id, cartItems.variantId))
    .where(eq(cartItems.cartId, cart[0].id));
  res.json({ cart: cart[0], items });
};

export const addItemToCart = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  let cart = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
  if (cart.length === 0) {
    const [newCart] = await db.insert(carts).values({ userId }).returning();
    cart = [newCart];
  }
  const { productId, variantId, quantity } = req.body;
  const [item] = await db
    .insert(cartItems)
    .values({ cartId: cart[0].id, productId, variantId: variantId || null, quantity })
    .returning();
  res.status(201).json(item);
};

export const updateCartItem = async (req: AuthRequest, res: Response) => {
  const itemId = Number(req.params.itemId);
  const { quantity } = req.body;
  const updated = await db
    .update(cartItems)
    .set({ quantity })
    .where(eq(cartItems.id, itemId))
    .returning();
  if (updated.length === 0) {
    return res.status(404).json({ error: "Cart item not found" });
  }
  res.json(updated[0]);
};

export const removeCartItem = async (req: AuthRequest, res: Response) => {
  const itemId = Number(req.params.itemId);
  await db.delete(cartItems).where(eq(cartItems.id, itemId));
  res.json({ success: true });
};

export const clearCart = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  let cart = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
  if (cart.length > 0) {
    await db.delete(cartItems).where(eq(cartItems.cartId, cart[0].id));
  }
  res.json({ success: true });
};