import { Router } from "express";
import { db } from '@/db';
// import { adminOrders } from '@/schema'; // Removed: adminOrders table no longer exists

const router = Router();

/**
 * GET /api/admin/orders
 * Returns list of mock orders for employees panel.
 */
router.get("/", async (_req, res) => {
  // The adminOrders table has been removed. Return an empty array or static data if needed.
  res.json([]);
});

export default router;