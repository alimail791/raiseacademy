import crypto from "crypto";
import bcrypt from "bcryptjs";
import CollegeCutoff from "../models/CollegeCutoff.js";
import PredictorLead from "../models/PredictorLead.js";
import { buildCutoffRows } from "../utils/cutoffImport.js";
import { sendWhatsAppOtp } from "../utils/whatsappOtp.js";
import { normalizePhone, waConfigured } from "../utils/parentWhatsApp.js";
import { yneetPost } from "../utils/yneetSync.js";
import { sendEmail } from "../utils/sendEmail.js";

// ───────── NEET College Predictor ─────────
// Free: results after the student confirms a WhatsApp number (the lead).
// Paid (₹299): full choice-filling report.

export const QUOTAS = {
  AIQ: "All India Quota (MCC)",
  TN: "Tamil Nadu", AP: "Andhra Pradesh", TS: "Telangana", KL: "Kerala", KA: "Karnataka",
  UP: "Uttar Pradesh", MH: "Maharashtra", BR: "Bihar", RJ: "Rajasthan", DL: "Delhi",
};
export const REPORT_PRICE = Number(process.env.PREDICTOR_REPORT_PRICE || 299);
const FREE_LIMIT = 40; // colleges shown on the free results page
const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || "alimail791@gmail.com";
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Chance bands, by student rank ÷ last year's closing rank (or marks above the lowest mark).
const SAFE = 0.85, REACH = 1.15;
const SAFE_MARKS = 10, REACH_MARKS = 5;
export const ELIGIBILITY = {
  TN_GOVT_SCHOOL: "Tamil Nadu government school student (7.5% quota)",
  KA_KANNADA: "Karnataka: studied Class 1–10 in Kannada medium",
  KA_RURAL: "Karnataka: studied Class 1–10 in a rural area",
  KA_KK: "Karnataka: Kalyana-Karnataka (Hyderabad-Karnataka, Article 371J) candidate",
  AP_AU: "Andhra Pradesh: Andhra University (AU) local area",
  AP_SVU: "Andhra Pradesh: Sri Venkateswara University (SVU) local area",
  FEMALE: "Female candidate (women-only seats)",
};
// Seats can need several groups at once ("KA_KK+KA_RURAL"): allow every combination
// of the groups the student ticked, joined in sorted order.
const eligibleGroups = (list = []) => {
  const xs = [...new Set(list)].sort();
  const out = [null, ""];
  for (let mask = 1; mask < 1 << xs.length; mask++) out.push(xs.filter((_, i) => mask & (1 << i)).join("+"));
  return out;
};
const bandOfScore = (score, lowest, laterLowest, strayOnly) => {
  if (strayOnly) return score >= lowest ? "reach" : null;
  if (score >= lowest + SAFE_MARKS) return "safe";
  if (score >= lowest) return "likely";
  if (score >= lowest - REACH_MARKS || (laterLowest && score >= laterLowest)) return "reach";
  return null;
};
// Seats filled only in a stray round, or that went past the regular closing rank in the
// stray round, can still be "reach" up to the stray-round closing rank.
const bandOf = (rank, closing, stray, strayOnly) => {
  if (strayOnly) return rank <= closing ? "reach" : null;
  if (rank <= closing * SAFE) return "safe";
  if (rank <= closing) return "likely";
  if (rank <= Math.max(closing * REACH, stray || 0)) return "reach";
  return null;
};

// Latest year + latest imported round per quota (cached briefly).
let datasetCache = { at: 0, value: null };
export async function latestDatasets(force = false) {
  if (!force && datasetCache.value && Date.now() - datasetCache.at < 5 * 60 * 1000) return datasetCache.value;
  const agg = await CollegeCutoff.aggregate([
    { $group: { _id: { quota: "$quota", year: "$year", round: "$round" }, rows: { $sum: 1 }, openRows: { $sum: { $cond: ["$openToAll", 1, 0] } }, courses: { $addToSet: "$course" }, categories: { $addToSet: "$category" }, rankType: { $first: "$rankType" } } },
    { $sort: { "_id.year": -1, "_id.round": -1 } },
  ]);
  const out = {};
  for (const g of agg) {
    const q = g._id.quota;
    if (out[q]) continue; // first = latest year, latest round
    out[q] = { quota: q, name: QUOTAS[q] || q, year: g._id.year, round: g._id.round, rows: g.rows, openRows: g.openRows, courses: g.courses.sort(), categories: g.categories.sort(), rankType: g.rankType };
  }
  datasetCache = { at: Date.now(), value: out };
  return out;
}
const clearCache = () => { datasetCache = { at: 0, value: null }; };

