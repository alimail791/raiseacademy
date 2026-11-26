import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import SalesPartner from "../models/SalesPartner.js";
import PartnerCommission from "../models/PartnerCommission.js";
import Institute from "../models/Institute.js";
import { sendEmail } from "../utils/sendEmail.js";

// ───────── YNeet sales partners (www.yneet.in/partner) ─────────
// Commission only, no salary: a partner introduces coaching institutes, the
// YNeet team does the demo / setup, and the partner earns
//   20% of the institute's first payment,
//   10% of every later payment (renewals, extra months, more seats),
//   ₹5,000 once, when their 3rd institute pays.
// A commission line is created only after the institute's money reaches YNeet
// (Razorpay verified, or entered by admin for offline yearly packs) and is paid
// out by admin within 7 days. Change the terms here; the /partner page reads them
// from GET /api/sales-partners/terms.
export const TERMS = { firstRate: 0.2, renewalRate: 0.1, bonusAfter: 3, bonusAmount: 5000, payWithinDays: 7 };

const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || "alimail791@gmail.com";
const SITE = () => (process.env.CLIENT_URL || "https://www.yneet.in").replace(/\/$/, "");
const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const box = (inner) => `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px;"><h2 style="color:#14213D;">YNeet Partners</h2>${inner}<p style="color:#888;font-size:12px;margin-top:24px;">YNeet · NEET preparation</p></div>`;
const phone10 = (v) => String(v || "").replace(/\D/g, "").slice(-10);
const tempPassword = () => crypto.randomBytes(6).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).padEnd(8, "7");
const instituteLink = (code) => `${SITE()}/institutes?sp=${code}`;

export const partnerView = (p) => ({
  id: p._id, name: p.name, phone: p.phone, email: p.email, city: p.city || "", occupation: p.occupation || "",
  code: p.code, upiId: p.upiId || "", status: p.status, createdAt: p.createdAt, link: instituteLink(p.code),
});

