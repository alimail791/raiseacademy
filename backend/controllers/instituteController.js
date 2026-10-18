import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Institute from "../models/Institute.js";
import Student from "../models/Student.js";
import { sendEmail, otpEmailTemplate } from "../utils/sendEmail.js";
import Otp from "../models/Otp.js";
import { syncYneetAccess, yneetPost } from "../utils/yneetSync.js";

// Standard bulk packs (one year). Admin can still enter any seat count / amount.
export const PACKS = [
  { seats: 20, price: 100000 },
  { seats: 50, price: 200000 },
  { seats: 100, price: 300000 },
];

const SITE = () => (process.env.CLIENT_URL || "https://www.yneet.in").replace(/\/$/, "");
const tempPassword = () => crypto.randomBytes(6).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).padEnd(8, "7");
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const box = (inner) => `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px;"><h2 style="color:#14213D;">YNeet</h2>${inner}<p style="color:#888;font-size:12px;margin-top:24px;">YNeet · NEET preparation</p></div>`;

const instituteView = (i, seatsUsed) => ({
  id: i._id, name: i.name, contactName: i.contactName, email: i.email, phone: i.phone, city: i.city, board: i.board,
  seats: i.seats, seatsUsed, seatsLeft: Math.max(0, i.seats - seatsUsed), amountPaid: i.amountPaid, paymentRef: i.paymentRef,
  startDate: i.startDate, endDate: i.endDate, status: i.status, notes: i.notes, live: i.isLive(), createdAt: i.createdAt,
});

const studentView = (s) => ({
  id: s._id, fullName: s.fullName, email: s.email, phone: s.phone, gender: s.gender,
  currentClass: s.currentClass, course: s.course, createdAt: s.createdAt,
});

const resyncAll = async (institute) => {
  const students = await Student.find({ instituteId: institute._id }).select("_id");
  for (const s of students) await syncYneetAccess(s._id, institute);
};

// ───────────────────────── Admin ─────────────────────────

export const adminListInstitutes = async (req, res, next) => {
  try {
    const list = await Institute.find().sort({ createdAt: -1 });
    const counts = await Student.aggregate([{ $match: { instituteId: { $ne: null } } }, { $group: { _id: "$instituteId", n: { $sum: 1 } } }]);
    const used = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
    res.json({ packs: PACKS, institutes: list.map((i) => instituteView(i, used[String(i._id)] || 0)) });
  } catch (err) { next(err); }
};

export const adminCreateInstitute = async (req, res, next) => {
  try {
    const { name, contactName, email, phone, city, board, seats, amountPaid, paymentRef, startDate, notes } = req.body;
    if (!name || !email || !seats) return res.status(400).json({ message: "Name, email and seats are required" });
    if (await Institute.findOne({ email: String(email).toLowerCase() })) return res.status(409).json({ message: "An institute with this email already exists" });

    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start); end.setFullYear(end.getFullYear() + 1);
    const password = tempPassword();
    const inst = await Institute.create({
      name, contactName, email, phone, city, board: board || "CBSE", seats: Number(seats),
      amountPaid: Number(amountPaid) || 0, paymentRef, startDate: start, endDate: end, notes,
      password: await bcrypt.hash(password, 10),
    });

    let emailed = true;
    await sendEmail({
      to: inst.email,
      subject: `Your YNeet institute account — ${inst.name}`,
      html: box(`<p>Hello ${esc(inst.contactName || inst.name)},</p>
        <p>Your YNeet pack for <b>${inst.seats} students</b> is active until <b>${fmtDate(inst.endDate)}</b>.</p>
        <p>Log in to your institute panel to add your students. Each student gets their own YNeet login by email.</p>
        <p><b>Login:</b> <a href="${SITE()}/institute">${SITE()}/institute</a><br/><b>Email:</b> ${esc(inst.email)}<br/><b>Password:</b> ${password}</p>
        <p>Please change the password after your first login.</p>`),
    }).catch((e) => { emailed = false; console.warn("Institute welcome email failed:", e.message); });

    // Password is returned once so the admin can share it if the email didn't arrive.
    res.status(201).json({ institute: instituteView(inst, 0), password, emailed });
  } catch (err) { next(err); }
};

