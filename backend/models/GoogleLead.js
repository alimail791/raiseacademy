import mongoose from "mongoose";

// Someone who tapped "Continue with Google" on the register/login page but
// hasn't finished the second step (name, class, WhatsApp number) yet, so no
// Student account exists for them. Kept so they can be followed up.
// `completed` flips to true once they finish and the Student is created.
const googleLeadSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, trim: true, default: "" },
    referredByCode: { type: String, default: "" },
    attempts: { type: Number, default: 1 }, // how many times they reached the details step
    completed: { type: Boolean, default: false, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("GoogleLead", googleLeadSchema);
