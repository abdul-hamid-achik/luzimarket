import { Router } from "express";
import { db } from '@/db';
import { adminOrders } from '@/schema';

const router = Router();

/**
 * GET /api/admin/orders
 * Returns list of mock orders for employees panel.
 */
router.get("/", async (_req, res) => {
  const orders = await db.select().from(adminOrders);
  res.json(orders);
});

export default router;