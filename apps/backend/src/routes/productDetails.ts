import { Router } from "express";

const router = Router();
const strapiUrl = process.env.STRAPI_URL || "http://localhost:1337";

// Proxy list and filtered queries
router.get("/", async (req, res, next) => {
    try {
        const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
        const response = await fetch(`${strapiUrl}/api/product-details${queryString ? `?${queryString}` : ""}`);
        const data = await response.json();
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// Proxy single detail by ID
router.get("/:id", async (req, res, next) => {
    try {
        const response = await fetch(`${strapiUrl}/api/product-details/${req.params.id}`);
        const data = await response.json();
        res.json(data);
    } catch (err) {
        next(err);
    }
});

export default router; 