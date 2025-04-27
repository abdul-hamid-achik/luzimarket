import { Router } from "express";
import { ProductPetitions } from "@/data/petitionsProductsData";

const router = Router();

/**
 * GET /api/petitions/products
 * Returns a list of product addition petitions.
 */
router.get("/products", (_req, res) => {
  res.json(ProductPetitions);
});

export default router;