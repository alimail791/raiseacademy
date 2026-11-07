import mongoose from "mongoose";

// One closing rank for one seat bucket, for the NEET College Predictor.
// A bucket = counselling quota (AIQ / a state) + college + course + seat type + category.
// Loaded from official allotment data through the admin import (utils/cutoffImport.js).
const collegeCutoffSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true },
    round: { type: Number, default: 1 },
    quota: { type: String, required: true, uppercase: true, trim: true }, // AIQ, TN, AP, TS, KL, KA, UP, MH, BR, RJ, DL
    rankType: { type: String, enum: ["AIR", "STATE"], default: "AIR" }, // which rank the closing rank is in
    openToAll: { type: Boolean, default: false }, // true = no domicile needed (AIQ, deemed, some private/management seats)
    college: { type: String, required: true, trim: true },
    collegeState: { type: String, trim: true, default: "" },
    collegeType: { type: String, trim: true, default: "" }, // Government, Private, Deemed, AIIMS, JIPMER, ESIC, Central…
    course: { type: String, required: true, uppercase: true, trim: true }, // MBBS, BDS
    seatType: { type: String, trim: true, default: "" }, // e.g. All India, Deemed/Paid, Govt Quota, Management
    category: { type: String, required: true, uppercase: true, trim: true }, // normalised: OPEN, OBC, EWS, SC, ST, BC, MBC…
    openingRank: { type: Number },
    closingRank: { type: Number, required: true }, // last regular round (e.g. MCC rounds 1–3)
    strayClosingRank: { type: Number }, // closing rank in the stray vacancy round(s), when known
    strayOnly: { type: Boolean, default: false }, // seat bucket was filled only in a stray round
    seats: { type: Number }, // seats allotted in this bucket, when known
    annualFee: { type: Number }, // optional, ₹ per year
    source: { type: String, trim: true, default: "" }, // file name / note
  },
  { timestamps: true }
);

collegeCutoffSchema.index({ quota: 1, year: 1, round: 1 });
collegeCutoffSchema.index({ course: 1, category: 1, closingRank: 1 });

export default mongoose.model("CollegeCutoff", collegeCutoffSchema);
