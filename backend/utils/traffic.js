// Sign-up funnel helpers for Admin → "Traffic & signups" (models/Traffic.js).
// Both functions are best-effort: they never throw and never slow a sign-up.
import { SignupAttempt } from "../models/Traffic.js";
import { signupInfo } from "./signupSource.js";

export const BOT_UA = /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|monitor|curl|wget|python|axios|httpclient|scan|facebookexternalhit|whatsapp\/|telegram/i;
export const deviceOf = (ua = "") => (/mobi|android|iphone|ipad/i.test(ua) ? "mobile" : "desktop");
export const vidOf = (raw) => (raw && typeof raw.vid === "string" ? raw.vid.replace(/[^\w-]/g, "").slice(0, 32) : "");

// Someone started signing up. `key` is "wa:<phone>" or their email.
export function recordStart({ key, method, name = "", phone = "", email = "", currentClass = "", signup }) {
  if (!key) return;
  const info = signupInfo(signup, method);
  SignupAttempt.updateOne(
    { key, status: "started" },
    {
      $set: {
        method,
        ...(name && { name: String(name).trim().slice(0, 80) }),
        ...(phone && { phone }),
        ...(email && { email }),
        ...(currentClass && { currentClass: String(currentClass) }),
        ...(vidOf(signup) && { vid: vidOf(signup) }),
        channel: info.channel,
        place: info.place,
      },
      $inc: { tries: 1 },
    },
    { upsert: true }
  ).catch((e) => {
    // A completed row already holds this key: nothing to do.
    if (e?.code !== 11000) console.warn("Saving sign-up attempt failed:", e.message);
  });
}

// An account was created: mark its attempt completed (creates one if the
// browser never reported a start, e.g. the email form, which has no OTP step).
export function markCompleted(student, key) {
  if (!student || !key) return;
  const s = student.signup || {};
  SignupAttempt.updateOne(
    { key },
    {
      $set: { status: "completed", studentId: student._id, completedAt: new Date() },
      $setOnInsert: {
        method: s.method || "",
        name: student.fullName || "",
        phone: student.phone || "",
        email: /@wa\.yneet\.in$/.test(student.email || "") ? "" : student.email || "",
        currentClass: student.currentClass || "",
        channel: s.channel || "",
        place: s.place || "",
        tries: 0,
      },
    },
    { upsert: true }
  ).catch((e) => console.warn("Marking sign-up completed failed:", e.message));
}
