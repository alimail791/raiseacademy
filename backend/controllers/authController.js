import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Student from "../models/Student.js";
import Otp from "../models/Otp.js";
import { isEmailVerifiedFor } from "./otpController.js";

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
});

// PATCH internal — called by the YNeet backend (server-to-server, shared secret)
// to flag a student as an active YNeet subscriber for display on Raise Academy's side.
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
// Requires that the email was already OTP-verified via /api/otp/verify (purpose=register)
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

    if (!fullName || !gender || !phone || !email || !place || !password || !board || !course) {
      return res.status(400).json({ message: "Missing required registration fields" });
    }

    const verified = await isEmailVerifiedFor(email, "register");
    if (!verified) {
      return res
        .status(403)
        .json({ message: "Email not verified. Please verify the OTP sent to your email first." });
    }

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
      gender,
      phone,
      email: email.toLowerCase(),
      place,
      password: hashedPassword,
      board,
      course,
      currentClass: emptyToUndefined(currentClass),
      neetExamYear: emptyToUndefined(neetExamYear),
      currentSessionId: newSessionId(),
      referredByCode: emptyToUndefined(referredByCode),
    });

    // Clean up used OTPs
    await Otp.deleteMany({ email: email.toLowerCase(), purpose: "register" });

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
export const getMe = async (req, res) => {
  res.json({ user: publicUser(req.user) });
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
