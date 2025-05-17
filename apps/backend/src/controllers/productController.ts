import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import strapi from '@/utils/strapiClient';

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { data } = await strapi.post('/api/products', { data: req.body });
    const item = data.data;
    const p = {
      id: item.id,
      ...item.attributes,
      price: parseFloat(item.attributes.price),
    };
    return res.status(StatusCodes.CREATED).json(p);
  } catch (err: any) {
    console.error('Error creating product in Strapi', err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  // Parse filter parameters from query
  const { categoryIds, minPrice, maxPrice, colors } = req.query;
  const categoryIdsArr = typeof categoryIds === 'string'
    ? categoryIds.split(',').map(id => parseInt(id, 10)).filter(Boolean)
    : Array.isArray(categoryIds)
      ? (categoryIds as string[]).map(id => parseInt(id, 10)).filter(Boolean)
      : [];
  const min = minPrice ? parseFloat(minPrice as string) : undefined;
  const max = maxPrice ? parseFloat(maxPrice as string) : undefined;
  const colorsArr = typeof colors === 'string'
    ? colors.split(',')
    : Array.isArray(colors) ? (colors as string[]) : [];

  try {
    let url = '/api/products?populate=*';
    if (categoryIdsArr.length) {
      url += `&filters[category][id][$in]=${categoryIdsArr.join(',')}`;
    }
    if (min !== undefined) {
      url += `&filters[price][$gte]=${min}`;
    }
    if (max !== undefined) {
      url += `&filters[price][$lte]=${max}`;
    }
    if (colorsArr.length) {
      url += `&filters[color][$in]=${colorsArr.join(',')}`;
    }
    const { data } = await strapi.get(url);
    const formatted = data.data.map((item: any) => ({
      id: item.id,
      ...item.attributes,
      price: parseFloat(item.attributes.price),
    }));
    return res.json(formatted);
  } catch (err: any) {
    console.error('Error fetching products from Strapi', err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};

export const getProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data } = await strapi.get(`/api/products/${id}?populate=*`);
    const item = data.data;
    if (!item) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: 'Product not found' });
    }
    const p = {
      id: item.id,
      ...item.attributes,
      price: parseFloat(item.attributes.price),
    };
    return res.json(p);
  } catch (err: any) {
    console.error('Error fetching product from Strapi', err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data } = await strapi.put(`/api/products/${id}`, { data: req.body });
    const item = data.data;
    if (!item) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: 'Product not found' });
    }
    const p = {
      id: item.id,
      ...item.attributes,
      price: parseFloat(item.attributes.price),
    };
    return res.json(p);
  } catch (err: any) {
    console.error('Error updating product in Strapi', err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await strapi.delete(`/api/products/${id}`);
    return res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting product in Strapi', err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};