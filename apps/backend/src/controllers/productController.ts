import { Request, Response } from "express";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { products } from "@/schema";

export const createProduct = async (req: Request, res: Response) => {
  try {
    const [product] = await db
      .insert(products)
      .values(req.body)
      .returning();
    res.status(201).json(product);
  } catch (err) {
    const error = err as { message?: string };
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  const prods = await db.select().from(products);
  res.json(prods);
};

export const getProduct = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const prod = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (!prod[0]) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(prod[0]);
};

export const updateProduct = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const updated = await db
    .update(products)
    .set(req.body)
    .where(eq(products.id, id))
    .returning();
  if (updated.length === 0) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(updated[0]);
};

export const deleteProduct = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const deleted = await db.delete(products).where(eq(products.id, id)).returning();
  if (deleted.length === 0) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json({ success: true });
};