import bcrypt from "bcryptjs";
import Institute from "../models/Institute.js";
import Student from "../models/Student.js";
import InstitutePayment from "../models/InstitutePayment.js";
import { sendEmail } from "../utils/sendEmail.js";
import { yneetPost } from "../utils/yneetSync.js";
import { MONTHLY_PLANS, PACKS, instituteView, resyncAll, signInstituteToken, seatFilter } from "./instituteController.js";

// Monthly institute plans, paid online. Razorpay keys live in the YNeet backend;
// we ask it to create orders and to verify payments (utils/yneetSync.yneetPost).

const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || "alimail791@gmail.com";
const SITE = () => (process.env.CLIENT_URL || "https://www.yneet.in").replace(/\/$/, "");
const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const box = (inner) => `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px;"><h2 style="color:#14213D;">YNeet</h2>${inner}<p style="color:#888;font-size:12px;margin-top:24px;">YNeet · NEET preparation</p></div>`;
const planFor = (seats) => MONTHLY_PLANS.find((p) => p.seats === Number(seats));

// ───────── Refer & earn ─────────
export const REFERRAL_DISCOUNT = 0.4;
export const discounted = (price) => Math.round(price * (1 - REFERRAL_DISCOUNT));
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const makeCode = (name) => {
  const base = String(name || "YN").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4).padEnd(3, "X");
  let tail = ""; for (let i = 0; i < 4; i++) tail += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return base + tail;
};
// Returns the institute's referral code, creating one the first time.
export async function ensureReferralCode(inst) {
  if (inst.referralCode) return inst.referralCode;
  for (let i = 0; i < 6; i++) {
    const code = makeCode(inst.name);
    if (!(await Institute.findOne({ referralCode: code }))) {
      await Institute.updateOne({ _id: inst._id }, { $set: { referralCode: code } });
      inst.referralCode = code;
      return code;
    }
  }
  throw new Error("Could not create a referral code");
}
const findReferrer = async (code, email, phone) => {
  const c = String(code || "").trim().toUpperCase();
  if (!c) return null;
  const ref = await Institute.findOne({ referralCode: c });
  if (!ref || ref.email === email || (phone && ref.phone && String(ref.phone).replace(/\D/g, "").slice(-10) === phone)) return null; // no self-referral
  return ref;
};
// Called once a referred institute's first plan is paid (online or set up by admin).
export async function creditReferrer(referrerId, newInst) {
  if (!referrerId) return;
  const ref = await Institute.findByIdAndUpdate(referrerId, { $inc: { referralCredits: 1 } }, { new: true });
  if (!ref) return;
  sendEmail({
    to: ref.email, subject: `You earned 40% off — ${newInst.name} joined YNeet with your link`,
    html: box(`<p>Hello ${esc(ref.contactName || ref.name)},</p><p><b>${esc(newInst.name)}</b> just joined YNeet using your referral link. 🎉</p>
      <p>You've earned <b>40% off your next purchase</b>. You now have <b>${ref.referralCredits}</b> discount${ref.referralCredits > 1 ? "s" : ""} waiting — ${ref.billing === "monthly" ? "it's applied automatically when you renew from your panel" : "we'll apply it to your next yearly renewal"}.</p>
      <p>Keep sharing: <a href="${SITE()}/institutes?ref=${ref.referralCode}">${SITE()}/institutes?ref=${ref.referralCode}</a></p>`),
  }).catch(() => {});
}

// One calendar month later, same date (31 Jan → 28/29 Feb).
export const addMonth = (from) => {
  const d = new Date(from);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return d;
};

// N calendar months later.
export const addMonths = (from, n = 1) => {
  const d = new Date(from);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return d;
};
export const MAX_MONTHS = 12;
const monthsOf = (v) => Math.min(MAX_MONTHS, Math.max(1, parseInt(v, 10) || 1));
// Price for `months` months; a referral credit takes 40% off ONE month of the order.
export const priceFor = (plan, months, useCredit) => {
  const list = plan.price * months;
  return { list, amount: useCredit ? list - (plan.price - discounted(plan.price)) : list };
};
const monthsLabel = (m) => `${m} month${m > 1 ? "s" : ""}`;

