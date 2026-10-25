import Student from "../models/Student.js";
import Institute from "../models/Institute.js";
import { yneetPost } from "./yneetSync.js";

// Weekly WhatsApp progress report to parents of institute students — and of
// free Class 6–8 students, whose parent's WhatsApp is asked for at sign-up — sent from
// the Raise Academy WhatsApp Business number through Meta's Cloud API using an
// approved message template. Turned on by setting these Railway variables:
//   WA_TOKEN            – permanent access token (same app as the WhatsApp bot)
//   WA_PHONE_NUMBER_ID  – phone number ID of the business number
//                         (or WA_PHONE_ID_SHARED, the name the WhatsApp bot uses)
//   WA_PARENT_TEMPLATE  – template name (default: yneet_parent_weekly)
//   WA_TEMPLATE_LANG    – template language code (default: en)
// The template body must have 6 variables, in this order:
//   {{1}} student name, {{2}} days studied (e.g. 4/7), {{3}} tests taken,
//   {{4}} average score, {{5}} chapters to practise, {{6}} institute name.

const DAY = 24 * 60 * 60 * 1000;
const phoneId = () => process.env.WA_PHONE_NUMBER_ID || process.env.WA_PHONE_ID_SHARED;
const RUN_AT_UTC_MIN = 5 * 60 + 30; // 11:00 IST, an hour after YNeet's email run

export const waConfigured = () => !!(process.env.WA_TOKEN && phoneId());

// Template parameters may not contain new lines, tabs or 4+ spaces in a row.
const param = (v, max = 120) => String(v ?? "—").replace(/[\r\n\t]+/g, " ").replace(/ {4,}/g, "   ").trim().slice(0, max) || "—";

export const reportParams = (studentName, instituteName, data) => {
  const s = data?.joined ? data.stats : null;
  return [
    studentName,
    s ? `${s.activeDays}/7` : "0/7",
    s ? String(s.tests) : "0",
    s?.avgPct != null ? `${s.avgPct}%` : "No tests yet",
    s?.weakChapters?.length ? s.weakChapters.join(", ") : s ? "None this week" : "Not started on YNeet yet",
    instituteName,
  ].map((v) => param(v));
};

export async function sendTemplate(phone10, params) {
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId()}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: `91${phone10}`,
      type: "template",
      template: {
        name: process.env.WA_PARENT_TEMPLATE || "yneet_parent_weekly",
        language: { code: process.env.WA_TEMPLATE_LANG || "en" },
        components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }],
      },
    }),
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `WhatsApp API ${res.status}`);
  return data;
}

export async function sendParentWhatsAppReports() {
  if (!waConfigured()) { console.log("Parent WhatsApp reports: not configured (set WA_TOKEN and WA_PHONE_ID_SHARED)."); return { sent: 0, skipped: "not configured" }; }
  const weekAgo = new Date(Date.now() - 7 * DAY + 60 * 60 * 1000);
  const students = await Student.find({
    parentPhone: { $exists: true, $ne: "" },
    $and: [
      { $or: [{ instituteId: { $ne: null } }, { currentClass: { $in: ["6", "7", "8"] } }] },
      { $or: [{ lastParentWaSent: null }, { lastParentWaSent: { $exists: false } }, { lastParentWaSent: { $lt: weekAgo } }] },
    ],
  }).select("fullName parentPhone instituteId");
  const institutes = {};
  let sent = 0, failed = 0;
  for (const s of students) {
    try {
      let fromName = "YNeet"; // free Class 6–8 students who signed up themselves
      if (s.instituteId) {
        const key = String(s.instituteId);
        institutes[key] ??= await Institute.findById(s.instituteId);
        const inst = institutes[key];
        if (!inst || !inst.isLive()) continue; // pack expired / suspended
        fromName = inst.name;
      }
      const data = await yneetPost("parent-report", { userId: String(s._id) });
      await sendTemplate(s.parentPhone, reportParams(s.fullName, fromName, data));
      await Student.updateOne({ _id: s._id }, { $set: { lastParentWaSent: new Date() } });
      sent++;
      await new Promise((r) => setTimeout(r, 300));
    } catch (e) {
      failed++;
      console.warn(`Parent WhatsApp report failed for ${s.fullName}:`, e.message);
    }
  }
  console.log(`Parent WhatsApp reports: ${sent} sent, ${failed} failed, ${students.length} due.`);
  return { sent, failed, due: students.length };
}

function msUntilNextRun(now = new Date()) {
  const next = new Date(now);
  next.setUTCHours(0, RUN_AT_UTC_MIN, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next - now;
}

export function startParentWhatsAppJob() {
  const schedule = () => setTimeout(async () => {
    await sendParentWhatsAppReports().catch((e) => console.warn("Parent WhatsApp job failed:", e.message));
    schedule();
  }, msUntilNextRun());
  schedule();
}