export const adminUpdateInstitute = async (req, res, next) => {
  try {
    const inst = await Institute.findById(req.params.id);
    if (!inst) return res.status(404).json({ message: "Institute not found" });
    const used = await Student.countDocuments({ instituteId: inst._id });
    const b = req.body;
    if (b.seats !== undefined && Number(b.seats) < used) return res.status(400).json({ message: `This institute already uses ${used} seats. Remove students first or keep at least ${used} seats.` });
    for (const k of ["name", "contactName", "phone", "city", "board", "paymentRef", "notes", "status"]) if (b[k] !== undefined) inst[k] = b[k];
    if (b.seats !== undefined) inst.seats = Number(b.seats);
    if (b.amountPaid !== undefined) inst.amountPaid = Number(b.amountPaid) || 0;
    if (b.endDate) inst.endDate = new Date(b.endDate);
    // Renew = one more year from today or from the current end date, whichever is later.
    if (b.renew) {
      const from = inst.endDate > new Date() ? new Date(inst.endDate) : new Date();
      from.setFullYear(from.getFullYear() + 1);
      inst.endDate = from;
      inst.status = "active";
    }
    await inst.save();
    resyncAll(inst).catch(() => {});
    res.json({ institute: instituteView(inst, used) });
  } catch (err) { next(err); }
};

export const adminResetInstitutePassword = async (req, res, next) => {
  try {
    const inst = await Institute.findById(req.params.id);
    if (!inst) return res.status(404).json({ message: "Institute not found" });
    const password = tempPassword();
    inst.password = await bcrypt.hash(password, 10);
    await inst.save();
    let emailed = true;
    await sendEmail({
      to: inst.email, subject: "Your YNeet institute password was reset",
      html: box(`<p>Your new password for <a href="${SITE()}/institute">${SITE()}/institute</a> is <b>${password}</b>.</p>`),
    }).catch(() => { emailed = false; });
    res.json({ password, emailed });
  } catch (err) { next(err); }
};

export const adminInstituteStudents = async (req, res, next) => {
  try {
    const students = await Student.find({ instituteId: req.params.id }).sort({ fullName: 1 });
    res.json({ students: students.map(studentView) });
  } catch (err) { next(err); }
};

export const adminDeleteInstitute = async (req, res, next) => {
  try {
    const inst = await Institute.findById(req.params.id);
    if (!inst) return res.status(404).json({ message: "Institute not found" });
    const students = await Student.find({ instituteId: inst._id }).select("_id");
    await Student.updateMany({ instituteId: inst._id }, { $unset: { instituteId: 1 } });
    for (const s of students) await syncYneetAccess(s._id, null);
    await inst.deleteOne();
    res.json({ ok: true, studentsUnlinked: students.length });
  } catch (err) { next(err); }
};

// ───────────────────────── Institute panel ─────────────────────────

const signInstituteToken = (inst) => jwt.sign({ iid: String(inst._id), typ: "institute" }, process.env.JWT_SECRET, { expiresIn: "7d" });

export const protectInstitute = async (req, res, next) => {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Please log in" });
    const d = jwt.verify(token, process.env.JWT_SECRET);
    if (d.typ !== "institute" || !d.iid) return res.status(401).json({ message: "Please log in" });
    const inst = await Institute.findById(d.iid);
    if (!inst) return res.status(401).json({ message: "Institute account not found" });
    req.institute = inst;
    next();
  } catch { res.status(401).json({ message: "Session expired. Please log in again." }); }
};

export const instituteLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
    const inst = await Institute.findOne({ email: String(email).toLowerCase() }).select("+password");
    if (!inst || !(await bcrypt.compare(password, inst.password))) return res.status(401).json({ message: "Invalid email or password" });
    const used = await Student.countDocuments({ instituteId: inst._id });
    res.json({ token: signInstituteToken(inst), institute: instituteView(inst, used) });
  } catch (err) { next(err); }
};

