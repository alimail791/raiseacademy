import GoogleLead from "../models/GoogleLead.js";
import Student from "../models/Student.js";
import { sendEmail } from "./sendEmail.js";

// One "finish your sign-up" email to students who tapped "Continue with Google"
// but stopped at the name/class/WhatsApp step. Sent once per lead, about
// 3 hours after they stopped, and never to anyone older than 3 days.
// Checked every 30 minutes.

const DELAY_MS = 3 * 60 * 60 * 1000;
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;
const CHECK_EVERY_MS = 30 * 60 * 1000;
const SITE = () => (process.env.CLIENT_URL || "https://www.yneet.in").replace(/\/$/, "");

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const googleLeadReminderTemplate = (lead) => {
  const first = esc(String(lead.name || "").split(" ")[0]) || "there";
  const params = new URLSearchParams({ utm_source: "email", utm_medium: "reminder", utm_campaign: "google_finish_signup" });
  if (lead.referredByCode) params.set("ref", lead.referredByCode);
  const link = `${SITE()}/register?${params}`;
  return `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;">
    <h2 style="color:#14213D; margin-top:0;">Hi ${first}, your 30 free days are waiting</h2>
    <p style="font-size:15px; color:#333;">You started signing up for YNeet with Google but didn't finish. It only needs two more things: your class and your WhatsApp number.</p>
    <p style="font-size:15px; color:#333;">Then you get full access to NEET mock tests, chapter-wise practice and doubt support on WhatsApp — free for 30 days. No payment, no card, no auto-charge.</p>
    <p style="text-align:center; margin:28px 0;">
      <a href="${link}" style="background:#F2A93B; color:#14213D; font-weight:700; font-size:16px; padding:14px 28px; border-radius:999px; text-decoration:none; display:inline-block;">Finish sign-up — takes 20 seconds</a>
    </p>
    <p style="font-size:13px; color:#555;">On the page, tap <b>Continue with Google</b> again and enter your class and WhatsApp number.</p>
    <p style="color:#888; font-size:12px; margin-top:24px;">YNeet by Raise Academy. You're getting this one-time email because you signed in with Google on www.yneet.in. We won't email you about this again.</p>
  </div>`;
};

export async function sendGoogleLeadReminders(now = new Date()) {
  const leads = await GoogleLead.find({
    completed: false,
    reminderSentAt: { $exists: false },
    updatedAt: { $lte: new Date(now - DELAY_MS) },
    createdAt: { $gte: new Date(now - MAX_AGE_MS) },
  }).limit(100);

  let sent = 0;
  for (const lead of leads) {
    // Claim it first so a restart or overlapping run can't email twice.
    const claimed = await GoogleLead.updateOne({ _id: lead._id, reminderSentAt: { $exists: false } }, { $set: { reminderSentAt: now } });
    if (!claimed.modifiedCount) continue;

    // Registered some other way since (e.g. the email form)? Mark done, don't email.
    const student = await Student.findOne({ email: lead.email }).select("_id").lean();
    if (student) {
      await GoogleLead.updateOne({ _id: lead._id }, { $set: { completed: true, studentId: student._id, completedAt: now } });
      continue;
    }
    try {
      await sendEmail({ to: lead.email, subject: "Your 30 free YNeet days are waiting — finish sign-up", html: googleLeadReminderTemplate(lead) });
      sent++;
    } catch (e) {
      console.warn("Google-lead reminder failed:", lead.email, e.message);
    }
  }
  if (leads.length) console.log(`Google sign-up reminders: ${sent} sent of ${leads.length} due.`);
  return { sent, due: leads.length };
}

export function startGoogleLeadReminderJob() {
  const run = () => sendGoogleLeadReminders().catch((e) => console.warn("Google-lead reminder job failed:", e.message));
  setTimeout(run, 60 * 1000); // shortly after boot
  setInterval(run, CHECK_EVERY_MS);
}
