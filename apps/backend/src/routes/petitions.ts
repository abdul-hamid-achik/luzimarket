import { Router } from "express";
import { Petitions } from "@/data/petitionsData";

const router = Router();

/**
 * GET /api/petitions
 * Returns summary petition cards for admin petitions page.
 */
router.get("/", (_req, res) => {
  res.json(Petitions);
});

export default router;