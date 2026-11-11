import YoutubeShort from "../models/YoutubeShort.js";

// Daily NEET quiz Shorts (YNeet repo, shorts-bot) for www.yneet.in.
// POST /api/youtube-shorts (x-upload-key = BOOKS_UPLOAD_KEY) — the bot reports an upload.
// GET  /api/youtube-shorts?limit= — public ones, newest first.
// A video counts as public once YouTube's oEmbed answers for it (private and
// not-yet-published videos don't), so nothing unwatchable is ever shown.

const ID_RE = /^[A-Za-z0-9_-]{11}$/;
const RECHECK_MS = 30 * 60 * 1000;

// 11 Nov 2026 was uploaded three times (test run, scheduled run, music re-run).
// Keep the music versions; drop the earlier copies from the site.
const SEED = [
  { videoId: "ebG_e1Usq_c", subject: "Physics", chapter: "Nuclei", title: "NEET 2023 Physics PYQ: Nuclei | 5-second challenge", date: "2026-11-11", publishAt: new Date("2026-11-11T03:30:00Z") },
  { videoId: "8Q-r3Q3n-wU", subject: "Chemistry", chapter: "Redox Reactions", title: "NEET Chemistry MCQ: Redox Reactions | 5-second challenge", date: "2026-11-11", publishAt: new Date("2026-11-11T07:30:00Z") },
  { videoId: "tuKZbkpZOks", subject: "Biology", chapter: "Ecosystem", title: "NEET 2026 Biology PYQ: Ecosystem | 5-second challenge", date: "2026-11-11", publishAt: new Date("2026-11-11T13:30:00Z") },
];
const REMOVED = ["nFo6o9QgOoc", "ApV-hub2Cog", "JQZevKhRFFo", "bcNaLmzVWzA", "naL4038ngCs", "CyYDZgs--FM"];
let seeded = false;
async function seedOnce() {
  if (seeded) return;
  seeded = true;
  await YoutubeShort.deleteMany({ videoId: { $in: REMOVED } }).catch(() => {});
  for (const s of SEED) await YoutubeShort.updateOne({ videoId: s.videoId }, { $setOnInsert: s }, { upsert: true }).catch(() => {});
}

async function checkPublic(doc) {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${doc.videoId}`)}`, { signal: AbortSignal.timeout(6000) });
    doc.isPublic = r.ok;
    if (r.ok) {
      const j = await r.json().catch(() => ({}));
      if (j.thumbnail_url) doc.thumbnail = j.thumbnail_url;
      if (!doc.title && j.title) doc.title = j.title;
    }
  } catch { /* network: try again later */ }
  doc.checkedAt = new Date();
  await doc.save().catch(() => {});
}

export const report = async (req, res, next) => {
  try {
    if (!process.env.BOOKS_UPLOAD_KEY || req.get("x-upload-key") !== process.env.BOOKS_UPLOAD_KEY) return res.status(401).json({ message: "Bad key" });
    const b = req.body || {};
    if (!ID_RE.test(String(b.videoId || ""))) return res.status(400).json({ message: "Bad videoId" });
    const doc = {
      subject: String(b.subject || "").slice(0, 20), chapter: String(b.chapter || "").slice(0, 120),
      title: String(b.title || "").replace(/\s*#shorts\s*$/i, "").slice(0, 120),
      questionSlug: /^[a-z0-9-]{3,200}$/i.test(String(b.questionSlug || "")) ? b.questionSlug : "",
      date: /^\d{4}-\d{2}-\d{2}$/.test(String(b.date || "")) ? b.date : "",
      publishAt: b.publishAt ? new Date(b.publishAt) : null,
    };
    await YoutubeShort.updateOne({ videoId: b.videoId }, { $set: doc, $setOnInsert: { videoId: b.videoId, isPublic: false } }, { upsert: true });
    cache = null;
    res.json({ ok: true });
  } catch (e) { next(e); }
};

let cache = null;
export const list = async (req, res, next) => {
  try {
    await seedOnce();
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 200);
    if (!cache || Date.now() - cache.at > 5 * 60 * 1000) {
      const now = new Date();
      // Re-check recent ones that are due but not yet known to be public.
      const due = await YoutubeShort.find({ isPublic: false, $or: [{ publishAt: null }, { publishAt: { $lte: now } }], createdAt: { $gte: new Date(Date.now() - 60 * 864e5) } })
        .sort({ createdAt: -1 }).limit(30);
      for (const d of due) if (!d.checkedAt || now - d.checkedAt > RECHECK_MS) await checkPublic(d);
      // Videos deleted or made private on YouTube drop off within a few hours.
      const stale = await YoutubeShort.find({ isPublic: true, $or: [{ checkedAt: null }, { checkedAt: { $lt: new Date(Date.now() - 6 * 3600e3) } }] }).limit(20);
      for (const d of stale) await checkPublic(d);
      const all = await YoutubeShort.find({ isPublic: true }).sort({ createdAt: -1 }).limit(400).lean();
      // One Short per subject per day: if a day was uploaded twice, show only the newest copy.
      const seen = new Set();
      const items = all.filter((x) => { const k = x.date && x.subject ? `${x.date}|${x.subject}` : x.videoId; if (seen.has(k)) return false; seen.add(k); return true; })
        .sort((a, b) => (new Date(b.publishAt || b.createdAt)) - (new Date(a.publishAt || a.createdAt)) || (b.subject < a.subject ? -1 : 1));
      cache = { at: Date.now(), items: items.map(({ videoId, subject, chapter, title, questionSlug, date, publishAt, thumbnail }) => ({ videoId, subject, chapter, title, questionSlug, date, publishAt, thumbnail })) };
    }
    res.set("Cache-Control", "public, max-age=300");
    res.json({ shorts: cache.items.slice(0, limit), total: cache.items.length });
  } catch (e) { next(e); }
};

// GET /api/youtube-shorts/reported?date=YYYY-MM-DD — subjects already uploaded for that day
// (public or scheduled), so a re-run of the bot doesn't upload the same day twice.
export const reported = async (req, res, next) => {
  try {
    const date = String(req.query.date || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: "Bad date" });
    const docs = await YoutubeShort.find({ date }).select("subject videoId -_id").lean();
    res.json({ date, subjects: [...new Set(docs.map((d) => d.subject))], videos: docs });
  } catch (e) { next(e); }
};