export const instituteMe = async (req, res, next) => {
  try {
    const used = await Student.countDocuments({ instituteId: req.institute._id });
    res.json({ institute: instituteView(req.institute, used) });
  } catch (err) { next(err); }
};

export const instituteChangePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || String(newPassword).length < 6) return res.status(400).json({ message: "New password must be at least 6 characters" });
    const inst = await Institute.findById(req.institute._id).select("+password");
    if (!(await bcrypt.compare(currentPassword || "", inst.password))) return res.status(401).json({ message: "Current password is wrong" });
    inst.password = await bcrypt.hash(newPassword, 10);
    await inst.save();
    res.json({ ok: true });
  } catch (err) { next(err); }
};

export const instituteListStudents = async (req, res, next) => {
  try {
    const students = await Student.find({ instituteId: req.institute._id }).sort({ fullName: 1 });
    res.json({ students: students.map(studentView) });
  } catch (err) { next(err); }
};

const normGender = (g) => {
  const v = String(g || "").trim().toLowerCase();
  if (["m", "male", "boy"].includes(v)) return "Male";
  if (["f", "female", "girl"].includes(v)) return "Female";
  if (["o", "other"].includes(v)) return "Other";
  return null;
};
const normClass = (c) => {
  const v = String(c || "").trim().toLowerCase().replace(/(st|nd|rd|th|std)$/, "").trim();
  if (["dropper", "repeater", "drop"].includes(v)) return "Dropper";
  return ["6", "7", "8", "9", "10", "11", "12"].includes(v) ? v : null;
};

// POST /api/institute/students  { students: [{ fullName, email, phone, gender, currentClass }] }
// Adds up to the seats left. Existing Raise Academy accounts are linked (they keep
// their password); new ones are created with a temporary password sent by email.
export const instituteAddStudents = async (req, res, next) => {
  try {
    const inst = req.institute;
    if (!inst.isLive()) return res.status(403).json({ message: inst.status === "suspended" ? "Your institute account is suspended. Please contact YNeet." : "Your pack has expired. Please contact YNeet to renew." });
    const rows = Array.isArray(req.body.students) ? req.body.students.slice(0, 500) : [];
    if (!rows.length) return res.status(400).json({ message: "No students to add" });

    let used = await Student.countDocuments({ instituteId: inst._id });
    const results = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] || {};
      const fullName = String(r.fullName || r.name || "").trim();
      const email = String(r.email || "").trim().toLowerCase();
      const phone = String(r.phone || "").trim();
      const gender = normGender(r.gender);
      const cls = normClass(r.currentClass || r.class);
      const fail = (message) => results.push({ row: i + 1, email, ok: false, message });

      if (!fullName || !/^\S+@\S+\.\S+$/.test(email) || !phone) { fail("Name, valid email and phone are required"); continue; }
      if (used >= inst.seats) { fail(`No seats left (${inst.seats} in your pack)`); continue; }

      const existing = await Student.findOne({ email });
      if (existing) {
        if (existing.instituteId && String(existing.instituteId) === String(inst._id)) { fail("Already in your list"); continue; }
        if (existing.instituteId) { fail("This student is already assigned to another institute"); continue; }
        await Student.updateOne({ _id: existing._id }, { $set: { instituteId: inst._id } });
        used++;
        await syncYneetAccess(existing._id, inst);
        sendEmail({
          to: email, subject: `${inst.name} has given you YNeet access`,
          html: box(`<p>Hi ${esc(existing.fullName)},</p><p><b>${esc(inst.name)}</b> has added you to YNeet until <b>${fmtDate(inst.endDate)}</b>.</p><p>Log in at <a href="${SITE()}/login">${SITE()}/login</a> with your existing email and password, then open YNeet.</p>`),
        }).catch(() => {});
        results.push({ row: i + 1, email, ok: true, linked: true });
        continue;
      }

      if (!gender) { fail("Gender must be Male, Female or Other"); continue; }
      if (!cls) { fail("Class must be 6–12 or Dropper"); continue; }
      const password = tempPassword();
      try {
        const s = await Student.create({
          fullName, email, phone, gender, place: inst.city || "—", board: inst.board || "CBSE",
          course: ["11", "12", "Dropper"].includes(cls) ? "NEET Coaching" : "NEET Foundation",
          currentClass: cls, password: await bcrypt.hash(password, 10), instituteId: inst._id,
          currentSessionId: crypto.randomBytes(16).toString("hex"),
        });
        used++;
        await syncYneetAccess(s._id, inst);
        let emailed = true;
        await sendEmail({
          to: email, subject: `Your YNeet login from ${inst.name}`,
          html: box(`<p>Hi ${esc(fullName)},</p><p><b>${esc(inst.name)}</b> has given you full YNeet NEET preparation access until <b>${fmtDate(inst.endDate)}</b>: mock tests, PYQs, practice and analysis.</p>
            <p><b>Login:</b> <a href="${SITE()}/login">${SITE()}/login</a><br/><b>Email:</b> ${esc(email)}<br/><b>Password:</b> ${password}</p>
            <p>After logging in, tap <b>Open YNeet</b>. You can change your password using “Forgot password”.</p>`),
        }).catch(() => { emailed = false; });
        // Password returned so the institute can share it if the email bounces.
        results.push({ row: i + 1, email, ok: true, password, emailed });
      } catch (e) { fail(e.message); }
    }
    res.json({ added: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, seatsLeft: Math.max(0, inst.seats - used), results });
  } catch (err) { next(err); }
};

