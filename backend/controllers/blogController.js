import BlogPost from "../models/BlogPost.js";
import { sanitizeHtml, slugify, excerptFrom } from "../utils/blogHtml.js";

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
  } catch (err) { next(err); }
};

export const adminUpdate = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id).catch(() => null);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const { error, fields } = await clean(req.body || {}, post._id);
    if (error) return res.status(400).json({ message: error });
    Object.assign(post, fields);
    if (req.body.status === "published") { post.status = "published"; post.publishedAt = post.publishedAt || new Date(); }
    if (req.body.status === "draft") post.status = "draft";
    await post.save();
    res.json({ post: full(post) });
  } catch (err) { next(err); }
};

export const adminDelete = async (req, res, next) => {
  try {
    const r = await BlogPost.findByIdAndDelete(req.params.id).catch(() => null);
    if (!r) return res.status(404).json({ message: "Post not found" });
    res.json({ message: "Post deleted" });
  } catch (err) { next(err); }
};
