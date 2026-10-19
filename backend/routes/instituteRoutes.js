import express from "express";
import { protect, adminOnly } from "../middleware/auth.js";
import * as c from "../controllers/instituteController.js";
import * as bill from "../controllers/instituteBillingController.js";

const router = express.Router();

// Raise Academy admin — manage institutes (bulk packs)
router.get("/admin", protect, adminOnly, c.adminListInstitutes);
router.post("/admin", protect, adminOnly, c.adminCreateInstitute);
router.put("/admin/:id", protect, adminOnly, c.adminUpdateInstitute);
router.post("/admin/:id/reset-password", protect, adminOnly, c.adminResetInstitutePassword);
router.get("/admin/:id/students", protect, adminOnly, c.adminInstituteStudents);
router.delete("/admin/:id", protect, adminOnly, c.adminDeleteInstitute);
router.get("/admin/:id/progress", protect, adminOnly, c.adminInstituteProgress);

// Monthly plans — public sign-up with online payment
router.get("/plans", bill.getPlans);
router.post("/signup/order", bill.signupOrder);
router.post("/signup/verify", bill.signupVerify);

// Institute panel
router.post("/login", c.instituteLogin);
router.post("/billing/order", c.protectInstitute, bill.renewOrder);
router.post("/billing/verify", c.protectInstitute, bill.renewVerify);
router.get("/billing/history", c.protectInstitute, bill.billingHistory);
router.get("/referral", c.protectInstitute, bill.referralInfo);
router.get("/referral/check", bill.checkReferral);
router.post("/forgot", c.instituteForgotPassword);
router.post("/reset-password", c.instituteResetPassword);
router.get("/me", c.protectInstitute, c.instituteMe);
router.post("/change-password", c.protectInstitute, c.instituteChangePassword);
router.get("/students", c.protectInstitute, c.instituteListStudents);
router.post("/students", c.protectInstitute, c.instituteAddStudents);
router.delete("/students/:id", c.protectInstitute, c.instituteRemoveStudent);
router.post("/students/:id/resend", c.protectInstitute, c.instituteResendLogin);
router.post("/students/:id/password", c.protectInstitute, c.instituteSetStudentPassword);
router.put("/students/:id/parent", c.protectInstitute, c.instituteSetParent);
router.get("/students/:id/parent-report", c.protectInstitute, c.instituteParentReport);
router.get("/progress.csv", c.protectInstitute, c.instituteProgressCsv);
router.get("/progress", c.protectInstitute, c.instituteProgress);
router.get("/progress/:id", c.protectInstitute, c.instituteStudentProgress);

export default router;