// GET /api/institute/plans — public price list
export const getPlans = (req, res) => res.json({ monthly: MONTHLY_PLANS, yearly: PACKS, maxMonths: MAX_MONTHS });

const createOrder = async (amount, receipt, notes) =>
  yneetPost("razorpay/order", { amount: Math.round(amount * 100), receipt, notes });

const verify = async (orderId, paymentId, signature) => {
  const r = await yneetPost("razorpay/verify", { orderId, paymentId, signature });
  return r.valid === true;
};

const notifyAdmin = (subject, rows) =>
  sendEmail({
    to: ADMIN_ALERT_EMAIL, subject,
    html: box(`<table style="font-size:14px;">${rows.map(([k, v]) => `<tr><td style="color:#888;padding:3px 12px 3px 0;">${k}</td><td>${esc(v)}</td></tr>`).join("")}</table>`),
  }).catch((e) => console.warn("Admin alert failed:", e.message));

// ───────── New institute: sign up + pay ─────────

// POST /api/institute/signup/order { seats, name, contactName, email, phone, city, board, password }
export const signupOrder = async (req, res, next) => {
  try {
    const b = req.body || {};
    const plan = planFor(b.seats);
    if (!plan) return res.status(400).json({ message: "Choose a plan" });
    const email = String(b.email || "").trim().toLowerCase();
    if (!b.name?.trim() || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: "Institute name and a valid email are required" });
    const phone = String(b.phone || "").replace(/\D/g, "").slice(-10);
    if (phone.length !== 10) return res.status(400).json({ message: "Enter a 10-digit phone number" });
    if (String(b.password || "").length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
    if (await Institute.findOne({ email })) return res.status(409).json({ message: "An institute account with this email already exists. Log in to renew or change your plan." });

    const referrer = await findReferrer(b.ref, email, phone);
    const months = monthsOf(b.months);
    const { amount } = priceFor(plan, months, false);
    const order = await createOrder(amount, `inst_new_${Date.now()}`, { kind: "new", seats: String(plan.seats), months: String(months), email, ...(referrer && { ref: referrer.referralCode }) });
    await InstitutePayment.create({
      orderId: order.orderId, kind: "new", seats: plan.seats, months, amount, listPrice: amount,
      ...(referrer && { referrerId: referrer._id }),
      signup: {
        name: b.name.trim(), contactName: String(b.contactName || "").trim(), email, phone,
        city: String(b.city || "").trim(), board: ["CBSE", "Tamil Nadu State Board"].includes(b.board) ? b.board : "CBSE",
        passwordHash: await bcrypt.hash(String(b.password), 10),
      },
    });
    res.json({ orderId: order.orderId, amount: order.amount, keyId: order.keyId, plan, prefill: { name: b.contactName || b.name, email, contact: phone } });
  } catch (err) {
    if (/YNeet|payment|fetch/i.test(err.message)) return res.status(502).json({ message: "Payment service is not reachable right now. Please try again in a minute." });
    next(err);
  }
};