// GET /api/predictor/meta
export const meta = async (req, res, next) => {
  try {
    const sets = await latestDatasets();
    res.json({
      quotas: Object.entries(QUOTAS).map(([code, name]) => ({ code, name, live: !!sets[code], ...(sets[code] && { year: sets[code].year, round: sets[code].round, rankType: sets[code].rankType, categories: sets[code].categories, courses: sets[code].courses }) })),
      reportPrice: REPORT_PRICE,
    });
  } catch (e) { next(e); }
};

const cleanInput = (b = {}) => {
  const course = String(b.course || "MBBS").toUpperCase() === "BDS" ? "BDS" : "MBBS";
  const category = String(b.category || "OPEN").toUpperCase().replace(/[^A-Z-]/g, "") || "OPEN";
  const stateCategory = String(b.stateCategory || "").toUpperCase().replace(/[^A-Z-]/g, "");
  const homeState = QUOTAS[String(b.homeState || "").toUpperCase()] ? String(b.homeState).toUpperCase() : "";
  const air = parseInt(b.air, 10);
  const stateRank = parseInt(b.stateRank, 10);
  const score = parseInt(b.score, 10);
  const elig = Array.isArray(b.eligibility) ? b.eligibility.filter((e) => ELIGIBILITY[e]) : [];
  return {
    course, category, stateCategory, homeState, eligibility: elig,
    air: air > 0 ? air : undefined,
    stateRank: stateRank > 0 ? stateRank : undefined,
    score: score > 0 && score <= 720 ? score : undefined,
  };
};

// Most competitive first: rank-based quotas by closing rank (low = hard), mark-based by
// lowest mark (high = hard); rank-based quotas listed before mark-based ones.
const harderFirst = (a, b) => {
  const sa = a.rankType === "SCORE", sb = b.rankType === "SCORE";
  if (sa !== sb) return sa ? 1 : -1;
  return sa ? b.closingRank - a.closingRank : a.closingRank - b.closingRank;
};