const makeCode = (name) => {
  const base = String(name || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5) || "P";
  return `YN${base}${Math.floor(10 + Math.random() * 90)}`;
};
async function newCode(name) {
  for (let i = 0; i < 10; i++) {
    const c = makeCode(name);
    if (!(await SalesPartner.exists({ code: c }))) return c;
  }
  return `YNP${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

// Active partner for a code typed / carried in a link, or null.
export async function findPartnerByCode(code) {
  const c = String(code || "").trim().toUpperCase();
  if (!c) return null;
  return SalesPartner.findOne({ code: c, status: "active" });
}

// ───────── Commission engine ─────────
// Call after money from an institute reaches YNeet. `amount` = rupees received
// in this payment; `key` must be unique per payment (Razorpay id, or an admin
// key) so a retried request never pays twice. Best-effort: never throws.
export async function recordPartnerCommission(inst, amount, { key, source, note } = {}) {
  try {
    if (!inst?.salesPartner || !(Number(amount) > 0) || !key) return null;
    const partner = await SalesPartner.findById(inst.salesPartner);
    if (!partner) return null;
    const hasFirst = await PartnerCommission.exists({ instituteId: inst._id, kind: "first", status: { $ne: "cancelled" } });
    const kind = hasFirst ? "renewal" : "first";
    const rate = kind === "first" ? TERMS.firstRate : TERMS.renewalRate;
    const dueBy = new Date(Date.now() + TERMS.payWithinDays * 864e5);
    let line;
    try {
      line = await PartnerCommission.create({
        partnerId: partner._id, instituteId: inst._id, instituteName: inst.name, kind, baseAmount: Number(amount), rate,
        amount: Math.round(Number(amount) * rate), source, key, dueBy, note,
      });
    } catch (e) {
      if (e?.code === 11000) return null; // this payment was already counted
      throw e;
    }

    // One-time bonus when the partner's 3rd institute pays.
    let bonus = null;
    if (kind === "first" && !partner.bonusAwarded) {
      const deals = await PartnerCommission.countDocuments({ partnerId: partner._id, kind: "first", status: { $ne: "cancelled" } });
      if (deals >= TERMS.bonusAfter) {
        const claimed = await SalesPartner.findOneAndUpdate({ _id: partner._id, bonusAwarded: { $ne: true } }, { $set: { bonusAwarded: true } });
        if (claimed) {
          bonus = await PartnerCommission.create({
            partnerId: partner._id, instituteId: inst._id, instituteName: inst.name, kind: "bonus", amount: TERMS.bonusAmount,
            source: "bonus", key: `bonus:${partner._id}`, dueBy, note: `Bonus for your ${TERMS.bonusAfter}rd paying institute`,
          }).catch(() => null);
        }
      }
    }

    const total = line.amount + (bonus?.amount || 0);
    sendEmail({
      to: partner.email, subject: `You earned ${inr(total)} — ${inst.name} paid for YNeet`,
      html: box(`<p>Hello ${esc(partner.name)},</p>
        <p><b>${esc(inst.name)}</b> just paid <b>${inr(amount)}</b> for YNeet. Your ${kind === "first" ? `${TERMS.firstRate * 100}% first-payment` : `${TERMS.renewalRate * 100}% renewal`} commission is <b>${inr(line.amount)}</b>.</p>
        ${bonus ? `<p>🎉 That's your ${TERMS.bonusAfter}rd paying institute, so you also earned the <b>${inr(bonus.amount)} bonus</b>.</p>` : ""}
        <p>We'll send it to ${partner.upiId ? `your UPI <b>${esc(partner.upiId)}</b>` : "you — please add your UPI ID in your dashboard"} within ${TERMS.payWithinDays} days.</p>
        <p><a href="${SITE()}/partner/dashboard">Open your partner dashboard</a></p>`),
    }).catch(() => {});
    sendEmail({
      to: ADMIN_ALERT_EMAIL, subject: `Partner commission due: ${inr(total)} to ${partner.name} (${partner.code})`,
      html: box(`<p><b>${esc(inst.name)}</b> paid ${inr(amount)}. ${kind} commission ${inr(line.amount)}${bonus ? ` + bonus ${inr(bonus.amount)}` : ""} to <b>${esc(partner.name)}</b> (${esc(partner.code)}, ${esc(partner.phone)}, UPI ${esc(partner.upiId || "not set")}).</p>
        <p>Pay by ${dueBy.toLocaleDateString("en-IN")} and mark it paid in <a href="${SITE()}/admin/sales-partners">Admin → Sales partners</a>.</p>`),
    }).catch(() => {});
    return line;
  } catch (e) {
    console.warn("Partner commission failed:", e.message);
    return null;
  }
}

// ───────── Partner auth ─────────
const signPartnerToken = (p) => jwt.sign({ spid: String(p._id), typ: "salesPartner" }, process.env.JWT_SECRET, { expiresIn: "30d" });

export const protectPartner = async (req, res, next) => {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Please log in" });
    const d = jwt.verify(token, process.env.JWT_SECRET);
    if (d.typ !== "salesPartner" || !d.spid) return res.status(401).json({ message: "Please log in" });
    const p = await SalesPartner.findById(d.spid);
    if (!p) return res.status(401).json({ message: "Partner account not found" });
    req.partner = p;
    next();
  } catch { res.status(401).json({ message: "Session expired. Please log in again." }); }
};

// GET /api/sales-partners/terms — public, for the /partner page
export const terms = async (req, res) => {
  const { MONTHLY_PLANS, PACKS } = await import("./instituteController.js");
  res.json({ ...TERMS, monthly: MONTHLY_PLANS, yearly: PACKS });
};

// GET /api/sales-partners/check?code=X — public: is this a partner code?
export const check = async (req, res) => {
  const p = await findPartnerByCode(req.query.code).catch(() => null);
  res.json(p ? { valid: true, name: p.name } : { valid: false });
};

// POST /api/sales-partners/signup { name, phone, email, city, occupation, contacts, password, upiId? }
export const signup = async (req, res, next) => {
  try {
    const b = req.body || {};
    const name = String(b.name || "").trim();
    const email = String(b.email || "").trim().toLowerCase();
    const phone = phone10(b.phone);
    if (name.length < 2) return res.status(400).json({ message: "Enter your name" });
    if (phone.length !== 10) return res.status(400).json({ message: "Enter your 10-digit WhatsApp number" });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: "Enter a valid email" });
    if (String(b.password || "").length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
    if (await SalesPartner.exists({ $or: [{ phone }, { email }] })) return res.status(409).json({ message: "You're already a YNeet partner with this phone or email. Please log in." });

    const p = await SalesPartner.create({
      name, phone, email, city: String(b.city || "").trim(), occupation: String(b.occupation || "").trim(),
      contacts: String(b.contacts || "").trim(), upiId: String(b.upiId || "").trim(),
      password: await bcrypt.hash(String(b.password), 10), code: await newCode(name),
    });

    sendEmail({
      to: p.email, subject: `Welcome to YNeet Partners — your code is ${p.code}`,
      html: box(`<p>Hello ${esc(p.name)},</p><p>Welcome aboard! Your partner code is <b style="font-size:18px;">${p.code}</b>.</p>
        <p>Share this link with coaching centres. Anyone who starts a free pilot or buys a plan through it is tagged to you:<br/><a href="${instituteLink(p.code)}">${instituteLink(p.code)}</a></p>
        <p>You earn <b>${TERMS.firstRate * 100}%</b> of their first payment, <b>${TERMS.renewalRate * 100}%</b> of every renewal, and a <b>${inr(TERMS.bonusAmount)}</b> bonus when your ${TERMS.bonusAfter}rd institute pays. Paid within ${TERMS.payWithinDays} days of their payment.</p>
        <p style="margin:20px 0;"><a href="${SITE()}/partner/dashboard" style="background:#F2A93B;color:#14213D;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:999px;display:inline-block;">Open your dashboard</a></p>`),
    }).catch(() => {});
    sendEmail({
      to: ADMIN_ALERT_EMAIL, subject: `New YNeet sales partner: ${p.name} (${p.city || "—"})`,
      html: box(`<table style="font-size:14px;">${[["Name", p.name], ["Code", p.code], ["WhatsApp", p.phone], ["Email", p.email], ["City", p.city], ["Occupation", p.occupation], ["Knows centres", p.contacts]].map(([k, v]) => `<tr><td style="color:#888;padding:3px 12px 3px 0;">${k}</td><td>${esc(v || "—")}</td></tr>`).join("")}</table>`),
    }).catch(() => {});

    res.status(201).json({ token: signPartnerToken(p), partner: partnerView(p) });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "You're already a YNeet partner with this phone or email. Please log in." });
    next(err);
  }
};

// POST /api/sales-partners/login { login (phone or email), password }
export const login = async (req, res, next) => {
  try {
    const login = String(req.body?.login || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!login || !password) return res.status(400).json({ message: "Enter your phone or email and password" });
    const q = login.includes("@") ? { email: login } : { phone: phone10(login) };
    const p = await SalesPartner.findOne(q).select("+password");
    if (!p || !(await bcrypt.compare(password, p.password))) return res.status(401).json({ message: "Wrong phone/email or password" });
    if (p.status === "suspended") return res.status(403).json({ message: "Your partner account is paused. Please WhatsApp YNeet." });
    res.json({ token: signPartnerToken(p), partner: partnerView(p) });
  } catch (err) { next(err); }
};

// POST /api/sales-partners/forgot { login } — emails a new password
export const forgot = async (req, res, next) => {
  try {
    const login = String(req.body?.login || "").trim().toLowerCase();
    const q = login.includes("@") ? { email: login } : { phone: phone10(login) };
    const p = login ? await SalesPartner.findOne(q) : null;
    if (p) {
      const pw = tempPassword();
      p.password = await bcrypt.hash(pw, 10);
      await p.save();
      await sendEmail({
        to: p.email, subject: "Your new YNeet partner password",
        html: box(`<p>Your new password is <b>${pw}</b>.</p><p><a href="${SITE()}/partner/login">Log in</a> and change it from your dashboard.</p>`),
      }).catch(() => {});
    }
    res.json({ message: "If that account exists, we've emailed a new password." });
  } catch (err) { next(err); }
};

const stageOf = (i) => {
  if (i.status === "suspended") return "Paused";
  if (i.billing === "pilot") return i.endDate > new Date() ? "Free pilot" : "Pilot ended";
  return i.endDate > new Date() ? "Paying" : "Expired";
};

const summarise = (lines) => {
  const live = lines.filter((l) => l.status !== "cancelled");
  const sum = (arr) => arr.reduce((n, l) => n + l.amount, 0);
  return { earned: sum(live), paid: sum(live.filter((l) => l.status === "paid")), pending: sum(live.filter((l) => l.status === "pending")) };
};

// GET /api/sales-partners/me — dashboard
export const me = async (req, res, next) => {
  try {
    const p = req.partner;
    const [insts, lines] = await Promise.all([
      Institute.find({ salesPartner: p._id }).select("name city billing status endDate seats createdAt").sort({ createdAt: -1 }),
      PartnerCommission.find({ partnerId: p._id }).sort({ createdAt: -1 }).limit(200),
    ]);
    const deals = lines.filter((l) => l.kind === "first" && l.status !== "cancelled").length;
    res.json({
      partner: partnerView(p),
      terms: TERMS,
      stats: { ...summarise(lines), institutes: insts.length, pilots: insts.filter((i) => i.billing === "pilot").length, paying: deals, bonusAwarded: !!p.bonusAwarded },
      institutes: insts.map((i) => ({ name: i.name, city: i.city || "", stage: stageOf(i), seats: i.seats, joined: i.createdAt })),
      commissions: lines.map((l) => ({ id: l._id, date: l.createdAt, institute: l.instituteName || "", kind: l.kind, base: l.baseAmount, rate: l.rate, amount: l.amount, status: l.status, dueBy: l.dueBy, paidAt: l.paidAt, payoutRef: l.payoutRef || "" })),
    });
  } catch (err) { next(err); }
};

// PUT /api/sales-partners/me { upiId?, city?, password?, currentPassword? }
export const updateMe = async (req, res, next) => {
  try {
    const p = await SalesPartner.findById(req.partner._id).select("+password");
    const b = req.body || {};
    if (b.upiId !== undefined) p.upiId = String(b.upiId).trim().slice(0, 80);
    if (b.city !== undefined) p.city = String(b.city).trim().slice(0, 80);
    if (b.password) {
      if (String(b.password).length < 6) return res.status(400).json({ message: "New password must be at least 6 characters" });
      if (!(await bcrypt.compare(String(b.currentPassword || ""), p.password))) return res.status(400).json({ message: "Current password is wrong" });
      p.password = await bcrypt.hash(String(b.password), 10);
    }
    await p.save();
    res.json({ partner: partnerView(p) });
  } catch (err) { next(err); }
};

// ───────── Admin ─────────

// GET /api/sales-partners/admin — partners with totals + all commission lines
export const adminList = async (req, res, next) => {
  try {
    const [partners, lines, counts] = await Promise.all([
      SalesPartner.find().sort({ createdAt: -1 }),
      PartnerCommission.find().sort({ createdAt: -1 }).limit(1000).populate("partnerId", "name code phone upiId"),
      Institute.aggregate([{ $match: { salesPartner: { $ne: null } } }, { $group: { _id: "$salesPartner", n: { $sum: 1 } } }]),
    ]);
    const byPartner = {};
    for (const l of lines) (byPartner[String(l.partnerId?._id || l.partnerId)] ||= []).push(l);
    const instCount = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
    res.json({
      terms: TERMS,
      partners: partners.map((p) => ({ ...partnerView(p), contacts: p.contacts || "", notes: p.notes || "", institutes: instCount[String(p._id)] || 0, ...summarise(byPartner[String(p._id)] || []) })),
      commissions: lines.map((l) => ({
        id: l._id, date: l.createdAt, partner: l.partnerId ? { id: l.partnerId._id, name: l.partnerId.name, code: l.partnerId.code, phone: l.partnerId.phone, upiId: l.partnerId.upiId || "" } : null,
        institute: l.instituteName || "", kind: l.kind, base: l.baseAmount, amount: l.amount, status: l.status, dueBy: l.dueBy, paidAt: l.paidAt, payoutRef: l.payoutRef || "", note: l.note || "",
      })),
    });
  } catch (err) { next(err); }
};

// PUT /api/sales-partners/admin/:id { status?, notes?, upiId? }
export const adminUpdate = async (req, res, next) => {
  try {
    const p = await SalesPartner.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Partner not found" });
    const b = req.body || {};
    if (["active", "suspended"].includes(b.status)) p.status = b.status;
    if (b.notes !== undefined) p.notes = String(b.notes);
    if (b.upiId !== undefined) p.upiId = String(b.upiId).trim();
    await p.save();
    res.json({ partner: partnerView(p) });
  } catch (err) { next(err); }
};

// POST /api/sales-partners/admin/:id/reset-password
export const adminResetPassword = async (req, res, next) => {
  try {
    const p = await SalesPartner.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Partner not found" });
    const password = tempPassword();
    p.password = await bcrypt.hash(password, 10);
    await p.save();
    let emailed = true;
    await sendEmail({ to: p.email, subject: "Your new YNeet partner password", html: box(`<p>Your new password is <b>${password}</b>.</p><p><a href="${SITE()}/partner/login">Log in</a></p>`) }).catch(() => { emailed = false; });
    res.json({ password, emailed });
  } catch (err) { next(err); }
};

// POST /api/sales-partners/admin/commissions/:id { action: "pay" | "cancel" | "reopen", payoutRef? }
export const adminCommission = async (req, res, next) => {
  try {
    const l = await PartnerCommission.findById(req.params.id).populate("partnerId", "name email");
    if (!l) return res.status(404).json({ message: "Commission not found" });
    const { action, payoutRef } = req.body || {};
    if (action === "pay") {
      l.status = "paid"; l.paidAt = new Date(); l.payoutRef = String(payoutRef || "").trim();
      if (l.partnerId?.email) sendEmail({
        to: l.partnerId.email, subject: `Commission paid: ${inr(l.amount)}`,
        html: box(`<p>Hello ${esc(l.partnerId.name)},</p><p>We've paid your commission of <b>${inr(l.amount)}</b>${l.instituteName ? ` for <b>${esc(l.instituteName)}</b>` : ""}.${l.payoutRef ? ` Reference: ${esc(l.payoutRef)}.` : ""}</p><p>Thank you for growing YNeet with us!</p>`),
      }).catch(() => {});
    } else if (action === "cancel") { l.status = "cancelled"; }
    else if (action === "reopen") { l.status = "pending"; l.paidAt = undefined; l.payoutRef = undefined; }
    else return res.status(400).json({ message: "Unknown action" });
    await l.save();
    res.json({ ok: true });
  } catch (err) { next(err); }
};

