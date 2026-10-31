import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Student from "../models/Student.js";
import Otp from "../models/Otp.js";
import { isEmailVerifiedFor } from "./otpController.js";
import { sendEmail, newRegistrationAdminTemplate } from "../utils/sendEmail.js";
import Institute from "../models/Institute.js";
import { instituteAccessFor } from "../utils/yneetSync.js";
import { normalizePhone } from "../utils/parentWhatsApp.js";

// Where the "a new student just registered" alert goes. Overridable via env
// without a code change; falls back to the owner's own inbox.
const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || "alimail791@gmail.com";

const signToken = (id, sid) =>
  jwt.sign({ id, sid }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// A fresh value generated on every login — see middleware/auth.js for how this
// enforces "only one device logged in at a time."
const newSessionId = () => crypto.randomBytes(16).toString("hex");

const publicUser = (u) => ({
  id: u._id,
  fullName: u.fullName,
  email: u.email,
  phone: u.phone,
  gender: u.gender,
  place: u.place,
  board: u.board,
  course: u.course,
  currentClass: u.currentClass,
  neetExamYear: u.neetExamYear,
  role: u.role,
  progress: u.progress,
  yneetSubscribed: u.yneetSubscribed,
  referredByCode: u.referredByCode,
  parentEmail: u.parentEmail,
  classChangedAt: u.classChangedAt || null,
});

// PATCH internal — called by the YNeet backend (server-to-server, shared secret)
// to flag a student as an active YNeet subscriber for display on Raise Academy's side.
// POST /api/auth/internal/wa-otp { phone, code } — YNeet asks us to deliver a
// WhatsApp verification code (we hold the WhatsApp Business credentials).
export const sendWaOtpInternal = async (req, res) => {
  if (!process.env.INTERNAL_SERVICE_KEY || req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const { sendWhatsAppOtp } = await import("../utils/whatsappOtp.js");
    await sendWhatsAppOtp(req.body?.phone, req.body?.code);
    res.json({ ok: true });
  } catch (e) {
    console.warn("WhatsApp OTP send failed:", e.message);
    res.status(502).json({ message: e.message });
  }
};

export const setYneetSubscriptionFlag = async (req, res, next) => {
  try {
    const internalKey = req.headers["x-internal-key"];
    if (!process.env.INTERNAL_SERVICE_KEY || internalKey !== process.env.INTERNAL_SERVICE_KEY) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { userId, subscribed } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const user = await Student.findByIdAndUpdate(
      userId,
      { yneetSubscribed: !!subscribed },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "Student not found" });

    res.json({ ok: true, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/register
// No OTP needed; verification happens inside YNeet within 3 days.
export const register = async (req, res, next) => {
  try {
    const {
      fullName,
      gender,
      phone,
      email,
      place,
      password,
      board,
      course,
      currentClass,
      neetExamYear,
      referredByCode,
    } = req.body;

    // Class 6–8 (free) use a shorter form: no gender or place, but a parent's
    // WhatsApp is required (it also becomes the contact phone if none is given).
    const junior = ["6", "7", "8"].includes(String(currentClass || ""));
    const parentPhone = normalizePhone(req.body.parentPhone);
    if (junior) {
      if (!parentPhone) return res.status(400).json({ message: "Enter your parent's 10-digit WhatsApp number" });
      if (!fullName || !email || !password || !board) return res.status(400).json({ message: "Missing required registration fields" });
    } else if (!fullName || !gender || !phone || !email || !place || !password || !board || !course) {
      return res.status(400).json({ message: "Missing required registration fields" });
    }

    // No OTP at sign-up any more: the account is created straight away and the
    // student confirms their WhatsApp number or email inside YNeet within 3 days
    // (YNeet pauses an unverified free trial after that).
    if (!/^\S+@\S+\.\S+$/.test(String(email))) return res.status(400).json({ message: "Enter a valid email address" });

    const existing = await Student.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // currentClass/neetExamYear arrive as "" for NEET Foundation when the year
    // isn't applicable. Mongoose enums reject "" — only `undefined` or a listed
    // value is valid — so blank them out here.
    const emptyToUndefined = (v) => (v === "" || v === null ? undefined : v);

    const student = await Student.create({
      fullName,
      gender: emptyToUndefined(gender),
      phone: phone || (junior ? parentPhone : phone),
      email: email.toLowerCase(),
      place: emptyToUndefined(place),
      password: hashedPassword,
      board,
      course: junior ? "NEET Foundation" : course,
      ...(parentPhone && { parentPhone }),
      currentClass: emptyToUndefined(currentClass),
      neetExamYear: emptyToUndefined(neetExamYear),
      currentSessionId: newSessionId(),
      referredByCode: emptyToUndefined(referredByCode),
    });

    // Clean up used OTPs
    await Otp.deleteMany({ email: email.toLowerCase(), purpose: "register" });

    // Best-effort: notify the admin inbox of the new registration. Never block or
    // fail the registration response if this email doesn't go through.
    sendEmail({
      to: ADMIN_ALERT_EMAIL,
      subject: `New registration — ${student.fullName}`,
      html: newRegistrationAdminTemplate(student),
    }).catch((e) => console.warn("Admin registration-alert email failed:", e.message));

    const token = signToken(student._id, student.currentSessionId);
    res.status(201).json({ token, user: publicUser(student) });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await Student.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // A fresh session id here immediately invalidates any token issued to this
    // account on another device — enforcing one active login at a time.
    // Using a targeted update (not user.save()) so this doesn't accidentally
    // re-validate the whole document against current schema rules — e.g. an
    // account registered under an older course option that's since been removed
    // shouldn't fail to log in just because of an unrelated field.
    const newSid = newSessionId();
    await Student.updateOne({ _id: user._id }, { $set: { currentSessionId: newSid } });
    user.currentSessionId = newSid;

    const token = signToken(user._id, user.currentSessionId);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
// instituteAccess is read by YNeet's SSO bridge to apply an institute's bulk plan.
export const getMe = async (req, res) => {
  const institute = req.user.instituteId ? await Institute.findById(req.user.instituteId).catch(() => null) : null;
  res.json({ user: { ...publicUser(req.user), instituteAccess: instituteAccessFor(institute) } });
};

// POST /api/auth/reset-password
// Requires OTP already verified via /api/otp/verify (purpose=reset)
export const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ message: "email and newPassword are required" });
    }

    const verified = await isEmailVerifiedFor(email, "reset");
    if (!verified) {
      return res.status(403).json({ message: "OTP not verified for this email" });
    }

    const user = await Student.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    await Otp.deleteMany({ email: email.toLowerCase(), purpose: "reset" });

    res.json({ message: "Password reset successfully. Please log in with your new password." });
  } catch (err) {
    next(err);
  }
};

// ── Server-to-server (YNeet backend), shared INTERNAL_SERVICE_KEY ──
const internalOk = (req) => !!process.env.INTERNAL_SERVICE_KEY && req.headers["x-internal-key"] === process.env.INTERNAL_SERVICE_KEY;

// POST /api/auth/internal/delete-student { id } — permanent delete of the login.
// Admin accounts are never deleted this way. An institute seat is freed automatically
// (seats are counted from students that still exist).
export const deleteStudentInternal = async (req, res) => {
  if (!internalOk(req)) return res.status(401).json({ message: "Unauthorized" });
  try {
    const id = String(req.body?.id || "");
    if (!mongoose.isValidObjectId(id)) return res.json({ ok: true, deleted: false });
    const s = await Student.findById(id).select("role email");
    if (!s) return res.json({ ok: true, deleted: false });
    if (s.role === "admin") return res.status(400).json({ message: "Admin accounts can't be deleted here" });
    await Student.deleteOne({ _id: id });
    res.json({ ok: true, deleted: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// Class ladder: 6 → 7 → … → 12 → Dropper. Classes 6–10 are "NEET Foundation",
// 11, 12 and Dropper are "NEET Coaching".
export const CLASS_ORDER = ["6", "7", "8", "9", "10", "11", "12", "Dropper"];
const courseFor = (c) => (["11", "12", "Dropper"].includes(c) ? "NEET Coaching" : "NEET Foundation");
export const CLASS_CHANGE_GAP_DAYS = 150;

// POST /api/auth/internal/set-class { id, currentClass, force }
// Without force (the student's own request) only the next class up is allowed,
// at most once every CLASS_CHANGE_GAP_DAYS. With force (admin) any class is allowed.
export const setClassInternal = async (req, res) => {
  if (!internalOk(req)) return res.status(401).json({ message: "Unauthorized" });
  try {
    const { id, currentClass, force } = req.body || {};
    if (!mongoose.isValidObjectId(String(id || ""))) return res.status(404).json({ message: "Student not found" });
    if (!CLASS_ORDER.includes(String(currentClass))) return res.status(400).json({ message: "Unknown class" });
    const s = await Student.findById(id);
    if (!s) return res.status(404).json({ message: "Student not found" });
    const from = s.currentClass || "12";
    if (!force) {
      const next = CLASS_ORDER[CLASS_ORDER.indexOf(from) + 1];
      if (!next || String(currentClass) !== next) return res.status(400).json({ message: next ? `You can move up to Class ${next} only.` : "Dropper is the last level." });
      if (s.classChangedAt && Date.now() - s.classChangedAt.getTime() < CLASS_CHANGE_GAP_DAYS * 86400000) {
        const when = new Date(s.classChangedAt.getTime() + CLASS_CHANGE_GAP_DAYS * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
        return res.status(400).json({ message: `You changed your class recently. You can move up again after ${when}, or message us on WhatsApp.` });
      }
    }
    await Student.updateOne({ _id: s._id }, { $set: { currentClass: String(currentClass), course: courseFor(String(currentClass)), classChangedAt: new Date() } });
    res.json({ ok: true, from, currentClass: String(currentClass), course: courseFor(String(currentClass)) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/auth/internal/parent { id, parentPhone? } — read (and optionally set) the
// parent's WhatsApp number from the student's own YNeet dashboard. "" removes it.
export const parentContactInternal = async (req, res) => {
  if (!internalOk(req)) return res.status(401).json({ message: "Unauthorized" });
  try {
    const id = String(req.body?.id || "");
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: "Student not found" });
    const s = await Student.findById(id).select("parentPhone parentEmail");
    if (!s) return res.status(404).json({ message: "Student not found" });
    if (req.body && "parentPhone" in req.body) {
      const raw = String(req.body.parentPhone || "").replace(/\D/g, "");
      let d = raw;
      if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
      else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
      if (raw && !/^[6-9]\d{9}$/.test(d)) return res.status(400).json({ message: "Enter a valid 10-digit Indian mobile number." });
      await Student.updateOne({ _id: s._id }, raw ? { $set: { parentPhone: d }, $unset: { lastParentWaSent: 1 } } : { $unset: { parentPhone: 1 } });
      s.parentPhone = raw ? d : undefined;
    }
    res.json({ ok: true, parentPhone: s.parentPhone || null });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
