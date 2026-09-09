import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    place: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false },

    board: { type: String, enum: ["CBSE", "Tamil Nadu State Board"], required: true },
    course: {
      type: String,
      enum: ["NEET Foundation", "NEET Coaching"],
      required: true,
    },

    // Both NEET Foundation (classes 6-10) and NEET Coaching (11, 12, Dropper) use this
    // single field — the Register form just shows a different option subset per course.
    currentClass: {
      type: String,
      enum: ["6", "7", "8", "9", "10", "11", "12", "Dropper"],
    },
    neetExamYear: { type: Number },

    // YNeet (NEET prep add-on) subscription mirror — source of truth lives in YNeet's DB,
    // this is just a light flag so Raise Academy UI can show subscription state without an extra call.
    yneetSubscribed: { type: Boolean, default: false },

    // Single-active-session enforcement: a fresh random value generated on every login.
    // A token is only honored if its embedded `sid` claim matches this current value —
    // logging in on a new device immediately invalidates every other device's token.
    currentSessionId: { type: String },

    isEmailVerified: { type: Boolean, default: true }, // verified via OTP before creation
    role: { type: String, enum: ["student", "admin"], default: "student" },

    progress: { type: Number, default: 0 }, // 0-100, simple course progress %
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);
