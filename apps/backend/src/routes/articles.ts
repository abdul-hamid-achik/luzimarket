import { Router } from 'express';
import { getArticles, getArticle } from '@/controllers/articleController';

const router = Router();

router.get('/', getArticles);
router.get('/:id', getArticle);

export default router; 