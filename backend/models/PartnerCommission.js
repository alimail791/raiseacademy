import mongoose from "mongoose";

// One commission line owed to a sales partner:
//  "first"   — 20% of an institute's first payment
//  "renewal" — 10% of every later payment (renewals, more months, more seats)
//  "bonus"   — one-time ₹5,000 when the partner's 3rd institute pays
// Created only after money reaches YNeet; admin marks it paid (UPI ref) within 7 days.
const partnerCommissionSchema = new mongoose.Schema(
  {
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "SalesPartner", required: true, index: true },
    instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Institute" },
    instituteName: { type: String, trim: true }, // kept if the institute is deleted later
    kind: { type: String, enum: ["first", "renewal", "bonus"], required: true },
    baseAmount: { type: Number, default: 0 }, // rupees the institute paid
    rate: { type: Number, default: 0 },       // 0.2 / 0.1 (0 for bonus)
    amount: { type: Number, required: true }, // rupees owed to the partner
    source: { type: String, trim: true },     // Razorpay payment id, or "admin"
    key: { type: String, required: true, unique: true }, // stops double-counting one payment
    status: { type: String, enum: ["pending", "paid", "cancelled"], default: "pending", index: true },
    dueBy: { type: Date },
    paidAt: { type: Date },
    payoutRef: { type: String, trim: true }, // UPI / bank reference
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("PartnerCommission", partnerCommissionSchema);
