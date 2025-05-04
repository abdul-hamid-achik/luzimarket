import { Router } from "express";
import { z } from "zod";
import { authenticateJWT } from "../middleware/auth";
import { validate } from "../utils/validate";
import { createOrder, getOrders, getOrder } from "../controllers/orderController";

const router = Router();

const orderSchema = z.object({
  stripePaymentMethodId: z.string().optional(),
  couponCode: z.string().optional(),
});

router.use(authenticateJWT);

router.post("/", validate(orderSchema), createOrder);
router.get("/", getOrders);
router.get("/:id", getOrder);

export default router;