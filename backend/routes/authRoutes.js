import express from "express";
import {
  register,
  login,
  getMe,
  resetPassword,
  setYneetSubscriptionFlag,
  sendWaOtpInternal,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/reset-password", resetPassword);
// Internal, server-to-server only (guarded by X-Internal-Key header, not user auth)
router.post("/internal/yneet-subscription", setYneetSubscriptionFlag);
router.post("/internal/wa-otp", sendWaOtpInternal);

export default router;
