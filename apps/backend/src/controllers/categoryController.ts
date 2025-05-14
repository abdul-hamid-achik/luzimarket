import { Request, Response } from "express";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { categories } from "@/schema";
import { StatusCodes } from "http-status-codes";
import strapi from '@/utils/strapiClient';

export const createCategory = async (req: Request, res: Response) => {
  try {
    const [category] = await db
      .insert(categories)
      .values({ name: req.body.name })
      .returning();
    res.status(StatusCodes.CREATED).json(category);
  } catch (err) {
    const error = err as { code?: string };
    if (error.code === "23505") {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Category already exists" });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  const { STRAPI_URL, STRAPI_API_TOKEN } = process.env;
  if (STRAPI_URL && STRAPI_API_TOKEN) {
    try {
      const { data } = await strapi.get('/api/categories?populate=*');
      const formatted = data.data.map((item: any) => ({ id: item.id, ...item.attributes }));
      return res.json(formatted);
    } catch (err: any) {
      console.error('Error fetching categories from Strapi', err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
  // Fallback to DB
  const cats = await db.select().from(categories);
  res.json(cats);
};

export const getCategory = async (req: Request, res: Response) => {
  const { STRAPI_URL, STRAPI_API_TOKEN } = process.env;
  if (STRAPI_URL && STRAPI_API_TOKEN) {
    try {
      const { id } = req.params;
      const { data } = await strapi.get(`/api/categories/${id}?populate=*`);
      const item = data.data;
      if (!item) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'Category not found' });
      }
      const cat = { id: item.id, ...item.attributes };
      return res.json(cat);
    } catch (err: any) {
      console.error('Error fetching category from Strapi', err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
  // Fallback to DB
  const idNum = Number(req.params.id);
  const cat = await db
    .select()
    .from(categories)
    .where(eq(categories.id, idNum))
    .limit(1);
  if (!cat[0]) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: 'Category not found' });
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
      return res.status(StatusCodes.NOT_FOUND).json({ error: "Category not found" });
    }
    res.json(updated[0]);
  } catch (err) {
    const error = err as { code?: string };
    if (error.code === "23505") {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Category name already exists" });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const deleted = await db.delete(categories).where(eq(categories.id, id)).returning();
  if (deleted.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: "Category not found" });
  }
  res.json({ success: true });
};