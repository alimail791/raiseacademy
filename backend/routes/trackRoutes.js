import express from "express";
import { visit, event, report, setFollowup, previewFollowup, sendFollowupNow, unsubscribe } from "../controllers/trackController.js";
import { protect, adminOnly } from "../middleware/auth.js";

// Admin → "Traffic & signups" (controllers/trackController.js).
const router = express.Router();
router.post("/visit", visit);
router.post("/event", event);
router.get("/report", protect, adminOnly, report);
router.put("/followup", protect, adminOnly, setFollowup);
router.post("/followup/preview", protect, adminOnly, previewFollowup);
router.post("/followup/:id/send", protect, adminOnly, sendFollowupNow);
router.get("/unsubscribe", unsubscribe);
export default router;
