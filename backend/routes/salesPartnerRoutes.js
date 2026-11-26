import express from "express";
import { protect, adminOnly } from "../middleware/auth.js";
import * as c from "../controllers/salesPartnerController.js";

// YNeet sales partners — commission-only institute sales (www.yneet.in/partner)
const router = express.Router();

router.get("/terms", c.terms);
router.get("/check", c.check);
router.post("/signup", c.signup);
router.post("/login", c.login);
router.post("/forgot", c.forgot);
router.get("/me", c.protectPartner, c.me);

// classcoach.in → YNeet (X-Internal-Key)
router.post("/internal/provision", c.internalProvision);
router.get("/internal/summary", c.internalSummary);
router.put("/me", c.protectPartner, c.updateMe);

router.get("/admin", protect, adminOnly, c.adminList);
router.put("/admin/:id", protect, adminOnly, c.adminUpdate);
router.post("/admin/:id/reset-password", protect, adminOnly, c.adminResetPassword);
router.post("/admin/commissions/:id", protect, adminOnly, c.adminCommission);

export default router;