// Core matching. Returns every matching college bucket, best colleges first.
export async function predict(input) {
  const sets = await latestDatasets();
  const notes = [];
  const used = [];
  const or = [];
  for (const s of Object.values(sets)) {
    if (!s.courses.includes(input.course)) continue;
    const home = s.quota === input.homeState;
    if (!home && !s.openRows) continue; // nothing in this quota for out-of-state students
    if (s.rankType === "STATE" && !home) continue; // other states' rank lists: the student has no rank there
    const myRank = s.rankType === "SCORE" ? input.score : s.rankType === "STATE" ? input.stateRank : input.air;
    if (!myRank) {
      if (s.rankType === "SCORE") notes.push(home ? `Add your NEET score to see ${s.name} colleges.` : `Add your NEET score to also see ${s.name} management-quota colleges.`);
      else if (s.rankType === "STATE") notes.push(`Add your ${s.quota === "KL" ? "KEAM" : `${s.name} state merit`} rank to see ${s.name} colleges.`);
      else notes.push(`Add your NEET All India Rank to see ${s.name} colleges.`);
      continue;
    }
    const cat = s.quota === "AIQ" ? input.category : (input.stateCategory || input.category);
    if (home && s.quota !== "AIQ" && !s.categories.includes(cat)) notes.push(`Choose your ${s.name} community/category to include reserved seats.`);
    const cats = [...new Set(["OPEN", cat])];
    const reachOr = s.rankType === "SCORE"
      ? [{ closingRank: { $lte: myRank + REACH_MARKS } }, { strayClosingRank: { $lte: myRank } }]
      : [{ closingRank: { $gte: Math.floor(myRank / REACH) } }, { strayClosingRank: { $gte: myRank } }];
    const clause = { quota: s.quota, year: s.year, round: s.round, course: input.course, category: { $in: cats }, eligibility: { $in: eligibleGroups(input.eligibility) }, $or: reachOr };
    if (!home) clause.openToAll = true;
    or.push(clause);
    used.push({ quota: s.quota, name: s.name, year: s.year, round: s.round, rankType: s.rankType, home });
  }
  if (!or.length) return { results: [], used, notes };

  const rows = await CollegeCutoff.find({ $or: or }).lean();
  // Keep the best bucket per college + quota + seat type (a reserved-category student
  // may qualify through both OPEN and their own category — show whichever is easier).
  const best = new Map();
  for (const r of rows) {
    const myRank = r.rankType === "SCORE" ? input.score : r.rankType === "STATE" ? input.stateRank : input.air;
    const band = r.rankType === "SCORE" ? bandOfScore(myRank, r.closingRank, r.strayClosingRank, r.strayOnly) : bandOf(myRank, r.closingRank, r.strayClosingRank, r.strayOnly);
    if (!band) continue;
    const key = [r.quota, r.college.toLowerCase(), r.seatType.toLowerCase(), r.eligibility || ""].join("|");
    const prev = best.get(key);
    const order0 = { safe: 2, likely: 1, reach: 0 };
    const easier = (a, b) => (a.rankType === "SCORE" ? a.closingRank < b.closingRank : a.closingRank > b.closingRank);
    if (!prev || order0[band] > order0[prev.band] || (band === prev.band && easier(r, prev))) best.set(key, { ...r, band, myRank });
  }
  const results = [...best.values()]
    .sort(harderFirst)
    .map((r) => ({
      college: r.college, collegeState: r.collegeState, collegeType: r.collegeType, course: r.course,
      quota: r.quota, quotaName: QUOTAS[r.quota] || r.quota, seatType: r.seatType, category: r.category,
      closingRank: r.closingRank, openingRank: r.openingRank, strayClosingRank: r.strayClosingRank, strayOnly: !!r.strayOnly, rankType: r.rankType, eligibility: r.eligibility || "", seats: r.seats, annualFee: r.annualFee,
      year: r.year, round: r.round, band: r.band,
    }));
  return { results, used, notes };
}

const counts = (results) => results.reduce((c, r) => ({ ...c, [r.band]: (c[r.band] || 0) + 1 }), { safe: 0, likely: 0, reach: 0 });

const leadByToken = async (token) => (token ? PredictorLead.findOne({ token: String(token), verified: true }) : null);

// POST /api/predictor/predict { air, stateRank?, score?, category, stateCategory?, homeState, course, token? }
export const runPredict = async (req, res, next) => {
  try {
    const input = cleanInput(req.body);
    if (!input.air && !input.stateRank && !input.score) return res.status(400).json({ message: "Enter your NEET All India Rank or NEET score" });
    const { results, used, notes } = await predict(input);
    const lead = await leadByToken(req.body?.token);
    if (lead) {
      Object.assign(lead, { air: input.air, stateRank: input.stateRank, score: input.score, category: input.category, stateCategory: input.stateCategory, homeState: input.homeState, course: input.course, eligibility: input.eligibility });
      lead.searches = (lead.searches || 0) + 1;
      await lead.save();
    }
    const base = { counts: counts(results), total: results.length, used, notes, reportPrice: REPORT_PRICE };
    if (!lead) {
      // Teaser: numbers only, plus the single best match as a hook.
      return res.json({ ...base, locked: true, preview: results.slice(0, 1).map((r) => ({ college: r.college, quotaName: r.quotaName, band: r.band })) });
    }
    res.json({ ...base, locked: false, paid: lead.paid, results: results.slice(0, FREE_LIMIT), more: Math.max(0, results.length - FREE_LIMIT) });
  } catch (e) { next(e); }
};

// ───────── WhatsApp number (lead) ─────────

