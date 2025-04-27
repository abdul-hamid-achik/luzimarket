import { Request, Response } from "express";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { categories } from "@/schema";

export const createCategory = async (req: Request, res: Response) => {
  try {
    const [category] = await db
      .insert(categories)
      .values({ name: req.body.name })
      .returning();
    res.status(201).json(category);
  } catch (err) {
    const error = err as { code?: string };
    if (error.code === "23505") {
      return res.status(400).json({ error: "Category already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  const cats = await db.select().from(categories);
  res.json(cats);
};

export const getCategory = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const cat = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  if (!cat[0]) {
    return res.status(404).json({ error: "Category not found" });
  }
  res.json(cat[0]);
};

export const updateCategory = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const { name } = req.body;
    const updated = await db
      .update(categories)
      .set({ name })
      .where(eq(categories.id, id))
      .returning();
    if (updated.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(updated[0]);
  } catch (err) {
    const error = err as { code?: string };
    if (error.code === "23505") {
      return res.status(400).json({ error: "Category name already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const deleted = await db.delete(categories).where(eq(categories.id, id)).returning();
  if (deleted.length === 0) {
    return res.status(404).json({ error: "Category not found" });
  }
  res.json({ success: true });
};