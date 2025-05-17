import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import strapi from '@/utils/strapiClient';

const { STRAPI_URL, STRAPI_API_TOKEN } = process.env;

export const getDeliveryZones = async (_req: Request, res: Response) => {
    if (STRAPI_URL && STRAPI_API_TOKEN) {
        try {
            // Fetch delivery zones from Strapi
            const { data } = await strapi.get('/api/delivery-zones?populate=*');
            const formatted = data.data.map((item: any) => ({
                id: item.id,
                name: item.attributes.name,
                cities: item.attributes.cities,
                fee: parseFloat(item.attributes.fee || '0'),
                minDays: item.attributes.minDays,
                maxDays: item.attributes.maxDays,
            }));
            return res.json(formatted);
        } catch (err: any) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
    }
    // Fallback to empty array if not configured
    return res.json([]);
}; 