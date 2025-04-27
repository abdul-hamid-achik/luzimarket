import { Router } from "express";
import { AdmissionPetitions } from "@/data/petitionsAdmissionsData";

const router = Router();

/**
 * GET /api/petitions/admissions
 * Returns a list of affiliate (admission) petitions.
 */
router.get("/admissions", (_req, res) => {
  res.json(AdmissionPetitions);
});

export default router;