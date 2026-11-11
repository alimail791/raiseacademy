import InstaReel from "../models/InstaReel.js";
import { reelsBucket, igConfigured, getAuth, tick } from "../utils/instagramReels.js";

const keyOk = (req) => process.env.BOOKS_UPLOAD_KEY && req.get("x-upload-key") === process.env.BOOKS_UPLOAD_KEY;
const SUBJECTS = ["Physics", "Chemistry", "Biology"];

// PUT /api/instagram-reels/upload (x-upload-key; body = MP4; x-reel-meta = base64 JSON
// { date, subject, chapter, caption, publishAt }). One Reel per subject per day: a re-run
// replaces a not-yet-posted video and is ignored once that Reel is posted.
export const upload = async (req, res, next) => {
  try {
    if (!keyOk(req)) return res.status(401).json({ message: "Bad upload key" });
    if (!Buffer.isBuffer(req.body) || req.body.length < 10000 || req.body.subarray(4, 8).toString() !== "ftyp") return res.status(400).json({ message: "Body must be an MP4" });
    let m = {};
    try { m = JSON.parse(Buffer.from(req.get("x-reel-meta") || "", "base64").toString("utf8") || "{}"); } catch { /* keep {} */ }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(m.date || "")) || !SUBJECTS.includes(m.subject)) return res.status(400).json({ message: "Bad date or subject" });
    const key = `${m.date}|${m.subject}`;
    const existing = await InstaReel.findOne({ key });
    if (existing && existing.status !== "pending") return res.json({ ok: true, key, status: existing.status, note: "Already handled; not replaced" });
    const fileId = await new Promise((resolve, reject) => {
      const up = reelsBucket().openUploadStream(`${m.date}-${m.subject.toLowerCase()}.mp4`, { contentType: "video/mp4" });
      up.on("error", reject).on("finish", () => resolve(up.id));
      up.end(req.body);
    });
    if (existing?.fileId) await reelsBucket().delete(existing.fileId).catch(() => {});
    const publishAt = m.publishAt ? new Date(m.publishAt) : new Date();
    await InstaReel.updateOne({ key }, {
      $set: { date: m.date, subject: m.subject, chapter: String(m.chapter || "").slice(0, 120), caption: String(m.caption || "").slice(0, 2200), fileId, bytes: req.body.length, publishAt, status: "pending", containerId: "", attempts: 0, error: "" },
    }, { upsert: true });
    res.json({ ok: true, key, publishAt, instagramConnected: igConfigured() });
  } catch (e) { next(e); }
};

// GET /api/instagram-reels/video/:id.mp4 — public, so Instagram can fetch the video.
export const video = async (req, res, next) => {
  try {
    const r = await InstaReel.findById(String(req.params.id || "").replace(/\.mp4$/, "")).catch(() => null);
    if (!r?.fileId) return res.status(404).end();
    const [f] = await reelsBucket().find({ _id: r.fileId }).toArray();
    if (!f) return res.status(404).end();
    res.set({ "content-type": "video/mp4", "content-length": f.length, "cache-control": "public, max-age=3600" });
    reelsBucket().openDownloadStream(f._id).on("error", next).pipe(res);
  } catch (e) { next(e); }
};

// GET /api/instagram-reels/status (x-upload-key) — connected account and the last Reels.
export const status = async (req, res, next) => {
  try {
    if (!keyOk(req)) return res.status(401).json({ message: "Bad upload key" });
    let account = null, error = "";
    if (igConfigured()) { try { const a = await getAuth(); account = { username: a.username, userId: a.userId, tokenRefreshedAt: a.refreshedAt }; } catch (e) { error = e.message; } }
    if (req.query.run === "1") await tick();
    const reels = await InstaReel.find().sort({ createdAt: -1 }).limit(12).select("key status publishAt postedAt permalink attempts error").lean();
    res.json({ connected: igConfigured(), account, error, reels });
  } catch (e) { next(e); }
};