// POST /api/predictor/otp/send { phone, name? }
export const sendOtp = async (req, res, next) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    if (!phone) return res.status(400).json({ message: "Enter a valid 10-digit WhatsApp number" });
    const name = String(req.body?.name || "").trim().slice(0, 80);
    const utm = String(req.body?.utm || "").slice(0, 120);
    let lead = await PredictorLead.findOne({ phone });
    if (!lead) lead = new PredictorLead({ phone, name, utm });
    else if (name) lead.name = name;

    // No WhatsApp sender configured (e.g. local dev): accept the number without a code.
    if (!waConfigured()) {
      lead.verified = true;
      lead.token = lead.token || crypto.randomBytes(24).toString("hex");
      await lead.save();
      return res.json({ verified: true, token: lead.token, paid: lead.paid });
    }
    if (lead.otpExpires && lead.otpExpires.getTime() - 9 * 60 * 1000 > Date.now() - 30 * 1000) {
      return res.status(429).json({ message: "Please wait 30 seconds before asking for another code" });
    }
    const code = crypto.randomInt(100000, 999999).toString();
    lead.otpHash = await bcrypt.hash(code, 8);
    lead.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    lead.otpAttempts = 0;
    await lead.save();
    await sendWhatsAppOtp(phone, code);
    res.json({ sent: true });
  } catch (e) { next(e); }
};

// POST /api/predictor/otp/verify { phone, code }
export const verifyOtp = async (req, res, next) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    const code = String(req.body?.code || "").trim();
    const lead = phone && (await PredictorLead.findOne({ phone }));
    if (!lead?.otpHash) return res.status(400).json({ message: "Ask for a code first" });
    if (lead.otpExpires < new Date()) return res.status(400).json({ message: "Code expired — ask for a new one" });
    if (lead.otpAttempts >= 5) return res.status(429).json({ message: "Too many tries — ask for a new code" });
    if (!(await bcrypt.compare(code, lead.otpHash))) {
      lead.otpAttempts += 1;
      await lead.save();
      return res.status(400).json({ message: "Wrong code" });
    }
    lead.verified = true;
    lead.otpHash = undefined;
    lead.token = lead.token || crypto.randomBytes(24).toString("hex");
    await lead.save();
    res.json({ verified: true, token: lead.token, paid: lead.paid });
  } catch (e) { next(e); }
};

// ───────── ₹299 choice-filling report ─────────

// POST /api/predictor/report/order { token }
export const reportOrder = async (req, res, next) => {
  try {
    const lead = await leadByToken(req.body?.token);
    if (!lead) return res.status(401).json({ message: "Confirm your WhatsApp number first" });
    if (lead.paid) return res.json({ paid: true });
    const order = await yneetPost("razorpay/order", { amount: REPORT_PRICE * 100, receipt: `pred_${Date.now()}`, notes: { kind: "predictor_report", phone: lead.phone } });
    lead.orderId = order.orderId;
    lead.amount = REPORT_PRICE;
    await lead.save();
    res.json({ orderId: order.orderId, amount: order.amount, keyId: order.keyId, prefill: { name: lead.name, contact: lead.phone } });
  } catch (e) { next(e); }
};

// POST /api/predictor/report/verify { token, orderId, paymentId, signature }
export const reportVerify = async (req, res, next) => {
  try {
    const { token, orderId, paymentId, signature } = req.body || {};
    const lead = await leadByToken(token);
    if (!lead || !orderId || lead.orderId !== orderId) return res.status(400).json({ message: "Payment not found" });
    if (lead.paid) return res.json({ paid: true });
    const r = await yneetPost("razorpay/verify", { orderId, paymentId, signature });
    if (r.valid !== true) return res.status(400).json({ message: "Payment could not be verified" });
    Object.assign(lead, { paid: true, paymentId, paidAt: new Date() });
    await lead.save();
    sendEmail({
      to: ADMIN_ALERT_EMAIL, subject: `₹${REPORT_PRICE} College Predictor report bought — ${lead.phone}`,
      html: `<p>New paid College Predictor report.</p><p>Name: ${esc(lead.name)}<br>WhatsApp: ${esc(lead.phone)}<br>AIR: ${esc(lead.air)} · State rank: ${esc(lead.stateRank || "-")}<br>Category: ${esc(lead.category)} · Home state: ${esc(lead.homeState)} · ${esc(lead.course)}<br>Payment: ${esc(paymentId)}</p>`,
    }).catch(() => {});
    res.json({ paid: true });
  } catch (e) { next(e); }
};

