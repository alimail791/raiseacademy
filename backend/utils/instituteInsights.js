import Student from "../models/Student.js";
import Institute from "../models/Institute.js";
import { yneetPost } from "./yneetSync.js";
import { waConfigured, sendTemplate, normalizePhone, param } from "./parentWhatsApp.js";

// Academic insights for an institute (built by YNeet from its students' test
// answers) and the Monday 8 am WhatsApp summary to the institute's phone.
//
// The WhatsApp summary uses an approved Meta template (business-initiated
// messages can't be free text). Railway variables:
//   WA_TOKEN, WA_PHONE_NUMBER_ID / WA_PHONE_ID_SHARED – same as parent reports
//   WA_INSTITUTE_TEMPLATE      – template name (default: yneet_institute_weekly)
//   WA_INSTITUTE_PARAM_NAMES   – only if the template uses named variables
//   WA_TEMPLATE_LANG           – template language (default: en)
// The template body must have 6 variables, in this order:
//   {{1}} institute name, {{2}} students who took tests, {{3}} batch accuracy,
//   {{4}} chapters to fix first, {{5}} suggested action, {{6}} students needing support.

const DAY = 24 * 60 * 60 * 1000;
const RUN_AT_UTC_MIN = 2 * 60 + 30; // 08:00 IST
const template = () => process.env.WA_INSTITUTE_TEMPLATE || "yneet_institute_weekly";

// Names are attached here; YNeet only ever sees student ids.
export const insightsFor = async (institute, days) => {
  const students = await Student.find({ instituteId: institute._id }).select("_id fullName").sort({ fullName: 1 });
  if (!students.length) return { empty: true };
  const data = await yneetPost("institute-analytics", {
    userIds: students.map((s) => String(s._id)),
    days: [7, 30, 90].includes(Number(days)) ? Number(days) : 30,
    instituteName: institute.name,
  });
  const names = Object.fromEntries(students.map((s) => [String(s._id), s.fullName]));
  const { success, ...rest } = data;
  return {
    ...rest,
    grid: { ...data.grid, students: (data.grid?.students || []).map((g) => ({ ...g, name: names[g.userId] || "Student" })) },
  };
};

export const insightsParams = (institute, r) => {
  const s = r.summary;
  const weak = (r.chapters || []).filter((c) => c.status === "critical" || c.status === "needs_work").slice(0, 3);
  return [
    institute.name,
    `${s.testedStudents} of ${s.students} (${s.participationPct ?? 0}%)`,
    s.accuracy != null ? `${s.accuracy}%` : "No tests this week",
    weak.length ? weak.map((c) => `${c.chapter} ${c.accuracy}%`).join(", ") : s.answers ? "No chapter below 60%" : "No test data yet",
    r.recommendation?.steps?.[0] || "Ask every student to take one YNeet chapter test this week.",
    `${s.needsSupport} student${s.needsSupport === 1 ? "" : "s"}`,
  ].map((v) => param(v, 200));
};

// One institute. Throws with a readable reason so the panel can show it.
export async function sendInstituteInsights(institute) {
  if (!waConfigured()) throw new Error("WhatsApp sending is not set up yet");
  if (!normalizePhone(institute.phone)) throw new Error("Add a valid 10-digit mobile number to your institute profile first");
  const r = await insightsFor(institute, 7);
  if (r.empty) throw new Error("Add students first");
  await sendTemplate(institute.phone, insightsParams(institute, r), { template: template(), paramNamesEnv: "WA_INSTITUTE_PARAM_NAMES" });
  await Institute.updateOne({ _id: institute._id }, { $set: { insightsWaSentAt: new Date() } });
  return { sentTo: normalizePhone(institute.phone) };
}

export async function sendAllInstituteInsights() {
  if (!waConfigured()) { console.log("Institute insights WhatsApp: not configured."); return { sent: 0, skipped: "not configured" }; }
  const sixDaysAgo = new Date(Date.now() - 6 * DAY);
  const institutes = await Institute.find({
    status: "active",
    endDate: { $gt: new Date() },
    weeklyInsights: { $ne: false },
    phone: { $exists: true, $ne: "" },
    $or: [{ insightsWaSentAt: null }, { insightsWaSentAt: { $exists: false } }, { insightsWaSentAt: { $lt: sixDaysAgo } }],
  });
  let sent = 0, failed = 0, skipped = 0;
  for (const inst of institutes) {
    try {
      if (!normalizePhone(inst.phone)) { skipped++; continue; }
      if (!(await Student.exists({ instituteId: inst._id }))) { skipped++; continue; }
      await sendInstituteInsights(inst);
      sent++;
      await new Promise((r) => setTimeout(r, 400));
    } catch (e) {
      failed++;
      console.warn(`Institute insights WhatsApp failed for ${inst.name}:`, e.message);
    }
  }
  console.log(`Institute insights WhatsApp: ${sent} sent, ${failed} failed, ${skipped} skipped, ${institutes.length} due.`);
  return { sent, failed, skipped, due: institutes.length };
}

// Runs daily at 08:00 IST and sends only on Mondays (IST).
const isMondayIST = (d = new Date()) => new Date(d.getTime() + 5.5 * 3600 * 1000).getUTCDay() === 1;
function msUntilNextRun(now = new Date()) {
  const next = new Date(now);
  next.setUTCHours(0, RUN_AT_UTC_MIN, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next - now;
}

export function startInstituteInsightsJob() {
  const schedule = () => setTimeout(async () => {
    if (isMondayIST()) await sendAllInstituteInsights().catch((e) => console.warn("Institute insights job failed:", e.message));
    schedule();
  }, msUntilNextRun());
  schedule();
}
