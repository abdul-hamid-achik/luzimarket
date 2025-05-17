import { Router } from "express";
import { getDeliveryZones } from "../controllers/deliveryZoneController";

const router = Router();

// GET /api/delivery-zones
router.get("/", getDeliveryZones);

export default router; 