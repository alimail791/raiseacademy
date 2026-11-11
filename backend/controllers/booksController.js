import mongoose from "mongoose";
import PredictorLead from "../models/PredictorLead.js";
import { leadByToken } from "./predictorController.js";
import { yneetPost } from "../utils/yneetSync.js";
import { sendEmail } from "../utils/sendEmail.js";

// NEET PYQ books on www.yneet.in/neet-pyq-books.
// The PDFs are built every month by the YNeet repo's "NEET PYQ books" workflow
// (books/), which uploads them here (PUT /api/books/files/:name, BOOKS_UPLOAD_KEY);
// they're kept in MongoDB GridFS. Students confirm their WhatsApp number with the
// College Predictor's OTP flow (same lead + token), then:
//   - chapter booklets: free download
//   - subject books: ₹199 each, all three ₹499 (Razorpay via the YNeet backend)

export const BOOK_PRICE = Number(process.env.PYQ_BOOK_PRICE || 199);
export const BUNDLE_PRICE = Number(process.env.PYQ_BUNDLE_PRICE || 499);
const SUBJECTS = ["physics", "chemistry", "biology"];
const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || "alimail791@gmail.com";
const NAME_RE = /^[a-z0-9][a-z0-9.-]{2,120}\.pdf$/i;

// testHooks.Bucket lets tests use an in-memory stand-in for GridFS.
export const testHooks = { Bucket: null };
const bucket = () => new (testHooks.Bucket || mongoose.mongo.GridFSBucket)(mongoose.connection.db, { bucketName: "pyqbooks" });
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Price for the subjects not already owned: ₹199 each, or ₹499 when all three are bought together.
export const priceFor = (items) => (items.length >= 3 ? BUNDLE_PRICE : items.length * BOOK_PRICE);

// PUT /api/books/files/:name — raw PDF body; header x-book-meta = base64 JSON
// { kind: "book" | "booklet", subject, chapter?, slug?, questions, chapters? }.
// Replaces any older file of the same name once the new one is stored.
export const uploadFile = async (req, res, next) => {
  try {
    if (!process.env.BOOKS_UPLOAD_KEY || req.get("x-upload-key") !== process.env.BOOKS_UPLOAD_KEY) return res.status(401).json({ message: "Bad upload key" });
    const name = String(req.params.name || "");
    if (!NAME_RE.test(name)) return res.status(400).json({ message: "Bad file name" });
    if (!Buffer.isBuffer(req.body) || req.body.length < 1000 || req.body.subarray(0, 5).toString() !== "%PDF-") return res.status(400).json({ message: "Body must be a PDF" });
    let meta = {};
    try { meta = JSON.parse(Buffer.from(req.get("x-book-meta") || "", "base64").toString("utf8") || "{}"); } catch { /* keep {} */ }
    const kind = meta.kind === "book" ? "book" : "booklet";
    const subject = String(meta.subject || "").toLowerCase();
    if (!SUBJECTS.includes(subject)) return res.status(400).json({ message: "Unknown subject" });
    const old = await bucket().find({ filename: name }).toArray();
    await new Promise((resolve, reject) => {
      const up = bucket().openUploadStream(name, {
        contentType: "application/pdf",
        metadata: { kind, subject, chapter: String(meta.chapter || ""), slug: String(meta.slug || ""), questions: Number(meta.questions) || 0, chapters: Number(meta.chapters) || 0, edition: String(meta.edition || "") },
      });
      up.on("error", reject).on("finish", resolve);
      up.end(req.body);
    });
    for (const f of old) await bucket().delete(f._id).catch(() => {});
    catalogCache = null;
    res.json({ ok: true, name, bytes: req.body.length });
  } catch (e) { next(e); }
};

// GET /api/books/catalog — books (with prices) and free booklets, newest copy of each.
let catalogCache = null;
export const catalog = async (req, res, next) => {
  try {
    if (!catalogCache || Date.now() - catalogCache.at > 5 * 60 * 1000) {
      const files = await bucket().find({}).sort({ uploadDate: -1 }).toArray();
      const seen = new Set();
      const books = [], booklets = [];
      for (const f of files) {
        if (seen.has(f.filename)) continue;
        seen.add(f.filename);
        const m = f.metadata || {};
        const item = { file: f.filename, subject: m.subject, questions: m.questions, bytes: f.length, edition: m.edition || "" };
        if (m.kind === "book") books.push({ ...item, chapters: m.chapters });
        else booklets.push({ ...item, chapter: m.chapter, slug: m.slug });
      }
      books.sort((a, b) => SUBJECTS.indexOf(a.subject) - SUBJECTS.indexOf(b.subject));
      booklets.sort((a, b) => SUBJECTS.indexOf(a.subject) - SUBJECTS.indexOf(b.subject) || a.chapter.localeCompare(b.chapter));
      catalogCache = { at: Date.now(), value: { books, booklets, price: { book: BOOK_PRICE, bundle: BUNDLE_PRICE } } };
    }
    res.set("Cache-Control", "public, max-age=300");
    res.json(catalogCache.value);
  } catch (e) { next(e); }
};

