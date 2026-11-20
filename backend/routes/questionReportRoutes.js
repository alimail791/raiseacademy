import express from "express";
import { createReport, listReports, updateReport } from "../controllers/questionReportController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.post("/", createReport);
router.get("/", protect, adminOnly, listReports);
router.patch("/:id", protect, adminOnly, updateReport);

export default router;
