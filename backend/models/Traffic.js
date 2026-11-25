import mongoose from "mongoose";

// First-party visitor + sign-up funnel for Admin → "Traffic & signups"
// (utils/traffic.js, controllers/trackController.js). No third-party scripts:
// the browser keeps a random visitor id (localStorage "yn_vid") and sends it
// once on the first visit, and once a day when it opens a sign-up form.

const KEEP = 400 * 24 * 60 * 60; // seconds; old rows expire on their own

// One row per new visitor (first visit only).
const siteVisitSchema = new mongoose.Schema({
  vid: { type: String, required: true, unique: true },
  channel: { type: String, default: "Direct / unknown" },
  landing: { type: String, default: "" },
  referrer: { type: String, default: "" },
  device: { type: String, default: "" }, // mobile | desktop
  createdAt: { type: Date, default: Date.now, index: { expireAfterSeconds: KEEP } },
});

// One row per visitor per event per day (e.g. "signup_view").
const siteEventSchema = new mongoose.Schema({
  vid: { type: String, required: true },
  event: { type: String, required: true },
  day: { type: String, required: true }, // YYYY-MM-DD, India time
  channel: { type: String, default: "" },
  place: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now, index: { expireAfterSeconds: KEEP } },
});
siteEventSchema.index({ vid: 1, event: 1, day: 1 }, { unique: true });

// Someone who started signing up (asked for a WhatsApp code, reached Google's
// second step, or submitted the email form). `status` becomes "completed"
// when their account is created. Kept so unfinished ones can be followed up.
const signupAttemptSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true }, // "wa:9876543210" or an email
    vid: { type: String, default: "" },
    method: { type: String, default: "" }, // whatsapp | google | email
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    currentClass: { type: String, default: "" },
    channel: { type: String, default: "" },
    place: { type: String, default: "" },
    tries: { type: Number, default: 1 },
    status: { type: String, default: "started", index: true }, // started | completed
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    completedAt: { type: Date },
  },
  { timestamps: true }
);
signupAttemptSchema.index({ createdAt: -1 });

export const SiteVisit = mongoose.model("SiteVisit", siteVisitSchema);
export const SiteEvent = mongoose.model("SiteEvent", siteEventSchema);
export const SignupAttempt = mongoose.model("SignupAttempt", signupAttemptSchema);
