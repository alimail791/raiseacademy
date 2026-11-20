import mongoose from "mongoose";

// A student's "this question has a mistake" report from a public question page
// (www.yneet.in/neet-question/<slug> or a chapter practice page).
const questionReportSchema = new mongoose.Schema(
  {
    questionId: { type: String, trim: true, default: "" },
    slug: { type: String, trim: true, default: "" },
    page: { type: String, trim: true, default: "" }, // path the report came from
    questionText: { type: String, trim: true, default: "" }, // first part of the question, for the admin email
    reason: { type: String, enum: ["wrong_answer", "wrong_explanation", "question_error", "options_error", "other"], required: true },
    note: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" }, // optional, to tell the student when it's fixed
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

questionReportSchema.index({ resolved: 1, createdAt: -1 });

export default mongoose.model("QuestionReport", questionReportSchema);
