import { Router } from "express";
import { db } from "@/db";
import { sales } from "@/schema";
import { StatusCodes } from "http-status-codes";

const router = Router();

/**
 * GET /api/sales
 * Returns all sales entries from the database.
 */
router.get("/", async (_req, res) => {
  try {
    const allSales = await db.select().from(sales).orderBy(sales.date);
    res.json(allSales);
  } catch (err) {
    console.error("Error fetching sales from DB:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
  }
});

export default router;