// DELETE /api/institute/students/:id — frees the seat; the student keeps their
// Raise Academy account but loses the institute's YNeet access.
export const instituteRemoveStudent = async (req, res, next) => {
  try {
    const s = await Student.findOne({ _id: req.params.id, instituteId: req.institute._id });
    if (!s) return res.status(404).json({ message: "Student not found in your list" });
    await Student.updateOne({ _id: s._id }, { $unset: { instituteId: 1 } });
    await syncYneetAccess(s._id, null);
    res.json({ ok: true });
  } catch (err) { next(err); }
};

// POST /api/institute/students/:id/resend — new temporary password, emailed again.
export const instituteResendLogin = async (req, res, next) => {
  try {
    const s = await Student.findOne({ _id: req.params.id, instituteId: req.institute._id });
    if (!s) return res.status(404).json({ message: "Student not found in your list" });
    const password = tempPassword();
    await Student.updateOne({ _id: s._id }, { $set: { password: await bcrypt.hash(password, 10) } });
    let emailed = true;
    await sendEmail({
      to: s.email, subject: "Your YNeet login",
      html: box(`<p>Hi ${esc(s.fullName)},</p><p><b>Login:</b> <a href="${SITE()}/login">${SITE()}/login</a><br/><b>Email:</b> ${esc(s.email)}<br/><b>Password:</b> ${password}</p>`),
    }).catch(() => { emailed = false; });
    res.json({ password, emailed });
  } catch (err) { next(err); }
};

// ───────────────────────── Forgot password (institute) ─────────────────────────
// Step 1: POST /api/institute/forgot { email } → 6-digit code by email (10 min).
// Always answers the same way so the form can't be used to check which emails exist.
export const instituteForgotPassword = async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Enter your institute email" });
    const inst = await Institute.findOne({ email });
    if (inst) {
      const code = crypto.randomInt(100000, 999999).toString();
      await Otp.deleteMany({ email, purpose: "institute-reset" });
      await Otp.create({ email, purpose: "institute-reset", codeHash: await bcrypt.hash(code, 10), expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
      await sendEmail({ to: email, subject: "YNeet Institute — Password Reset Code", html: otpEmailTemplate(code, "reset") });
    }
    res.json({ message: "If this email has an institute account, a 6-digit code has been sent to it." });
  } catch (err) { next(err); }
};