// GET /api/predictor/report?token=… — full list + choice-filling order (paid only)
export const getReport = async (req, res, next) => {
  try {
    const lead = await leadByToken(req.query.token);
    if (!lead) return res.status(401).json({ message: "Confirm your WhatsApp number first" });
    if (!lead.paid) return res.status(402).json({ message: "Report not purchased", price: REPORT_PRICE });
    const input = cleanInput(lead.toObject());
    const { results, used, notes } = await predict(input);
    // Choice-filling order: most desirable first. Reach colleges at the top (they cost
    // nothing to fill), then likely, then safe as the safety net — each by closing rank.
    const rankBand = { reach: 0, likely: 1, safe: 2 };
    const choiceOrder = [...results].sort((a, b) => rankBand[a.band] - rankBand[b.band] || harderFirst(a, b));
    const byQuota = {};
    for (const r of choiceOrder) (byQuota[r.quota] ||= { quota: r.quota, name: r.quotaName, items: [] }).items.push(r);
    res.json({
      student: { name: lead.name, phone: lead.phone, air: lead.air, stateRank: lead.stateRank, score: lead.score, category: lead.category, stateCategory: lead.stateCategory, homeState: lead.homeState, homeStateName: QUOTAS[lead.homeState] || "", course: lead.course, eligibility: lead.eligibility },
      counts: counts(results), total: results.length, used, notes,
      sections: Object.values(byQuota),
      generatedAt: new Date().toISOString(),
    });
  } catch (e) { next(e); }
};

// ───────── Admin ─────────

// POST /api/predictor/admin/import { csv, quota, year, round, rankType?, course?, openToAllDefault?, replace?, dryRun?, source? }
export const adminImport = async (req, res, next) => {
  try {
    const b = req.body || {};
    const quota = String(b.quota || "").toUpperCase();
    if (!QUOTAS[quota]) return res.status(400).json({ message: `Quota must be one of ${Object.keys(QUOTAS).join(", ")}` });
    const year = parseInt(b.year, 10), round = parseInt(b.round, 10) || 1;
    if (!(year >= 2015 && year <= 2100)) return res.status(400).json({ message: "Enter the counselling year" });
    if (!b.csv) return res.status(400).json({ message: "Attach a CSV file" });
    const rankType = ["STATE", "AIR", "SCORE"].includes(b.rankType) ? b.rankType : undefined;
    const course = b.course ? String(b.course).toUpperCase() : undefined;
    const { mode, rows, skipped, missing } = buildCutoffRows(b.csv, { quota, year, round, rankType, course, openToAllDefault: !!b.openToAllDefault, source: String(b.source || "").slice(0, 200) });
    if (missing?.length) return res.status(400).json({ message: `Could not find these columns: ${missing.join(", ")}` });
    if (!rows.length) return res.status(400).json({ message: "No usable rows found in the file" });

    const sample = rows.slice(0, 8);
    const summary = { mode, rows: rows.length, skipped, colleges: new Set(rows.map((r) => r.college.toLowerCase())).size, categories: [...new Set(rows.map((r) => r.category))].sort(), courses: [...new Set(rows.map((r) => r.course))].sort(), seatTypes: [...new Set(rows.map((r) => r.seatType).filter(Boolean))].sort().slice(0, 30), sample };
    if (b.dryRun) return res.json({ dryRun: true, ...summary });

    let removed = 0;
    if (b.replace !== false) removed = (await CollegeCutoff.deleteMany({ quota, year, round, course: { $in: summary.courses } })).deletedCount;
    await CollegeCutoff.insertMany(rows, { ordered: false });
    clearCache();
    res.json({ imported: rows.length, removed, ...summary });
  } catch (e) { next(e); }
};

