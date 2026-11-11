import express from "express";
import { upload, video, status } from "../controllers/instagramReelsController.js";

// Daily NEET quiz Reels → Instagram. See utils/instagramReels.js.
const router = express.Router();
router.put("/upload", express.raw({ type: "video/mp4", limit: "60mb" }), upload);
router.get("/video/:id", video);
router.get("/status", status);
export default router;
