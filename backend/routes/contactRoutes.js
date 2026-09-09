import express from "express";
import { submitContact, listContacts } from "../controllers/contactController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.post("/", submitContact);
router.get("/", protect, adminOnly, listContacts);

export default router;
