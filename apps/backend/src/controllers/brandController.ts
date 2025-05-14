import { Request, Response } from 'express';
import strapi from '@/utils/strapiClient';
import { StatusCodes } from 'http-status-codes';

export const getBrands = async (req: Request, res: Response) => {
    try {
        const { data } = await strapi.get('/api/brands?populate=*');
        const formatted = data.data.map((item: any) => ({ id: item.id, ...item.attributes }));
        res.json(formatted);
    } catch (err: any) {
        console.error('Error fetching brands from Strapi', err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
};

export const getBrand = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const { data } = await strapi.get(`/api/brands/${id}?populate=*`);
        const item = data.data;
        if (!item) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'Brand not found' });
        }
        const brand = { id: item.id, ...item.attributes };
        res.json(brand);
    } catch (err: any) {
        console.error(`Error fetching brand id=${id}`, err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
}; 