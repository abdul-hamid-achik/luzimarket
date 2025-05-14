import { Router } from 'express';
import { getBrands, getBrand } from '@/controllers/brandController';

const router = Router();

router.get('/', getBrands);
router.get('/:id', getBrand);

export default router; 