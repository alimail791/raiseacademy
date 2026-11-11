import express from "express";
import { uploadFile, catalog, me, order, verify, download, adminSales } from "../controllers/booksController.js";
import { protect, adminOnly } from "../middleware/auth.js";

// NEET PYQ books (www.yneet.in/neet-pyq-books). See controllers/booksController.js.
const router = express.Router();
router.put("/files/:name", express.raw({ type: "application/pdf", limit: "40mb" }), uploadFile); // monthly workflow upload
router.get("/catalog", catalog);
router.get("/me", me);
router.post("/order", order);
router.post("/verify", verify);
router.get("/download/:name", download);
router.get("/admin/sales", protect, adminOnly, adminSales);
export default router;
