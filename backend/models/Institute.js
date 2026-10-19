import mongoose from "mongoose";

// A coaching institute / school that bought a bulk YNeet pack (e.g. 20 students
// for one year). Created by the Raise Academy admin after offline payment. The
// institute logs in to /institute with its own email + password (separate from
// student accounts) and assigns its seats to students.
const instituteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contactName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    city: { type: String, trim: true },
    // Default board for students the institute adds (Student.board is required).
    board: { type: String, enum: ["CBSE", "Tamil Nadu State Board"], default: "CBSE" },
    password: { type: String, required: true, select: false },

    seats: { type: Number, required: true, min: 1 },
    amountPaid: { type: Number, default: 0 }, // rupees
    paymentRef: { type: String, trim: true }, // UTR / cheque no. / note
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    // "yearly" = offline pack set up by admin; "monthly" = paid online via Razorpay
    // and renewed by the institute from its panel.
    billing: { type: String, enum: ["yearly", "monthly"], default: "yearly" },
    // Renewal reminder emails already sent for the current endDate (monthly plans).
    reminderSentFor: { type: Date },
    expiredNoticeFor: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

instituteSchema.methods.isLive = function () {
  return this.status === "active" && this.endDate && this.endDate > new Date();
};

export default mongoose.model("Institute", instituteSchema);
