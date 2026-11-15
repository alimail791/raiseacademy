import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    // For WhatsApp sign-in (purpose "wa-auth") this holds "wa:<10-digit phone>".
    email: { type: String, required: true, lowercase: true, trim: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: ["register", "reset", "institute-reset", "wa-auth"], required: true },
    verified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-delete expired OTP documents
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Otp", otpSchema);
