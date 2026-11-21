import mongoose from "mongoose";

// A YNeet sales partner: a college student, retired teacher, tuition teacher etc.
// who introduces coaching institutes to YNeet and earns commission (no salary).
// Signs up at /partner, gets a code (e.g. YNRAVI42) and shares
// www.yneet.in/institutes?sp=CODE. Institutes that join through it are tagged
// with Institute.salesPartner; every payment they make creates a
// PartnerCommission (see controllers/salesPartnerController.js).
// Not the same thing as WidgetPartner (schools showing YNeet widgets).
const salesPartnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true }, // 10 digits
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    city: { type: String, trim: true },
    occupation: { type: String, trim: true }, // student / teacher / retired teacher / other
    contacts: { type: String, trim: true },   // "how many coaching centres do you know?"
    password: { type: String, required: true, select: false },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    upiId: { type: String, trim: true },      // where commission is paid
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    bonusAwarded: { type: Boolean, default: false }, // 3rd-deal bonus already given
    notes: { type: String, trim: true },      // admin only
  },
  { timestamps: true }
);

export default mongoose.model("SalesPartner", salesPartnerSchema);
