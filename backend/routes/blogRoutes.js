import express from "express";
import {
  listPublished, getPublished, exportPublished,
  adminList, adminGet, adminCreate, adminUpdate, adminDelete,
} from "../controllers/blogController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// Admin (registered first so "/admin…" is never read as a post slug)
router.get("/admin/posts", protect, adminOnly, adminList);
router.get("/admin/posts/:id", protect, adminOnly, adminGet);
router.post("/admin/posts", protect, adminOnly, adminCreate);
router.put("/admin/posts/:id", protect, adminOnly, adminUpdate);
router.delete("/admin/posts/:id", protect, adminOnly, adminDelete);

// Public
router.get("/", listPublished);
router.get("/export", exportPublished);
router.get("/:slug", getPublished);

export default router;
