import { Router } from "express";
import { BranchPetitions } from "@/data/petitionsBranchesData";

const router = Router();

/**
 * GET /api/petitions/branches
 * Returns a list of branch/store petitions.
 */
router.get("/branches", (_req, res) => {
  res.json(BranchPetitions);
});

export default router;