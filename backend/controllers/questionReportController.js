import QuestionReport from "../models/QuestionReport.js";
import { sendEmail } from "../utils/sendEmail.js";

const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || "alimail791@gmail.com";
const REASONS = {
  wrong_answer: "Answer key is wrong",
  wrong_explanation: "Explanation is wrong or unclear",
  question_error: "Mistake in the question",
  options_error: "Mistake in the options",
  other: "Something else",
};
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const cut = (s, n) => String(s || "").trim().slice(0, n);

// POST /api/question-reports — public
export const createReport = async (req, res, next) => {
  try {
    const b = req.body || {};
    const trusted = !!process.env.INTERNAL_SERVICE_KEY && req.headers["x-internal-key"] === process.env.INTERNAL_SERVICE_KEY;
    const reason = String(b.reason || "");
    if (!REASONS[reason]) return res.status(400).json({ message: "Please pick what is wrong." });
    if (!b.questionId && !b.slug) return res.status(400).json({ message: "Missing question." });
    const doc = await QuestionReport.create({
      questionId: cut(b.questionId, 80), slug: cut(b.slug, 200), page: cut(b.page, 300),
      questionText: cut(b.questionText, 300), reason, note: cut(b.note, 1000), phone: cut(b.phone, 20).replace(/[^\d+]/g, ""),
      // Only the YNeet API (with the internal key) can mark a report as from the app.
      ...(trusted ? { source: "app", studentName: cut(b.studentName, 80) } : {}),
    });
    const url = doc.source === "app" ? "" : doc.page ? `https://www.yneet.in${doc.page.startsWith("/") ? doc.page : `/${doc.page}`}` : "";
    sendEmail({
      to: ADMIN_ALERT_EMAIL,
      subject: `Question error reported: ${REASONS[reason]}`,
      html: `<p><strong>${esc(REASONS[reason])}</strong></p>
<p>${esc(doc.questionText)}</p>
${doc.note ? `<p>Note: ${esc(doc.note)}</p>` : ""}
<p>From: ${doc.source === "app" ? `YNeet app (${esc(doc.page)})${doc.studentName ? ` · ${esc(doc.studentName)}` : ""}` : "website"}<br>Question id: ${esc(doc.questionId)}${url ? `<br>Page: <a href="${esc(url)}">${esc(url)}</a>` : ""}${doc.phone ? `<br>WhatsApp: ${esc(doc.phone)}` : ""}</p>`,
    }).catch((e) => console.error("question report email failed:", e.message));
    res.status(201).json({ message: "Thanks! We'll check this question and fix it." });
  } catch (e) { next(e); }
};

// GET /api/question-reports — admin
export const listReports = async (req, res, next) => {
  try {
    const filter = req.query.all ? {} : { resolved: false };
    const reports = await QuestionReport.find(filter).sort({ createdAt: -1 }).limit(500).lean();
    res.json({ reports });
  } catch (e) { next(e); }
};

// PATCH /api/question-reports/:id — admin: mark fixed / reopen
export const updateReport = async (req, res, next) => {
  try {
    const r = await QuestionReport.findByIdAndUpdate(req.params.id, { resolved: !!req.body?.resolved }, { new: true });
    if (!r) return res.status(404).json({ message: "Not found" });
    res.json({ report: r });
  } catch (e) { next(e); }
};
