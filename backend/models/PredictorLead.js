import mongoose from "mongoose";

// A student (or parent) who used the NEET College Predictor.
// The WhatsApp number is the lead; `token` is what the browser keeps to see full results.
const predictorLeadSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true }, // 10 digits
    name: { type: String, trim: true, default: "" },
    verified: { type: Boolean, default: false },
    otpHash: { type: String },
    otpExpires: { type: Date },
    otpAttempts: { type: Number, default: 0 },
    token: { type: String, index: true, sparse: true },

    // Latest search
    air: { type: Number },
    stateRank: { type: Number },
    score: { type: Number },
    category: { type: String, default: "OPEN" },
    homeState: { type: String, default: "" },
    course: { type: String, default: "MBBS" },
    searches: { type: Number, default: 0 },

    // ₹299 choice-filling report
    paid: { type: Boolean, default: false },
    orderId: { type: String, index: true, sparse: true },
    paymentId: { type: String },
    paidAt: { type: Date },
    amount: { type: Number },

    utm: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("PredictorLead", predictorLeadSchema);