// POST /api/institute/signup/verify { orderId, paymentId, signature }
export const signupVerify = async (req, res, next) => {
  try {
    const { orderId, paymentId, signature } = req.body || {};
    const pay = await InstitutePayment.findOne({ orderId, kind: "new" });
    if (!pay) return res.status(404).json({ message: "Payment not found" });
    if (pay.status === "paid" && pay.instituteId) {
      const inst = await Institute.findById(pay.instituteId);
      return res.json({ token: signInstituteToken(inst), institute: instituteView(inst, 0), alreadyActivated: true });
    }
    if (!(await verify(orderId, paymentId, signature))) {
      pay.status = "failed"; await pay.save();
      return res.status(400).json({ message: "Payment could not be verified. If money was deducted, WhatsApp us with your payment ID." });
    }
    const s = pay.signup;
    let inst = await Institute.findOne({ email: s.email }).select("+password");
    const start = new Date();
    if (!inst) {
      inst = await Institute.create({
        name: s.name, contactName: s.contactName, email: s.email, phone: s.phone, city: s.city, board: s.board,
        password: s.passwordHash, seats: pay.seats, amountPaid: pay.amount, paymentRef: `Razorpay ${paymentId}`,
        startDate: start, endDate: addMonths(start, pay.months || 1), billing: "monthly",
        ...(pay.referrerId && { referredBy: pay.referrerId }),
      });
      await ensureReferralCode(inst).catch(() => {});
      await creditReferrer(pay.referrerId, inst);
    }
    pay.status = "paid"; pay.paymentId = paymentId; pay.paidAt = new Date(); pay.instituteId = inst._id;
    await pay.save();

    sendEmail({
      to: inst.email, subject: `Welcome to YNeet — ${inst.name}`,
      html: box(`<p>Hello ${esc(inst.contactName || inst.name)},</p>
        <p>Thank you! Your payment of <b>${inr(pay.amount)}</b> was received. Your YNeet plan for <b>${pay.seats} students · ${monthsLabel(pay.months || 1)}</b> is active until <b>${fmtDate(inst.endDate)}</b>.</p>
        <p style="margin:20px 0;"><a href="${SITE()}/institute/login" style="background:#F2A93B;color:#14213D;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:999px;display:inline-block;">Open Institute Login</a></p>
        <p style="font-size:13px;color:#555;">Button not working? Copy this into your browser: <b>www.yneet.in/institute/login</b></p>
        <p><b>Login email:</b> ${esc(inst.email)}<br/>Use the password you chose at sign-up.</p>
        <p>Add your students from the panel — each gets their own login. Payment ID: ${esc(paymentId)}</p>`),
    }).catch((e) => console.warn("Institute welcome email failed:", e.message));
    notifyAdmin(`New monthly institute: ${inst.name} (${inr(pay.amount)})`, [["Institute", inst.name], ["Contact", `${inst.contactName || ""} ${inst.phone || ""}`], ["Email", inst.email], ["City", inst.city || ""], ["Plan", `${pay.seats} students × ${monthsLabel(pay.months || 1)}`], ["Amount", inr(pay.amount)], ["Valid till", fmtDate(inst.endDate)], ["Payment", paymentId], ["Referred by", pay.referrerId ? String((await Institute.findById(pay.referrerId))?.name || "") : "—"]]);

    res.json({ token: signInstituteToken(inst), institute: instituteView(inst, 0) });
  } catch (err) {
    if (/YNeet|verify|fetch/i.test(err.message)) return res.status(502).json({ message: "Couldn't confirm the payment right now. Please don't pay again — refresh in a minute or WhatsApp us." });
    next(err);
  }
};

// ───────── Existing institute: renew / change plan ─────────

// POST /api/institute/billing/order { seats }
export const renewOrder = async (req, res, next) => {
  try {
    const inst = req.institute;
    if ((inst.billing || "yearly") !== "monthly") return res.status(400).json({ message: "Your institute is on a yearly pack. Please contact YNeet on WhatsApp to renew." });
    const plan = planFor(req.body?.seats);
    if (!plan) return res.status(400).json({ message: "Choose a plan" });
    const used = await Student.countDocuments(seatFilter(inst._id));
    if (plan.seats < used) return res.status(400).json({ message: `You have ${used} students. Remove ${used - plan.seats} first, or choose a bigger plan.` });
    const useCredit = (inst.referralCredits || 0) > 0;
    const months = monthsOf(req.body?.months);
    const { list, amount } = priceFor(plan, months, useCredit);
    const order = await createOrder(amount, `inst_renew_${Date.now()}`, { kind: "renew", seats: String(plan.seats), months: String(months), instituteId: String(inst._id), ...(useCredit && { referral: "40% of 1 month" }) });
    await InstitutePayment.create({ orderId: order.orderId, kind: "renew", seats: plan.seats, months, amount, listPrice: list, referralDiscount: useCredit, instituteId: inst._id });
    res.json({ orderId: order.orderId, amount: order.amount, keyId: order.keyId, plan, months, price: amount, listPrice: list, referralDiscount: useCredit, prefill: { name: inst.contactName || inst.name, email: inst.email, contact: inst.phone || "" } });
  } catch (err) {
    if (/YNeet|payment|fetch/i.test(err.message)) return res.status(502).json({ message: "Payment service is not reachable right now. Please try again in a minute." });
    next(err);
  }
};