// ───────── ClassCoach tutors (server-to-server) ─────────
// classcoach.in's "YNeet for your students" page turns a ClassCoach tutor into
// a YNeet sales partner in one tap, then shows their code, links and earnings.
// Guarded by X-Internal-Key = INTERNAL_SERVICE_KEY (same key the other
// internal routes use); switched off when that env var is missing.
const internalOk = (req) => {
  const want = process.env.INTERNAL_SERVICE_KEY || "";
  const got = String(req.headers["x-internal-key"] || "");
  return !!want && got.length === want.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want));
};

const tutorView = async (p) => {
  const [insts, lines] = await Promise.all([
    Institute.find({ salesPartner: p._id }).select("billing status endDate"),
    PartnerCommission.find({ partnerId: p._id }).select("amount status kind"),
  ]);
  return {
    partner: partnerView(p),
    terms: TERMS,
    stats: { ...summarise(lines), institutes: insts.length, paying: lines.filter((l) => l.kind === "first" && l.status !== "cancelled").length },
  };
};

// POST /api/sales-partners/internal/provision { name, email, phone, city?, classcoachTeacherId }
// Returns the existing partner for that email/phone, or creates one and emails
// a temporary password for the /partner dashboard.
export const internalProvision = async (req, res, next) => {
  try {
    if (!internalOk(req)) return res.status(401).json({ message: "Unauthorized" });
    const b = req.body || {};
    const name = String(b.name || "").trim();
    const email = String(b.email || "").trim().toLowerCase();
    const phone = phone10(b.phone);
    if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: "Name and email are required" });
    if (phone.length !== 10) return res.status(400).json({ message: "Add your 10-digit WhatsApp number in ClassCoach Settings first" });

    let p = await SalesPartner.findOne({ $or: [{ email }, { phone }] });
    let created = false;
    if (!p) {
      const pw = tempPassword();
      try {
        p = await SalesPartner.create({
          name, phone, email, city: String(b.city || "").trim(), occupation: "ClassCoach tutor",
          notes: `Joined from ClassCoach (teacher #${String(b.classcoachTeacherId || "").slice(0, 20)})`,
          password: await bcrypt.hash(pw, 10), code: await newCode(name),
        });
        created = true;
      } catch (e) {
        if (e?.code !== 11000) throw e;
        p = await SalesPartner.findOne({ $or: [{ email }, { phone }] }); // lost a race with a double tap
      }
      if (created) {
        sendEmail({
          to: p.email, subject: `Your YNeet partner code is ${p.code}`,
          html: box(`<p>Hello ${esc(p.name)},</p><p>You joined YNeet Partners from ClassCoach. Your code is <b style="font-size:18px;">${p.code}</b>.</p>
            <p>Coaching centres (or you, for your own students) that buy YNeet student logins through this link are tagged to you:<br/><a href="${instituteLink(p.code)}">${instituteLink(p.code)}</a></p>
            <p>You earn <b>${TERMS.firstRate * 100}%</b> of the first payment, <b>${TERMS.renewalRate * 100}%</b> of renewals, and <b>${inr(TERMS.bonusAmount)}</b> when your ${TERMS.bonusAfter}rd institute pays.</p>
            <p>Partner dashboard login: your email and the password <b>${pw}</b> (change it after logging in).</p>
            <p style="margin:20px 0;"><a href="${SITE()}/partner/login" style="background:#F2A93B;color:#14213D;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:999px;display:inline-block;">Open your dashboard</a></p>`),
        }).catch(() => {});
        sendEmail({
          to: ADMIN_ALERT_EMAIL, subject: `New YNeet partner from ClassCoach: ${p.name} (${p.code})`,
          html: box(`<p>${esc(p.name)} · ${esc(p.phone)} · ${esc(p.email)} joined YNeet Partners from their ClassCoach dashboard.</p>`),
        }).catch(() => {});
      }
    }
    if (p.status === "suspended") return res.status(403).json({ message: "This YNeet partner account is paused. Please WhatsApp YNeet." });
    res.status(created ? 201 : 200).json({ created, ...(await tutorView(p)) });
  } catch (err) { next(err); }
};

// GET /api/sales-partners/internal/summary?code=X — code, links and earnings
export const internalSummary = async (req, res, next) => {
  try {
    if (!internalOk(req)) return res.status(401).json({ message: "Unauthorized" });
    const p = await SalesPartner.findOne({ code: String(req.query.code || "").trim().toUpperCase() });
    if (!p) return res.status(404).json({ message: "Partner not found" });
    res.json(await tutorView(p));
  } catch (err) { next(err); }
};