// GET /api/predictor/admin/summary
export const adminSummary = async (req, res, next) => {
  try {
    const sets = await CollegeCutoff.aggregate([
      { $group: { _id: { quota: "$quota", year: "$year", round: "$round", course: "$course" }, rows: { $sum: 1 }, updatedAt: { $max: "$updatedAt" } } },
      { $sort: { "_id.quota": 1, "_id.year": -1, "_id.round": -1 } },
    ]);
    const [leads, verified, paid] = await Promise.all([
      PredictorLead.countDocuments(), PredictorLead.countDocuments({ verified: true }), PredictorLead.countDocuments({ paid: true }),
    ]);
    res.json({
      quotas: QUOTAS,
      datasets: sets.map((s) => ({ ...s._id, name: QUOTAS[s._id.quota] || s._id.quota, rows: s.rows, updatedAt: s.updatedAt })),
      leads: { total: leads, verified, paid, revenue: paid * REPORT_PRICE },
    });
  } catch (e) { next(e); }
};

// DELETE /api/predictor/admin/data { quota, year, round?, course? }
export const adminDelete = async (req, res, next) => {
  try {
    const { quota, year, round, course } = req.body || {};
    if (!quota || !year) return res.status(400).json({ message: "quota and year are required" });
    const q = { quota: String(quota).toUpperCase(), year: parseInt(year, 10) };
    if (round) q.round = parseInt(round, 10);
    if (course) q.course = String(course).toUpperCase();
    const r = await CollegeCutoff.deleteMany(q);
    clearCache();
    res.json({ removed: r.deletedCount });
  } catch (e) { next(e); }
};

// GET /api/predictor/admin/leads?format=csv
export const adminLeads = async (req, res, next) => {
  try {
    const leads = await PredictorLead.find({}, "-otpHash -token").sort({ createdAt: -1 }).limit(5000).lean();
    if (req.query.format === "csv") {
      const cols = ["createdAt", "name", "phone", "verified", "air", "stateRank", "score", "category", "homeState", "course", "searches", "paid", "paidAt", "utm"];
      const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=predictor-leads.csv");
      return res.send([cols.join(","), ...leads.map((l) => cols.map((c) => cell(l[c] instanceof Date ? l[c].toISOString() : l[c])).join(","))].join("\n"));
    }
    res.json({ leads });
  } catch (e) { next(e); }
};

// ───────── Bundled data ─────────
// On start-up, load the official cutoff files shipped in data/predictor/ for any
// quota + year that has no rows yet. Admin uploads always win (never overwritten).
const BUNDLED = [
  { file: "mcc_aiq_2026.csv", quota: "AIQ", year: 2026, round: 3, rankType: "AIR", source: "MCC 2026 allotments (rounds 1–3, stray)" },
  { file: "mcc_delhi_du_ip_2026.csv", quota: "DL", year: 2026, round: 3, rankType: "AIR", source: "MCC 2026 DU/IP University quota" },
  { file: "tn_2026.csv", quota: "TN", year: 2026, round: 2, rankType: "SCORE", source: "Tamil Nadu 2026 GQ / MQ / 7.5% allotments" },
  { file: "ka_2026.csv", quota: "KA", year: 2026, round: 2, rankType: "AIR", source: "KEA 2026 MBBS round 2 final allotment" },
  { file: "kl_2026.csv", quota: "KL", year: 2026, round: 3, rankType: "STATE", source: "KEAM 2026 MBBS/BDS phase 2 + 3 allotments" },
  { file: "ap_2026.csv", quota: "AP", year: 2026, round: 3, rankType: "AIR", source: "Dr NTR UHS 2026 MBBS CQ + MQ, BDS MQ (phase III)" },
];
export async function seedBundledCutoffs() {
  const { readFile } = await import("fs/promises");
  for (const b of BUNDLED) {
    try {
      if (await CollegeCutoff.exists({ quota: b.quota, year: b.year })) continue;
      const csv = await readFile(new URL(`../data/predictor/${b.file}`, import.meta.url), "utf8");
      const { rows } = buildCutoffRows(csv, b);
      if (rows.length) await CollegeCutoff.insertMany(rows, { ordered: false });
      console.log(`College Predictor: loaded ${rows.length} ${b.quota} ${b.year} cutoffs from ${b.file}`);
    } catch (e) {
      console.warn(`College Predictor: could not load ${b.file}:`, e.message);
    }
  }
  clearCache();
}
