import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import instituteRoutes from "./routes/instituteRoutes.js";
import { startParentWhatsAppJob } from "./utils/parentWhatsApp.js";
import { startRenewalReminderJob } from "./controllers/instituteBillingController.js";
import { startAllIndiaReportJob } from "./utils/allIndiaInstitutes.js";
import { startSignupFollowupJob } from "./utils/signupFollowup.js";
import { startPartnerWhatsAppJobs } from "./utils/partnerWhatsApp.js";
import blogRoutes from "./routes/blogRoutes.js";
import predictorRoutes from "./routes/predictorRoutes.js";
import booksRoutes from "./routes/booksRoutes.js";
import youtubeShortsRoutes from "./routes/youtubeShortsRoutes.js";
import instagramReelsRoutes from "./routes/instagramReelsRoutes.js";
import widgetRoutes from "./routes/widgetRoutes.js";
import trackRoutes from "./routes/trackRoutes.js";
import { startInstagramReelsJob } from "./utils/instagramReels.js";
import { seedBundledCutoffs, cutoffPagesCache } from "./controllers/predictorController.js";
import { warmCompare } from "./controllers/compareController.js";
import questionReportRoutes from "./routes/questionReportRoutes.js";
import salesPartnerRoutes from "./routes/salesPartnerRoutes.js";
import { shortsCache } from "./controllers/youtubeShortsController.js";
import { applyBlogUpdates } from "./utils/blogUpdates.js";
import { addBlogDrafts } from "./utils/blogDrafts.js";
import { startBlogScheduleJob } from "./utils/blogSchedule.js";

dotenv.config();

const app = express();
// Railway sits behind a reverse proxy that adds an X-Forwarded-For header.
// Without this, express-rate-limit throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
// and crashes requests to /api/auth and /api/otp. `1` trusts exactly one hop
// (Railway's own edge), which is correct here.
app.set("trust proxy", 1);

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
// Cutoff uploads (official allotment lists) can be several MB — parsed here before the 2 MB default below.
app.use("/api/predictor/admin/import", express.json({ limit: "30mb" }));
app.use(express.json({ limit: "2mb" })); // blog posts can be larger than the 100 kB default
app.use(morgan("dev"));

// Basic rate limiting for auth/otp endpoints to slow down abuse
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
app.use("/api/auth/wa/send", rateLimit({ windowMs: 60 * 60 * 1000, max: 10 })); // each send costs a WhatsApp message
app.use("/api/auth", authLimiter);
app.use("/api/otp", authLimiter);
app.use("/api/institute/login", authLimiter);
app.use("/api/institute/forgot", authLimiter);
app.use("/api/institute/reset-password", authLimiter);
app.use("/api/institute/signup", authLimiter);
app.use("/api/institute/pilot", authLimiter);
app.use("/api/predictor/alerts", rateLimit({ windowMs: 60 * 60 * 1000, max: 30 }));
app.use("/api/predictor/otp", rateLimit({ windowMs: 60 * 60 * 1000, max: 20 }));
app.use("/api/books/order", rateLimit({ windowMs: 60 * 60 * 1000, max: 30 }));
app.use("/api/widgets/ping", rateLimit({ windowMs: 60 * 60 * 1000, max: 120 }));
app.use("/api/widgets/partners", rateLimit({ windowMs: 60 * 60 * 1000, max: 10, skip: (req) => req.method !== "POST" })); // also covers stop-daily
app.use("/api/question-reports", rateLimit({ windowMs: 60 * 60 * 1000, max: 20, skip: (req) => req.method !== "POST" || (!!process.env.INTERNAL_SERVICE_KEY && req.headers["x-internal-key"] === process.env.INTERNAL_SERVICE_KEY) }));
app.use("/api/sales-partners/signup", rateLimit({ windowMs: 60 * 60 * 1000, max: 10 }));
app.use("/api/sales-partners/login", authLimiter);
app.use("/api/sales-partners/forgot", rateLimit({ windowMs: 60 * 60 * 1000, max: 5 }));
app.use("/api/predictor/predict", rateLimit({ windowMs: 60 * 1000, max: 30 }));
app.use("/api/track", rateLimit({ windowMs: 60 * 60 * 1000, max: 60, skip: (req) => req.method !== "POST" })); // visitor beacons (Traffic & signups)

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/track", trackRoutes);
app.use("/api/institute", instituteRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/predictor", predictorRoutes);
app.use("/api/books", booksRoutes);
app.use("/api/youtube-shorts", youtubeShortsRoutes);
app.use("/api/instagram-reels", instagramReelsRoutes);
app.use("/api/widgets", widgetRoutes);
app.use("/api/question-reports", questionReportRoutes);
app.use("/api/sales-partners", salesPartnerRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`YNeet API running on port ${PORT}`));
  startInstagramReelsJob(); // daily NEET quiz Reels → Instagram (needs IG_ACCESS_TOKEN)
  startParentWhatsAppJob(); // weekly WhatsApp progress report to institute students' parents
  startRenewalReminderJob(); // monthly institute plans: renewal reminder emails
  startAllIndiaReportJob(); // Monday: All-India NEET Mock results email to every institute
  startSignupFollowupJob(); // "finish your sign-up" emails (1 h, then 2 days later) — replaces the old Google-lead reminder
  startPartnerWhatsAppJobs(); // widget partners: daily status-image reminder + Monday stats (need WA_PARTNER_* templates)
  seedBundledCutoffs(); // NEET College Predictor: official cutoff files shipped in data/predictor
  applyBlogUpdates(); // one-time SEO updates to existing blog posts (utils/blogUpdates.js)
  addBlogDrafts(); // new blog posts added as drafts for review in the admin dashboard (utils/blogDrafts.js)
  startBlogScheduleJob(); // scheduled blog posts go live on their date (utils/blogSchedule.js)
  // Slow public lists (cutoff pages ~6s, Shorts ~3s): build them now and keep them
  // fresh in the background so no visitor waits for a rebuild.
  const warm = () => { cutoffPagesCache.warm(); shortsCache.warm(); warmCompare(); };
  warm();
  setInterval(warm, 30 * 60 * 1000).unref();
});
