import BlogPost from "../models/BlogPost.js";
import { sanitizeHtml, slugify, excerptFrom } from "../utils/blogHtml.js";
import { onPublished } from "../utils/blogSchedule.js";

// Fire-and-forget: a slow IndexNow / rebuild / email never delays the admin's save.
const afterPublish = (slug) => onPublished([slug]).catch((e) => console.error("[blog] after-publish failed:", e.message));

const summary = (p) => ({
  id: p._id, slug: p.slug, title: p.title, metaDescription: p.metaDescription, coverImageUrl: p.coverImageUrl,
  status: p.status, publishedAt: p.publishedAt, updatedAt: p.updatedAt,
  excerpt: p.metaDescription || excerptFrom(p.bodyHtml),
});
const full = (p) => ({ ...summary(p), bodyHtml: p.bodyHtml });

// ---------- Public ----------
export const listPublished = async (req, res, next) => {
  try {
    const posts = await BlogPost.find({ status: "published" }).sort({ publishedAt: -1 });
    res.set("Cache-Control", "public, max-age=60");
    res.json({ posts: posts.map(summary) });
  } catch (err) { next(err); }
};

export const getPublished = async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({ slug: String(req.params.slug), status: "published" });
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.set("Cache-Control", "public, max-age=60");
    res.json({ post: full(post) });
  } catch (err) { next(err); }
};

// Every published post with its body — used by the frontend build to
// prerender each article as a real HTML page for search engines.
export const exportPublished = async (req, res, next) => {
  try {
    const posts = await BlogPost.find({ status: "published" }).sort({ publishedAt: -1 });
    res.json({ posts: posts.map(full) });
  } catch (err) { next(err); }
};

// ---------- Admin ----------
export const adminList = async (req, res, next) => {
  try {
    const posts = await BlogPost.find({}).sort({ updatedAt: -1 });
    res.json({ posts: posts.map(summary) });
  } catch (err) { next(err); }
};

export const adminGet = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id).catch(() => null);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json({ post: full(post) });
  } catch (err) { next(err); }
};

async function clean(body, id) {
  const title = String(body.title || "").trim().slice(0, 200);
  const slug = slugify(body.slug || title);
  const metaDescription = String(body.metaDescription || "").trim().slice(0, 300);
  const coverImageUrl = String(body.coverImageUrl || "").trim();
  const bodyHtml = sanitizeHtml(body.bodyHtml || "");
  if (!title) return { error: "Add a title." };
  if (!bodyHtml.replace(/<[^>]+>/g, "").trim()) return { error: "The post has no text yet." };
  if (coverImageUrl && !/^https?:\/\//i.test(coverImageUrl)) return { error: "The cover image address must start with https://" };
  const clash = await BlogPost.findOne({ slug, ...(id ? { _id: { $ne: id } } : {}) });
  if (clash) return { error: `Another post already uses the address /blog/${slug}. Change the URL slug.` };
  return { fields: { title, slug, metaDescription, coverImageUrl, bodyHtml } };
}

export const adminCreate = async (req, res, next) => {
  try {
    const { error, fields } = await clean(req.body || {});
    if (error) return res.status(400).json({ message: error });
    const publish = req.body.status === "published";
    const post = await BlogPost.create({ ...fields, status: publish ? "published" : "draft", publishedAt: publish ? new Date() : null });
    res.status(201).json({ post: full(post) });
    if (publish) afterPublish(post.slug);
  } catch (err) { next(err); }
};

// Bulk import: many ready-made article files at once (read in the browser by
// AdminBlog.tsx). Each becomes a "scheduled" post, one every `everyDays` days
// from `startDate` at `time` (India time); utils/blogSchedule.js publishes
// them when due. Posts whose slug already exists are skipped, never replaced.
export const adminBulk = async (req, res, next) => {
  try {
    const b = req.body || {};
    const items = Array.isArray(b.posts) ? b.posts.slice(0, 100) : [];
    const everyDays = Math.min(30, Math.max(1, parseInt(b.everyDays, 10) || 1));
    const offset = Math.max(0, parseInt(b.offset, 10) || 0); // posts already scheduled by earlier batches of this import
    const m = String(b.startDate || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const t = String(b.time || "09:00").match(/^(\d{2}):(\d{2})$/) || [null, "09", "00"];
    if (!m) return res.status(400).json({ message: "Pick a start date." });
    const first = Date.UTC(+m[1], +m[2] - 1, +m[3], +t[1], +t[2]) - 330 * 60 * 1000; // India time → UTC
    const results = [];
    let n = 0;
    for (const it of items) {
      const { error, fields } = await clean(it);
      if (error) { results.push({ title: String(it.title || "(no title)").slice(0, 200), ok: false, message: error }); continue; }
      const when = new Date(first + (offset + n) * everyDays * 86400000); // skipped files take no day
      await BlogPost.create({ ...fields, status: "scheduled", publishedAt: when });
      n += 1;
      results.push({ title: fields.title, ok: true, slug: fields.slug, when });
    }
    res.json({ scheduled: n, results });
  } catch (err) { next(err); }
};

export const adminUpdate = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id).catch(() => null);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const { error, fields } = await clean(req.body || {}, post._id);
    if (error) return res.status(400).json({ message: error });
    const wasPublished = post.status === "published";
    Object.assign(post, fields);
    if (req.body.status === "published") {
      // A scheduled post published by hand goes live now, not on its future date.
      post.publishedAt = post.status === "scheduled" ? new Date() : post.publishedAt || new Date();
      post.status = "published";
    }
    if (req.body.status === "draft") post.status = "draft";
    // status "scheduled" (or none) on a scheduled post: save the edits, keep the date.
    await post.save();
    res.json({ post: full(post) });
    if (!wasPublished && post.status === "published") afterPublish(post.slug);
  } catch (err) { next(err); }
};

export const adminDelete = async (req, res, next) => {
  try {
    const r = await BlogPost.findByIdAndDelete(req.params.id).catch(() => null);
    if (!r) return res.status(404).json({ message: "Post not found" });
    res.json({ message: "Post deleted" });
  } catch (err) { next(err); }
};
