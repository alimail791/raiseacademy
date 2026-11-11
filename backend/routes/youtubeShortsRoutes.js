import express from "express";
import { report, list } from "../controllers/youtubeShortsController.js";

// Daily NEET quiz Shorts (YouTube) for www.yneet.in. See controllers/youtubeShortsController.js.
const router = express.Router();
router.get("/", list);
router.post("/", report);
export default router;