// POST /api/institute/billing/verify { orderId, paymentId, signature }
export const renewVerify = async (req, res, next) => {
  try {
    const { orderId, paymentId, signature } = req.body || {};
    const pay = await InstitutePayment.findOne({ orderId, kind: "renew", instituteId: req.institute._id });
    if (!pay) return res.status(404).json({ message: "Payment not found" });
    let inst = await Institute.findById(req.institute._id);
    if (pay.status !== "paid") {
      if (!(await verify(orderId, paymentId, signature))) {
        pay.status = "failed"; await pay.save();
        return res.status(400).json({ message: "Payment could not be verified. If money was deducted, WhatsApp us with your payment ID." });
      }
      // Extend from the current end date if still active, so no days are lost.
      const from = inst.endDate && inst.endDate > new Date() ? inst.endDate : new Date();
      inst.endDate = addMonths(from, pay.months || 1);
      inst.seats = pay.seats;
      inst.status = "active";
      inst.amountPaid = (inst.amountPaid || 0) + pay.amount;
      inst.paymentRef = `Razorpay ${paymentId}`;
      if (pay.referralDiscount) inst.referralCredits = Math.max(0, (inst.referralCredits || 0) - 1);
      await inst.save();
      pay.status = "paid"; pay.paymentId = paymentId; pay.paidAt = new Date();
      await pay.save();
      resyncAll(inst).catch(() => {});
      sendEmail({
        to: inst.email, subject: "YNeet plan renewed",
        html: box(`<p>Thank you! We received <b>${inr(pay.amount)}</b>${pay.referralDiscount ? ` (40% referral discount applied — you saved ${inr(pay.listPrice - pay.amount)})` : ""}. Your plan for <b>${pay.seats} students</b> (${monthsLabel(pay.months || 1)}) is now active until <b>${fmtDate(inst.endDate)}</b>.</p><p>Payment ID: ${esc(paymentId)}</p>`),
      }).catch(() => {});
      notifyAdmin(`Institute renewed: ${inst.name} (${inr(pay.amount)})`, [["Institute", inst.name], ["Plan", `${pay.seats} students × ${monthsLabel(pay.months || 1)}`], ["Amount", inr(pay.amount) + (pay.referralDiscount ? " (40% referral credit)" : "")], ["Valid till", fmtDate(inst.endDate)], ["Payment", paymentId]]);
    }
    const used = await Student.countDocuments(seatFilter(inst._id));
    res.json({ institute: instituteView(inst, used) });
  } catch (err) {
    if (/YNeet|verify|fetch/i.test(err.message)) return res.status(502).json({ message: "Couldn't confirm the payment right now. Please don't pay again — refresh in a minute or WhatsApp us." });
    next(err);
  }
};

// GET /api/institute/billing/history — this institute's online payments
export const billingHistory = async (req, res, next) => {
  try {
    const list = await InstitutePayment.find({ instituteId: req.institute._id, status: "paid" }).sort({ paidAt: -1 }).limit(24);
    res.json({ payments: list.map((p) => ({ date: p.paidAt, amount: p.amount, seats: p.seats, months: p.months || 1, paymentId: p.paymentId })) });
  } catch (err) { next(err); }
};

