import { Request, Response } from "express";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { products } from "@/schema";
import { StatusCodes } from "http-status-codes";

export const createProduct = async (req: Request, res: Response) => {
  try {
    const [product] = await db
      .insert(products)
      .values(req.body)
      .returning();
    const p: any = product;
    res.status(StatusCodes.CREATED).json({ ...p, price: parseFloat(p.price) });
  } catch (err) {
    const error = err as { message?: string };
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message || "Internal server error" });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  const prods = await db.select().from(products);
  const formattedProds = prods.map((p: any) => ({ ...p, price: parseFloat(p.price) }));
  res.json(formattedProds);
};

export const getProduct = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const prod = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (!prod[0]) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: "Product not found" });
  }
  const p: any = prod[0];
  res.json({ ...p, price: parseFloat(p.price) });
};

export const updateProduct = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const updated = await db
    .update(products)
    .set(req.body)
    .where(eq(products.id, id))
    .returning();
  if (updated.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: "Product not found" });
  }
  const p: any = updated[0];
  res.json({ ...p, price: parseFloat(p.price) });
};

export const deleteProduct = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const deleted = await db.delete(products).where(eq(products.id, id)).returning();
  if (deleted.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: "Product not found" });
  }
  res.json({ success: true });
};