// GET /api/books/me?token= — which books this WhatsApp number owns.
export const me = async (req, res, next) => {
  try {
    const lead = await leadByToken(req.query.token);
    if (!lead) return res.status(401).json({ message: "Confirm your WhatsApp number first" });
    res.json({ books: lead.books || [], phone: lead.phone.replace(/^(\d{2})\d{5}/, "$1•••••") });
  } catch (e) { next(e); }
};

// POST /api/books/order { token, items: ["biology"] | ["physics","chemistry","biology"] }
export const order = async (req, res, next) => {
  try {
    const lead = await leadByToken(req.body?.token);
    if (!lead) return res.status(401).json({ message: "Confirm your WhatsApp number first" });
    const want = [...new Set((req.body?.items || []).map((s) => String(s).toLowerCase()))].filter((s) => SUBJECTS.includes(s));
    const items = want.filter((s) => !(lead.books || []).includes(s));
    if (!want.length) return res.status(400).json({ message: "Pick a book" });
    if (!items.length) return res.json({ owned: true, books: lead.books });
    const amount = priceFor(items);
    const o = await yneetPost("razorpay/order", { amount: amount * 100, receipt: `books_${Date.now()}`, notes: { kind: "pyq_books", items: items.join(","), phone: lead.phone } });
    lead.bookOrder = { orderId: o.orderId, items, amount };
    await lead.save();
    res.json({ orderId: o.orderId, amount: o.amount, keyId: o.keyId, items, prefill: { name: lead.name, contact: lead.phone } });
  } catch (e) { next(e); }
};

// POST /api/books/verify { token, orderId, paymentId, signature }
export const verify = async (req, res, next) => {
  try {
    const { token, orderId, paymentId, signature } = req.body || {};
    const lead = await leadByToken(token);
    if (!lead || !orderId || lead.bookOrder?.orderId !== orderId) return res.status(400).json({ message: "Payment not found" });
    const r = await yneetPost("razorpay/verify", { orderId, paymentId, signature });
    if (r.valid !== true) return res.status(400).json({ message: "Payment could not be verified" });
    const { items, amount } = lead.bookOrder;
    lead.books = [...new Set([...(lead.books || []), ...items])];
    lead.bookPayments = [...(lead.bookPayments || []), { orderId, paymentId, items, amount, paidAt: new Date() }];
    lead.bookOrder = undefined;
    await lead.save();
    sendEmail({
      to: ADMIN_ALERT_EMAIL, subject: `₹${amount} NEET PYQ book${items.length > 1 ? "s" : ""} sold — ${lead.phone}`,
      html: `<p>New NEET PYQ book sale.</p><p>Name: ${esc(lead.name)}<br>WhatsApp: ${esc(lead.phone)}<br>Books: ${esc(items.join(", "))}<br>Amount: ₹${amount}<br>Payment: ${esc(paymentId)}</p>`,
    }).catch(() => {});
    res.json({ paid: true, books: lead.books, amount });
  } catch (e) { next(e); }
};

// GET /api/books/download/:name?token= — booklets for any confirmed number, books only if bought.
export const download = async (req, res, next) => {
  try {
    const name = String(req.params.name || "");
    if (!NAME_RE.test(name)) return res.status(404).json({ message: "Not found" });
    const lead = await leadByToken(req.query.token);
    if (!lead) return res.status(401).json({ message: "Confirm your WhatsApp number first" });
    const [f] = await bucket().find({ filename: name }).sort({ uploadDate: -1 }).limit(1).toArray();
    if (!f) return res.status(404).json({ message: "Not found" });
    const m = f.metadata || {};
    if (m.kind === "book" && !(lead.books || []).includes(m.subject)) return res.status(402).json({ message: "Buy this book to download it", price: BOOK_PRICE });
    res.set({ "Content-Type": "application/pdf", "Content-Length": String(f.length), "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "private, no-store" });
    bucket().openDownloadStream(f._id).on("error", next).pipe(res);
  } catch (e) { next(e); }
};

// GET /api/books/admin/sales (admin) — totals for the admin panel or a quick check.
export const adminSales = async (req, res, next) => {
  try {
    const buyers = await PredictorLead.find({ "bookPayments.0": { $exists: true } }).select("name phone books bookPayments").lean();
    const payments = buyers.flatMap((b) => b.bookPayments.map((p) => ({ ...p, name: b.name, phone: b.phone })));
    res.json({ buyers: buyers.length, revenue: payments.reduce((a, p) => a + (p.amount || 0), 0), payments: payments.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt)).slice(0, 200) });
  } catch (e) { next(e); }
};
