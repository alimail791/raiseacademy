import crypto from "crypto";
import bcrypt from "bcryptjs";
import Otp from "../models/Otp.js";
import Student from "../models/Student.js";
import { sendEmail, otpEmailTemplate } from "../utils/sendEmail.js";

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

const generateCode = () => crypto.randomInt(100000, 999999).toString();

// POST /api/otp/send  { email, purpose: 'register' | 'reset' }
export const sendOtp = async (req, res, next) => {
  try {
    const { email, purpose } = req.body;
    if (!email || !purpose) {
      return res.status(400).json({ message: "email and purpose are required" });
    }

    const existingUser = await Student.findOne({ email: email.toLowerCase() });
    if (purpose === "register" && existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    if (purpose === "reset" && !existingUser) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const code = generateCode();
    const codeHash = await bcrypt.hash(code, 10);

    // Remove previous unverified OTPs for this email + purpose
    await Otp.deleteMany({ email: email.toLowerCase(), purpose });

    await Otp.create({
      email: email.toLowerCase(),
      codeHash,
      purpose,
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    });

    await sendEmail({
      to: email,
      subject:
        purpose === "reset"
          ? "YNeet — Password Reset Code"
          : "YNeet — Verify Your Email",
      html: otpEmailTemplate(code, purpose),
    });

    res.json({ message: `OTP sent to ${email}`, expiresInMinutes: OTP_TTL_MINUTES });
  } catch (err) {
    next(err);
  }
};

// POST /api/otp/verify  { email, purpose, code }
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, purpose, code } = req.body;
    if (!email || !purpose || !code) {
      return res.status(400).json({ message: "email, purpose and code are required" });
    }

    const otpDoc = await Otp.findOne({ email: email.toLowerCase(), purpose }).sort({
      createdAt: -1,
    });

    if (!otpDoc) {
      return res.status(400).json({ message: "No OTP found. Please request a new one." });
    }

    if (otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    if (otpDoc.attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({ message: "Too many attempts. Please request a new OTP." });
    }

    const isMatch = await bcrypt.compare(code, otpDoc.codeHash);
    if (!isMatch) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return res.status(400).json({ message: "Incorrect OTP code" });
    }

    otpDoc.verified = true;
    await otpDoc.save();

    res.json({ message: "OTP verified successfully", verified: true });
  } catch (err) {
    next(err);
  }
};

// Helper used by other controllers to confirm an email was verified for a purpose
export const isEmailVerifiedFor = async (email, purpose) => {
  const otpDoc = await Otp.findOne({
    email: email.toLowerCase(),
    purpose,
    verified: true,
  }).sort({ createdAt: -1 });
  return !!otpDoc && otpDoc.expiresAt > new Date();
};
