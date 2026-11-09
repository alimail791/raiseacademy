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

// Class 9–10 = NEET Foundation; 11, 12 and Dropper = NEET Coaching.
const courseForClass = (c) => (["11", "12", "Dropper"].includes(String(c)) ? "NEET Coaching" : "NEET Foundation");

// The NEET a student will sit, worked out from their class instead of asking.
// NEET is held in May, so from June onwards the "next NEET" is next year's.
export const neetYearForClass = (c, now = new Date()) => {
  const nextNeet = now.getMonth() >= 5 ? now.getFullYear() + 1 : now.getFullYear();
  const yearsAway = { "12": 0, Dropper: 0, "11": 1, "10": 2, "9": 3 }[String(c)];
  return yearsAway === undefined ? undefined : nextNeet + yearsAway;
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
    } else {
      // Class 9–Dropper one-screen form: name, WhatsApp number, email, class,
      // password. Gender, place, board, course and NEET year are optional now.
      if (!fullName || !phone || !email || !password || !currentClass) {
        return res.status(400).json({ message: "Missing required registration fields" });
      }
      if (!normalizePhone(phone)) return res.status(400).json({ message: "Enter a valid 10-digit WhatsApp number" });
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
      board: board || "CBSE",
      course: junior ? "NEET Foundation" : (course || courseForClass(currentClass)),
      ...(parentPhone && { parentPhone }),
      currentClass: emptyToUndefined(currentClass),
      neetExamYear: emptyToUndefined(neetExamYear) ?? neetYearForClass(currentClass),
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

// Check a Google Sign-In ID token with Google and return its verified email/name.
// Uses Google's tokeninfo endpoint, so no extra library is needed.
async function verifyGoogleCredential(credential) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw Object.assign(new Error("Google sign-in is not set up yet"), { status: 503 });
  if (!credential || typeof credential !== "string") throw Object.assign(new Error("Missing Google credential"), { status: 400 });
  const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  const info = r.ok ? await r.json() : null;
  const okIssuer = info && ["accounts.google.com", "https://accounts.google.com"].includes(info.iss);
  if (!info || !okIssuer || info.aud !== clientId || String(info.email_verified) !== "true" || !info.email) {
    throw Object.assign(new Error("Google sign-in failed. Please try again."), { status: 401 });
  }
  return { email: String(info.email).toLowerCase(), name: String(info.name || info.given_name || "").trim() };
}

// POST /api/auth/google { credential, phone?, currentClass?, fullName?, referredByCode? }
// Existing account with that email → logged in. New student → if class and
// WhatsApp number are missing, reply { needsDetails } so the page asks for just
// those two, then the page calls again with them and the account is created.
// Class 9–Dropper only (Class 6–8 sign up with a parent on the normal form).
export const googleAuth = async (req, res, next) => {
  try {
    let g;
    try { g = await verifyGoogleCredential(req.body?.credential); }
    catch (e) { return res.status(e.status || 401).json({ message: e.message }); }

    const existing = await Student.findOne({ email: g.email });
    if (existing) {
      const sid = newSessionId();
      await Student.updateOne({ _id: existing._id }, { $set: { currentSessionId: sid } });
      existing.currentSessionId = sid;
      return res.json({ token: signToken(existing._id, sid), user: publicUser(existing), isNew: false });
    }

    const { currentClass, referredByCode } = req.body;
    const phone = normalizePhone(req.body.phone);
    const fullName = String(req.body.fullName || g.name || "").trim().slice(0, 80);
    if (!["9", "10", "11", "12", "Dropper"].includes(String(currentClass || "")) || !phone || !fullName) {
      return res.json({ needsDetails: true, email: g.email, fullName: g.name });
    }

    // Google accounts have no YNeet password; store a random one (they log in with Google,
    // or can set a password later with "Forgot password").
    const password = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);
    const student = await Student.create({
      fullName,
      phone,
      email: g.email,
      password,
      board: "CBSE",
      course: courseForClass(currentClass),
      currentClass: String(currentClass),
      neetExamYear: neetYearForClass(currentClass),
      currentSessionId: newSessionId(),
      referredByCode: referredByCode || undefined,
    });

    sendEmail({
      to: ADMIN_ALERT_EMAIL,
      subject: `New registration (Google) — ${student.fullName}`,
      html: newRegistrationAdminTemplate(student),
    }).catch((e) => console.warn("Admin registration-alert email failed:", e.message));

    res.status(201).json({ token: signToken(student._id, student.currentSessionId), user: publicUser(student), isNew: true });
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
