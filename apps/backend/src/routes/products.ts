import { Router } from "express";
import { z } from "zod";
import { authenticateJWT } from "../middleware/auth";
import { validate } from "../utils/validate";
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";

const router = Router();

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  categoryId: z.number().int(),
  imageUrl: z.string().url().optional(),
});

router.post(
  "/",
  authenticateJWT,
  validate(productSchema),
  createProduct
);

router.get("/", getProducts);
router.get("/:id", getProduct);
router.put(
  "/:id",
  authenticateJWT,
  validate(productSchema),
  updateProduct
);
router.delete("/:id", authenticateJWT, deleteProduct);

export default router;