// Step 2: POST /api/institute/reset-password { email, code, newPassword } → logs the institute in.
export const instituteResetPassword = async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const { code, newPassword } = req.body;
    if (!email || !code || !newPassword) return res.status(400).json({ message: "Email, code and new password are required" });
    if (String(newPassword).length < 6) return res.status(400).json({ message: "New password must be at least 6 characters" });
    const otp = await Otp.findOne({ email, purpose: "institute-reset" }).sort({ createdAt: -1 });
    if (!otp || otp.expiresAt < new Date()) return res.status(400).json({ message: "Code expired. Please request a new one." });
    if (otp.attempts >= 5) return res.status(429).json({ message: "Too many wrong attempts. Please request a new code." });
    if (!(await bcrypt.compare(String(code).trim(), otp.codeHash))) {
      otp.attempts += 1; await otp.save();
      return res.status(400).json({ message: "Incorrect code" });
    }
    const inst = await Institute.findOne({ email });
    if (!inst) return res.status(400).json({ message: "Institute account not found" });
    inst.password = await bcrypt.hash(newPassword, 10);
    await inst.save();
    await Otp.deleteMany({ email, purpose: "institute-reset" });
    const used = await Student.countDocuments({ instituteId: inst._id });
    res.json({ message: "Password changed", token: signInstituteToken(inst), institute: instituteView(inst, used) });
  } catch (err) { next(err); }
};

// ───────────────────────── Student progress (from YNeet) ─────────────────────────

const progressFor = async (instituteId) => {
  const students = await Student.find({ instituteId }).sort({ fullName: 1 });
  if (!students.length) return { summary: null, students: [] };
  const data = await yneetPost("institute-progress", { userIds: students.map((s) => String(s._id)) });
  const byId = Object.fromEntries((data.students || []).map((p) => [p.userId, p]));
  return {
    summary: data.summary,
    students: students.map((s) => ({ ...studentView(s), progress: byId[String(s._id)] || { joined: false } })),
  };
};

// GET /api/institute/progress
export const instituteProgress = async (req, res, next) => {
  try { res.json(await progressFor(req.institute._id)); }
  catch (err) { res.status(502).json({ message: "Couldn't load progress right now. Please try again in a minute." }); }
};

// GET /api/institute/progress/:id — one student (must belong to this institute)
export const instituteStudentProgress = async (req, res, next) => {
  try {
    const s = await Student.findOne({ _id: req.params.id, instituteId: req.institute._id });
    if (!s) return res.status(404).json({ message: "Student not found in your list" });
    const detail = await yneetPost("institute-student", { userId: String(s._id) });
    res.json({ student: studentView(s), detail });
  } catch (err) { res.status(502).json({ message: "Couldn't load this student's progress. Please try again." }); }
};

// GET /api/institute/progress.csv
export const instituteProgressCsv = async (req, res, next) => {
  try {
    const { students } = await progressFor(req.institute._id);
    const esc = (v) => { if (v === null || v === undefined) return ""; const s = String(v); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const d = (x) => (x ? new Date(x).toISOString().slice(0, 10) : "");
    const cols = ["Name", "Email", "Phone", "Class", "Started YNeet", "Days active (7d)", "Tests (7d)", "Tests (30d)", "Total tests", "Avg score % (30d)", "Accuracy % (30d)", "Latest mock /720", "Physics", "Chemistry", "Biology", "Best mock (30d)", "Change first→latest mock", "Practice Qs total", "Last active", "Weak chapters"];
    const rows = students.map(({ fullName, email, phone, currentClass, progress: p }) => [
      fullName, email, phone, currentClass, p.joined ? "Yes" : "Not yet", p.activeDays7, p.tests7, p.tests30, p.testsTotal, p.avgPct30, p.accuracy30,
      p.latestMock?.score, p.latestMock?.physics, p.latestMock?.chemistry, p.latestMock?.biology, p.bestMock30, p.mockTrend, p.practiceTotal, d(p.lastActive),
      (p.weakChapters || []).map((w) => `${w.chapter} (${w.subject})`).join("; "),
    ].map(esc).join(","));
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="student_progress_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send("﻿" + cols.join(",") + "\r\n" + rows.join("\r\n") + "\r\n");
  } catch (err) { res.status(502).json({ message: "Couldn't export progress right now." }); }
};

// Admin: same progress view for any institute (for demos / support)
export const adminInstituteProgress = async (req, res, next) => {
  try { res.json(await progressFor(req.params.id)); }
  catch (err) { res.status(502).json({ message: err.message }); }
};
