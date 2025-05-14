import { Request, Response } from 'express';
import strapi from '@/utils/strapiClient';
import { StatusCodes } from 'http-status-codes';

export const getArticles = async (req: Request, res: Response) => {
    try {
        const { data } = await strapi.get('/api/articles?populate=*');
        const formatted = data.data.map((item: any) => ({ id: item.id, ...item.attributes }));
        res.json(formatted);
    } catch (err: any) {
        console.error('Error fetching articles from Strapi', err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
};

export const getArticle = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const { data } = await strapi.get(`/api/articles/${id}?populate=*`);
        const item = data.data;
        if (!item) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'Article not found' });
        }
        const article = { id: item.id, ...item.attributes };
        res.json(article);
    } catch (err: any) {
        console.error(`Error fetching article id=${id}`, err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
}; 