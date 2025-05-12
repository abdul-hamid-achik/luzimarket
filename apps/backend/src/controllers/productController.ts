import { Request, Response } from "express";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { products } from "@/schema";
import { StatusCodes } from "http-status-codes";
import strapi from '@/utils/strapiClient';

// Only use Strapi integration when both URL and API token are set
const { STRAPI_URL, STRAPI_API_TOKEN } = process.env;

export const createProduct = async (req: Request, res: Response) => {
  if (process.env.STRAPI_URL) {
    // Use Strapi when configured
    try {
      const { data } = await strapi.post('/api/products', { data: req.body });
      const item = data.data;
      const p = { id: item.id, ...item.attributes, price: parseFloat(item.attributes.price) };
      return res.status(StatusCodes.CREATED).json(p);
    } catch (err: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message || 'Internal server error' });
    }
  }
  // Fallback to direct DB use (for tests or no Strapi URL)
  try {
    const [product] = await db.insert(products).values(req.body).returning();
    const p: any = product;
    return res.status(StatusCodes.CREATED).json({ ...p, price: parseFloat(p.price) });
  } catch (err) {
    const error = err as { message?: string };
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message || 'Internal server error' });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  if (STRAPI_URL && STRAPI_API_TOKEN) {
    try {
      const { data } = await strapi.get('/api/products?populate=*');
      const formatted = data.data.map((item: any) => ({ id: item.id, ...item.attributes, price: parseFloat(item.attributes.price) }));
      return res.json(formatted);
    } catch (err: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
  // Fallback to direct DB use
  const prods = await db.select().from(products);
  const formattedProds = prods.map((p: any) => ({ ...p, price: parseFloat(p.price) }));
  return res.json(formattedProds);
};

export const getProduct = async (req: Request, res: Response) => {
  if (STRAPI_URL && STRAPI_API_TOKEN) {
    try {
      const id = Number(req.params.id);
      const { data } = await strapi.get(`/api/products/${id}?populate=*`);
      const item = data.data;
      if (!item) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'Product not found' });
      }
      const p = { id: item.id, ...item.attributes, price: parseFloat(item.attributes.price) };
      return res.json(p);
    } catch (err: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
  // Fallback to direct DB use
  const id = Number(req.params.id);
  const prod = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!prod[0]) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: 'Product not found' });
  }
  const p: any = prod[0];
  return res.json({ ...p, price: parseFloat(p.price) });
};

export const updateProduct = async (req: Request, res: Response) => {
  if (process.env.STRAPI_URL) {
    try {
      const id = Number(req.params.id);
      const { data } = await strapi.put(`/api/products/${id}`, { data: req.body });
      const item = data.data;
      if (!item) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'Product not found' });
      }
      const p = { id: item.id, ...item.attributes, price: parseFloat(item.attributes.price) };
      return res.json(p);
    } catch (err: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
  // Fallback to direct DB use
  const id = Number(req.params.id);
  const updated = await db.update(products).set(req.body).where(eq(products.id, id)).returning();
  if (updated.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: 'Product not found' });
  }
  const p: any = updated[0];
  return res.json({ ...p, price: parseFloat(p.price) });
};

export const deleteProduct = async (req: Request, res: Response) => {
  if (process.env.STRAPI_URL) {
    try {
      const id = Number(req.params.id);
      await strapi.delete(`/api/products/${id}`);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
  // Fallback to direct DB use
  const id = Number(req.params.id);
  const deleted = await db.delete(products).where(eq(products.id, id)).returning();
  if (deleted.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: 'Product not found' });
  }
  return res.json({ success: true });
};