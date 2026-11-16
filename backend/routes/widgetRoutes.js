import express from "express";
import { createPartner, getPartner, adminListPartners, adminUpdatePartner, ping, adminSites, directoryCities, directoryCity } from "../controllers/widgetController.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { stopDaily, sendWeeklyPartnerReports, sendDailyPartnerReminders } from "../utils/partnerWhatsApp.js";

const router = express.Router();

// Public — free NEET tools pages for institutes (www.yneet.in/i/<slug>)
router.post("/partners", createPartner);
router.get("/partners/:slug", getPartner);
router.post("/ping", ping); // a widget loaded on some website
router.get("/directory", directoryCities);
router.get("/directory/:city", directoryCity);
router.post("/partners/:slug/stop-daily", stopDaily); // "Reply STOP" link in the daily reminder

// Admin
router.get("/admin/partners", protect, adminOnly, adminListPartners);
router.put("/admin/partners/:id", protect, adminOnly, adminUpdatePartner);
router.get("/admin/sites", protect, adminOnly, adminSites);
// Run the WhatsApp jobs now (normally automatic): ?dry=1 only counts who would get one
router.post("/admin/run-weekly", protect, adminOnly, async (req, res, next) => { try { res.json(await sendWeeklyPartnerReports({ dry: req.query.dry === "1" })); } catch (e) { next(e); } });
router.post("/admin/run-daily", protect, adminOnly, async (req, res, next) => { try { res.json(await sendDailyPartnerReminders({ dry: req.query.dry === "1" })); } catch (e) { next(e); } });

export default router;
