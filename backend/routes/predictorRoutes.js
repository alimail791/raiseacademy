import express from "express";
import {
  meta, runPredict, sendOtp, verifyOtp, addAlertByToken, reportOrder, reportVerify, getReport,
  adminImport, adminSummary, adminDelete, adminLeads,
} from "../controllers/predictorController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// Public — NEET College Predictor (www.yneet.in/neet-college-predictor)
router.get("/meta", meta);
router.post("/predict", runPredict);
router.post("/otp/send", sendOtp);
router.post("/otp/verify", verifyOtp);
router.post("/alerts", addAlertByToken);
router.post("/report/order", reportOrder);
router.post("/report/verify", reportVerify);
router.get("/report", getReport);

// Admin — cutoff data + leads
router.post("/admin/import", protect, adminOnly, adminImport);
router.get("/admin/summary", protect, adminOnly, adminSummary);
router.delete("/admin/data", protect, adminOnly, adminDelete);
router.get("/admin/leads", protect, adminOnly, adminLeads);

export default router;