// ───────── Daily: renewal reminders for monthly plans ─────────
export async function sendRenewalReminders() {
  const now = new Date();
  const in3 = new Date(now.getTime() + 3 * 864e5);
  const due = await Institute.find({ billing: "monthly", status: "active", endDate: { $gt: now, $lte: in3 } });
  for (const inst of due) {
    if (inst.reminderSentFor && +inst.reminderSentFor === +inst.endDate) continue;
    const plan = planFor(inst.seats) || MONTHLY_PLANS[0];
    try {
      await sendEmail({
        to: inst.email, subject: `Your YNeet plan ends on ${fmtDate(inst.endDate)} — renew now`,
        html: box(`<p>Hello ${esc(inst.contactName || inst.name)},</p><p>Your YNeet plan for <b>${inst.seats} students</b> ends on <b>${fmtDate(inst.endDate)}</b>. After that your students can't take tests.</p>
          <p>Renew for 1 month (${inr(plan.price)}) or more months at once, in a minute from your panel: <a href="${SITE()}/institute/login">${SITE()}/institute/login</a> → Renew.</p><p>Renewing early adds the new month after your current end date, so no days are lost.</p>`),
      });
      inst.reminderSentFor = inst.endDate; await inst.save();
    } catch (e) { console.warn("Renewal reminder failed:", inst.email, e.message); }
  }
  const expired = await Institute.find({ billing: "monthly", status: "active", endDate: { $lte: now, $gt: new Date(now.getTime() - 2 * 864e5) } });
  for (const inst of expired) {
    if (inst.expiredNoticeFor && +inst.expiredNoticeFor === +inst.endDate) continue;
    try {
      await sendEmail({
        to: inst.email, subject: "Your YNeet plan has ended — students are paused",
        html: box(`<p>Your YNeet plan ended on <b>${fmtDate(inst.endDate)}</b>, so your students can't use YNeet right now.</p><p>Renew from your panel to restore access instantly: <a href="${SITE()}/institute/login">${SITE()}/institute/login</a></p>`),
      });
      inst.expiredNoticeFor = inst.endDate; await inst.save();
      resyncAll(inst).catch(() => {}); // removes students' access in YNeet
    } catch (e) { console.warn("Expiry notice failed:", inst.email, e.message); }
  }
  if (due.length || expired.length) console.log(`Institute renewal reminders: ${due.length} due soon, ${expired.length} just expired.`);
}

// Runs daily at 10:15 IST.
export function startRenewalReminderJob() {
  const RUN = 4 * 60 + 45; // 04:45 UTC
  const next = () => { const n = new Date(), t = new Date(n); t.setUTCHours(0, RUN, 0, 0); if (t <= n) t.setUTCDate(t.getUTCDate() + 1); return t - n; };
  const schedule = () => setTimeout(async () => { await sendRenewalReminders().catch((e) => console.warn("Renewal reminders failed:", e.message)); schedule(); }, next());
  schedule();
}

// GET /api/institute/referral — code, link, referred institutes, credits
export const referralInfo = async (req, res, next) => {
  try {
    const inst = await Institute.findById(req.institute._id);
    const code = await ensureReferralCode(inst);
    const referred = await Institute.find({ referredBy: inst._id }).select("name city createdAt").sort({ createdAt: -1 });
    res.json({
      code, link: `${SITE()}/institutes?ref=${code}`, credits: inst.referralCredits || 0, discountPct: REFERRAL_DISCOUNT * 100,
      referred: referred.map((r) => ({ name: r.name, city: r.city || "", joined: r.createdAt })),
      billing: inst.billing || "yearly",
    });
  } catch (err) { next(err); }
};

// GET /api/institute/referral/check?code=X — public: is this a valid referral code?
export const checkReferral = async (req, res) => {
  const ref = await Institute.findOne({ referralCode: String(req.query.code || "").trim().toUpperCase() }).select("name city").catch(() => null);
  res.json(ref ? { valid: true, name: ref.name } : { valid: false });
};
