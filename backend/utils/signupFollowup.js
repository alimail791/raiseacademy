import crypto from "crypto";
import { SignupAttempt } from "../models/Traffic.js";
import Student from "../models/Student.js";
import GoogleLead from "../models/GoogleLead.js";
import { getSetting } from "../models/AppSetting.js";
import { sendEmail } from "./sendEmail.js";

// Automatic "finish your sign-up" emails to people in Admin → Traffic &
// signups → "Started but didn't finish" who gave an email address.
//   Email 1: about 1 hour after they stopped.
//   Email 2: 2 days after email 1 (the last one).
// Stops as soon as they have an account, unsubscribe, or the admin switches
// it off. Only for sign-ups started in the last 7 days. Checked every 15 min.
// Replaces the older one-email Google-lead reminder (utils/googleLeadReminder.js).

export const FOLLOWUP_KEY = "signupFollowup";
export const FOLLOWUP_DEFAULTS = { enabled: true };
const FIRST_AFTER_MS = 60 * 60 * 1000;
const SECOND_AFTER_MS = 2 * 24 * 60 * 60 * 1000;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const CHECK_EVERY_MS = 15 * 60 * 1000;
export const MAX_FOLLOWUPS = 2;

const SITE = () => (process.env.CLIENT_URL || "https://www.yneet.in").replace(/\/$/, "");
const API = () => (process.env.PUBLIC_API_URL || "https://raiseacademy-production.up.railway.app/api").replace(/\/$/, "");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const realEmail = (e) => e && /@/.test(e) && !/@wa\.yneet\.in$/i.test(e);

export const unsubToken = (id) =>
  crypto.createHmac("sha256", process.env.JWT_SECRET || "yneet").update(`unsub:${id}`).digest("hex").slice(0, 24);

const shell = (inner, a) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;">
    ${inner}
    <p style="color:#888; font-size:12px; margin-top:24px;">YNeet by Raise Academy · info@yneet.in<br>
    You're getting this because you started signing up on www.yneet.in.
    <a href="${API()}/track/unsubscribe?id=${a._id}&t=${unsubToken(a._id)}" style="color:#888;">Don't email me about this</a></p>
  </div>`;

const button = (href, label) => `
    <p style="text-align:center; margin:28px 0;">
      <a href="${href}" style="background:#F2A93B; color:#14213D; font-weight:700; font-size:16px; padding:14px 28px; border-radius:999px; text-decoration:none; display:inline-block;">${label}</a>
    </p>`;

export function followupEmail(a, step) {
  const first = esc(String(a.name || "").split(" ")[0]) || "there";
  const params = new URLSearchParams({ utm_source: "email", utm_medium: "followup", utm_campaign: `finish_signup_${step}` });
  const link = `${SITE()}/register?${params}`;
  const how = a.method === "google" ? "<p style=\"font-size:13px; color:#555;\">Tip: tap <b>Continue with Google</b> and enter your class and WhatsApp number.</p>" : "";

  if (step === 1) {
    return {
      subject: "Your free NEET mock test is waiting",
      html: shell(`
    <h2 style="color:#14213D; margin-top:0;">Hi ${first}, your sign-up got stuck halfway</h2>
    <p style="font-size:15px; color:#333;">Did something go wrong, like the code not arriving or the page not loading? Just reply to this email and we'll sort it out for you.</p>
    <p style="font-size:15px; color:#333;">Here's what's waiting once you finish (it takes a minute):</p>
    <ul style="font-size:15px; color:#333; padding-left:20px;">
      <li>A starter test right away, so you see where you stand</li>
      <li>Chapter Priority map: which chapters carry the most marks</li>
      <li>This Sunday's free All-India NEET Mock with rank list</li>
      <li>30 days free, no payment needed</li>
    </ul>
    ${button(link, "Finish sign-up")}
    ${how}`, a),
    };
  }
  return {
    subject: `${first === "there" ? "Your" : `${first}, your`} YNeet account is almost ready`,
    html: shell(`
    <h2 style="color:#14213D; margin-top:0;">Still preparing for NEET, ${first}?</h2>
    <p style="font-size:15px; color:#333;">Your YNeet sign-up is still unfinished. Complete it and practise with chapter-wise NEET tests from 70,000+ questions, plus doubt support on WhatsApp.</p>
    <p style="font-size:15px; color:#333;">Your 30-day free trial starts the moment you finish. No card, no auto-charge.</p>
    ${button(link, "Complete my sign-up")}
    ${how}
    <p style="font-size:13px; color:#555;">This is the last reminder we'll send.</p>`, a),
  };
}

