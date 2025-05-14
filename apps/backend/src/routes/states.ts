import { Router } from "express";
import { db } from '@/db';
// import { states } from '@/schema'; // Removed: states table no longer exists

const router = Router();

/**
 * GET /api/states
 * Returns list of delivery states.
 */
router.get("/", async (_req, res) => {
  // The states table has been removed. Return an empty array or static data if needed.
  res.json([]);
});

export default router;