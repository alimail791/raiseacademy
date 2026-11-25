import express from "express";
import { visit, event, report } from "../controllers/trackController.js";
import { protect, adminOnly } from "../middleware/auth.js";

// Admin → "Traffic & signups" (controllers/trackController.js).
const router = express.Router();
router.post("/visit", visit);
router.post("/event", event);
router.get("/report", protect, adminOnly, report);
export default router;
