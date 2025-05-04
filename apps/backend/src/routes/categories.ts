import { Router } from "express";
import { z } from "zod";
import { authenticateJWT } from "../middleware/auth";
import { validate } from "../utils/validate";
import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";

const router = Router();

const categorySchema = z.object({
  name: z.string().min(1),
});

router.post(
  "/",
  authenticateJWT,
  validate(categorySchema),
  createCategory
);

router.get("/", getCategories);
router.get("/:id", getCategory);
router.put(
  "/:id",
  authenticateJWT,
  validate(categorySchema),
  updateCategory
);
router.delete("/:id", authenticateJWT, deleteCategory);

export default router;