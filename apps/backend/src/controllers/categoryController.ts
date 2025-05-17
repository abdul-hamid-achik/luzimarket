import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import strapi from '@/utils/strapiClient';

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { data } = await strapi.post('/api/categories', { data: { name: req.body.name } });
    const item = data.data;
    res.status(StatusCodes.CREATED).json({ id: item.id, ...item.attributes });
  } catch (err: any) {
    console.error('Error creating category in Strapi', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const { data } = await strapi.get('/api/categories?populate=*');
    const formatted = data.data.map((item: any) => ({ id: item.id, ...item.attributes }));
    return res.json(formatted);
  } catch (err: any) {
    console.error('Error fetching categories from Strapi', err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};

export const getCategory = async (req: Request, res: Response) => {
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
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const { data } = await strapi.put(`/api/categories/${id}`, { data: { name } });
    const item = data.data;
    res.json({ id: item.id, ...item.attributes });
  } catch (err: any) {
    console.error('Error updating category in Strapi', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await strapi.delete(`/api/categories/${id}`);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting category in Strapi', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};