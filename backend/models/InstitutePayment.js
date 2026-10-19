import mongoose from "mongoose";

// One Razorpay checkout for a monthly institute plan: a new institute signing
// up ("new") or an existing one renewing / changing its plan ("renew").
const institutePaymentSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    kind: { type: String, enum: ["new", "renew"], required: true },
    seats: { type: Number, required: true },
    amount: { type: Number, required: true }, // rupees actually charged
    listPrice: { type: Number },               // before any referral discount
    referralDiscount: { type: Boolean, default: false }, // 40% credit applied to this order
    referrerId: { type: mongoose.Schema.Types.ObjectId, ref: "Institute" }, // for "new": who referred
    instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Institute" },
    // Sign-up details held until payment succeeds (password already hashed).
    signup: {
      name: String, contactName: String, email: String, phone: String, city: String, board: String, passwordHash: String,
    },
    status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
    paymentId: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("InstitutePayment", institutePaymentSchema);
