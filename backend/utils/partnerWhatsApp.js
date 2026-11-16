import WidgetPartner from "../models/WidgetPartner.js";
import WidgetSite from "../models/WidgetSite.js";
import { normalizePhone, waConfigured } from "./parentWhatsApp.js";

// WhatsApp messages to widget partners (institutes with a www.yneet.in/i/<slug> page),
// sent from the Raise Academy number through Meta's Cloud API (same WA_TOKEN /
// WA_PHONE_ID_SHARED as the parent reports). Each job only runs once its
// template is approved in Meta and its Railway variable is set:
//
//   WA_PARTNER_WEEKLY_TEMPLATE  (e.g. yneet_partner_weekly) — Mondays 11:30 IST
//     {{1}} institute name, {{2}} times their YNeet tools were opened this week,
//     {{3}} link to their page
//   WA_PARTNER_DAILY_TEMPLATE   (e.g. yneet_partner_daily)  — every day 7:30 IST
//     {{1}} institute name, {{2}} link to today's status image page
//
// Templates must use numbered variables ({{1}}, {{2}}, …), language WA_TEMPLATE_LANG (default en).

const phoneId = () => process.env.WA_PHONE_NUMBER_ID || process.env.WA_PHONE_ID_SHARED;
const SITE = "https://www.yneet.in";
const param = (v) => String(v ?? "").replace(/[\r\n\t]+/g, " ").replace(/ {4,}/g, "   ").trim().slice(0, 200) || "—";

async function sendPartnerTemplate(template, phone, params) {
  const to = normalizePhone(phone);
  if (!to) throw new Error(`invalid number "${phone}"`);
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId()}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: `91${to}`,
      type: "template",
      template: {
        name: template,
        language: { code: process.env.WA_TEMPLATE_LANG || "en" },
        components: [{ type: "body", parameters: params.map((p) => ({ type: "text", text: param(p) })) }],
      },
    }),
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `WhatsApp API ${res.status}`);
  return data;
}

const hostOf = (url) => { try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; } };

// Widget loads on the partner's own website: boxes that say "Shared by <name>",
// or any box on the website they gave us.
async function siteLoads(p) {
  const host = hostOf(p.website);
  const or = [{ by: p.name }, ...(host ? [{ host }] : [])];
  const rows = await WidgetSite.find({ $or: or }).select("views").lean();
  return rows.reduce((n, r) => n + (r.views || 0), 0);
}

// Monday: "Your YNeet tools were opened N times this week".
export async function sendWeeklyPartnerReports({ dry = false } = {}) {
  const template = process.env.WA_PARTNER_WEEKLY_TEMPLATE;
  if (!dry && (!template || !waConfigured())) return { skipped: "WA_PARTNER_WEEKLY_TEMPLATE / WhatsApp not set" };
  const partners = await WidgetPartner.find({ hidden: false });
  let sent = 0, failed = 0, quiet = 0, error;
  for (const p of partners) {
    const loads = await siteLoads(p);
    const opens = Math.max(0, p.views - (p.reportViews || 0)) + Math.max(0, loads - (p.reportLoads || 0));
    if (opens < 1) { quiet++; } // nothing to report: no message that week
    else if (dry) { sent++; continue; }
    else {
      try {
        await sendPartnerTemplate(template, p.phone, [p.name, opens.toLocaleString("en-IN"), `${SITE}/i/${p.slug}`]);
        sent++;
        await new Promise((r) => setTimeout(r, 300));
      } catch (e) {
        failed++;
        error = error || `${p.slug}: ${e.message}`;
        console.warn(`Partner weekly WhatsApp to ${p.slug} failed:`, e.message);
        continue; // try again next week with the same totals
      }
    }
    if (!dry) { p.reportViews = p.views; p.reportLoads = loads; p.lastReportAt = new Date(); await p.save(); }
  }
  const out = { sent, failed, quiet, partners: partners.length, dry, ...(error ? { error } : {}) };
  console.log("Partner weekly WhatsApp:", JSON.stringify(out));
  return out;
}

// Every morning: "Today's NEET question for your WhatsApp status is ready" + link.
export async function sendDailyPartnerReminders({ dry = false } = {}) {
  const template = process.env.WA_PARTNER_DAILY_TEMPLATE;
  if (!dry && (!template || !waConfigured())) return { skipped: "WA_PARTNER_DAILY_TEMPLATE / WhatsApp not set" };
  const partners = await WidgetPartner.find({ hidden: false, dailyOptOut: { $ne: true } }).select("name slug phone").lean();
  if (dry) return { wouldSend: partners.length, dry };
  let sent = 0, failed = 0, error;
  for (const p of partners) {
    try {
      await sendPartnerTemplate(template, p.phone, [p.name, `${SITE}/i/${p.slug}/status`]);
      sent++;
      await new Promise((r) => setTimeout(r, 300));
    } catch (e) {
      failed++;
      error = error || `${p.slug}: ${e.message}`;
      console.warn(`Partner daily WhatsApp to ${p.slug} failed:`, e.message);
    }
  }
  console.log(`Partner daily WhatsApp: ${sent} sent, ${failed} failed.`);
  return { sent, failed, ...(error ? { error } : {}) };
}

// Admin page: which templates are set (names only, never the token) and when the jobs next run.
export function partnerWaStatus() {
  const at = (ms) => new Date(Date.now() + ms).toISOString();
  return {
    whatsapp: waConfigured(),
    daily: process.env.WA_PARTNER_DAILY_TEMPLATE || null,
    weekly: process.env.WA_PARTNER_WEEKLY_TEMPLATE || null,
    lang: process.env.WA_TEMPLATE_LANG || "en",
    nextDaily: at(msUntil(DAILY_AT)),
    nextWeekly: at(msUntil(WEEKLY_AT, 1)),
  };
}

// POST /api/widgets/partners/:slug/stop-daily  { phone }  — the status page's "Stop daily messages" button.
// Needs the number the page was made with, so nobody else can switch it off.
export const stopDaily = async (req, res, next) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    const p = phone && (await WidgetPartner.findOneAndUpdate({ slug: String(req.params.slug || "").toLowerCase(), phone }, { dailyOptOut: true }));
    if (!p) return res.status(400).json({ message: "That number doesn't match this page." });
    res.json({ message: "Daily messages stopped. You'll still get the Monday summary." });
  } catch (err) {
    next(err);
  }
};

// Times in UTC minutes after midnight.
const DAILY_AT = 2 * 60; // 07:30 IST
const WEEKLY_AT = 6 * 60; // 11:30 IST, Mondays
function msUntil(minUtc, weekday = null, now = new Date()) {
  const next = new Date(now);
  next.setUTCHours(0, minUtc, 0, 0);
  while (next <= now || (weekday !== null && next.getUTCDay() !== weekday)) next.setUTCDate(next.getUTCDate() + 1);
  return next - now;
}

export function startPartnerWhatsAppJobs() {
  const daily = () => setTimeout(async () => {
    await sendDailyPartnerReminders().catch((e) => console.warn("Partner daily job failed:", e.message));
    daily();
  }, msUntil(DAILY_AT));
  const weekly = () => setTimeout(async () => {
    await sendWeeklyPartnerReports().catch((e) => console.warn("Partner weekly job failed:", e.message));
    weekly();
  }, msUntil(WEEKLY_AT, 1));
  daily();
  weekly();
}
