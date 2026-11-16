import express from "express";
import { createPartner, getPartner, adminListPartners, adminUpdatePartner } from "../controllers/widgetController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// Public — free NEET tools pages for institutes (www.yneet.in/i/<slug>)
router.post("/partners", createPartner);
router.get("/partners/:slug", getPartner);

// Admin
router.get("/admin/partners", protect, adminOnly, adminListPartners);
router.put("/admin/partners/:id", protect, adminOnly, adminUpdatePartner);

export default router;
