import { Router } from "express";
import { z } from "zod";
import { authenticateJWT } from "../middleware/auth";
import { validate } from "../utils/validate";
import {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cartController";

const router = Router();

const addItemSchema = z.object({
  productId: z.number().int(),
  variantId: z.number().int().optional(),
  quantity: z.number().int().min(1),
});

router.use(authenticateJWT);

router.get("/", getCart);
router.post("/", validate(addItemSchema), addItemToCart);
router.put(
  "/:itemId",
  validate(z.object({ quantity: z.number().int().min(1) })),
  updateCartItem
);
router.delete("/:itemId", removeCartItem);
router.delete("/", clearCart);

export default router;