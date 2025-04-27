import { Router } from "express";
import { db } from '@/db';
import { states } from '@/schema';

const router = Router();

/**
 * GET /api/states
 * Returns list of delivery states.
 */
router.get("/", async (_req, res) => {
  const allStates = await db.select().from(states);
  res.json(allStates);
});

export default router;