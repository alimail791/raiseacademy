import express from "express";
import { protect, adminOnly } from "../middleware/auth.js";
import * as c from "../controllers/instituteController.js";

const router = express.Router();

// Raise Academy admin — manage institutes (bulk packs)
router.get("/admin", protect, adminOnly, c.adminListInstitutes);
router.post("/admin", protect, adminOnly, c.adminCreateInstitute);
router.put("/admin/:id", protect, adminOnly, c.adminUpdateInstitute);
router.post("/admin/:id/reset-password", protect, adminOnly, c.adminResetInstitutePassword);
router.get("/admin/:id/students", protect, adminOnly, c.adminInstituteStudents);
router.delete("/admin/:id", protect, adminOnly, c.adminDeleteInstitute);

// Institute panel
router.post("/login", c.instituteLogin);
router.post("/forgot", c.instituteForgotPassword);
router.post("/reset-password", c.instituteResetPassword);
router.get("/me", c.protectInstitute, c.instituteMe);
router.post("/change-password", c.protectInstitute, c.instituteChangePassword);
router.get("/students", c.protectInstitute, c.instituteListStudents);
router.post("/students", c.protectInstitute, c.instituteAddStudents);
router.delete("/students/:id", c.protectInstitute, c.instituteRemoveStudent);
router.post("/students/:id/resend", c.protectInstitute, c.instituteResendLogin);

export default router;