// Has this person made an account some other way since?
async function hasAccount(a) {
  const or = [];
  if (a.email) or.push({ email: a.email.toLowerCase() });
  if (a.phone) or.push({ phone: { $in: [a.phone, `91${a.phone}`, `+91${a.phone}`] } });
  if (!or.length) return null;
  return Student.findOne({ $or: or }).select("_id").lean();
}

// Send the next email to one attempt now. Returns "sent" | "done" | "skipped".
export async function sendNextFollowup(a, now = new Date()) {
  if (a.status !== "started" || a.followupOptOut || !realEmail(a.email) || a.followups >= MAX_FOLLOWUPS) return "skipped";
  const step = (a.followups || 0) + 1;
  // Claim the step first so a restart or overlapping run can't email twice.
  const claimed = await SignupAttempt.updateOne(
    { _id: a._id, status: "started", followups: a.followups ? a.followups : { $in: [0, null] } },
    { $set: { followups: step, followupAt: now } }
  );
  if (!claimed.modifiedCount) return "skipped";

  if (await hasAccount(a)) {
    await SignupAttempt.updateOne({ _id: a._id }, { $set: { followups: MAX_FOLLOWUPS } });
    return "done";
  }
  try {
    const { subject, html } = followupEmail(a, step);
    await sendEmail({ to: a.email, subject, html });
    return "sent";
  } catch (e) {
    // Give the step back so it's retried next run.
    await SignupAttempt.updateOne({ _id: a._id, followups: step }, { $set: { followups: step - 1, followupAt: a.followupAt || null } });
    console.warn("Sign-up follow-up failed:", a.email, e.message);
    return "skipped";
  }
}

export async function sendSignupFollowups(now = new Date()) {
  const { enabled } = await getSetting(FOLLOWUP_KEY, FOLLOWUP_DEFAULTS);
  if (!enabled) return { sent: 0, due: 0, enabled };

  const due = await SignupAttempt.find({
    status: "started",
    followupOptOut: { $ne: true },
    email: { $regex: "@" },
    createdAt: { $gte: new Date(now - MAX_AGE_MS) },
    $or: [
      { followups: { $in: [0, null] }, updatedAt: { $lte: new Date(now - FIRST_AFTER_MS) } }, // null also matches older rows without the field
      { followups: 1, followupAt: { $lte: new Date(now - SECOND_AFTER_MS) } },
    ],
  }).limit(100).lean();

  let sent = 0;
  for (const a of due) {
    a.followups = a.followups || 0;
    // Already had the old one-off Google reminder? Count it as email 1.
    if (a.followups === 0 && a.method === "google") {
      const g = await GoogleLead.findOne({ email: a.email.toLowerCase() }).select("reminderSentAt").lean();
      if (g?.reminderSentAt) {
        await SignupAttempt.updateOne({ _id: a._id, followups: { $in: [0, null] } }, { $set: { followups: 1, followupAt: g.reminderSentAt } });
        continue;
      }
    }
    if ((await sendNextFollowup(a, now)) === "sent") sent++;
  }
  if (due.length) console.log(`Sign-up follow-ups: ${sent} sent of ${due.length} due.`);
  return { sent, due: due.length, enabled };
}

export function startSignupFollowupJob() {
  const run = () => sendSignupFollowups().catch((e) => console.warn("Sign-up follow-up job failed:", e.message));
  setTimeout(run, 90 * 1000); // shortly after boot
  setInterval(run, CHECK_EVERY_MS);
}
