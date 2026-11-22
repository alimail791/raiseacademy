// "Share today's article" email: when a blog post goes live, the person who
// runs the YNeet WhatsApp Channel gets the ready post (cover, text, link) by
// email, with a button that opens WhatsApp with the text filled in, so
// sharing it to the Channel is one tap. (WhatsApp's official API cannot post
// to Channels, so this is the safe way.) Recipients: BLOG_SHARE_EMAIL
// (comma-separated), default info@yneet.in. Sent once per post.
import BlogPost from "../models/BlogPost.js";
import { sendEmail } from "./sendEmail.js";

const SITE = "https://www.yneet.in";
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function shareText(post) {
  const url = `${SITE}/blog/${post.slug}`;
  const blurb = post.metaDescription ? `\n\n${post.metaDescription}` : "";
  return `📚 New on YNeet: ${post.title}${blurb}\n\nRead free 👉 ${url}`;
}

export function shareEmailHtml(post) {
  const text = shareText(post);
  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
  return `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#14213D">
  <p style="font-size:15px">Today's article is live. Share it to the <strong>YNeet WhatsApp Channel</strong>:</p>
  ${post.coverImageUrl ? `<img src="${esc(post.coverImageUrl)}" alt="" width="560" style="width:100%;border-radius:10px;margin:8px 0">` : ""}
  <p style="margin:18px 0"><a href="${esc(wa)}" style="background:#25D366;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Share on WhatsApp</a></p>
  <p style="font-size:14px;color:#444">On your phone: tap the button, choose the <strong>YNeet</strong> channel, then send. Or copy the text below and post it in the Channel.</p>
  <div style="background:#F4F6FA;border-radius:8px;padding:14px 16px;font-size:14px;white-space:pre-wrap">${esc(text)}</div>
  <p style="font-size:13px;color:#666;margin-top:18px">Also good for: your WhatsApp status, student and parent groups, and partner institutes.</p>
</div>`;
}

export async function sendShareEmail(postOrSlug) {
  const post = typeof postOrSlug === "string" ? await BlogPost.findOne({ slug: postOrSlug }) : postOrSlug;
  if (!post || post.status !== "published" || post.shareEmailSentAt) return false;
  const to = String(process.env.BLOG_SHARE_EMAIL || "info@yneet.in").split(",").map((s) => s.trim()).filter(Boolean);
  if (!to.length || !process.env.RESEND_API_KEY) return false;
  // Mark first, so two runs never send twice.
  const claimed = await BlogPost.updateOne({ _id: post._id, shareEmailSentAt: null }, { $set: { shareEmailSentAt: new Date() } });
  if (!claimed.modifiedCount) return false;
  try {
    await sendEmail({ to, subject: `Share today's YNeet article: ${post.title}`, html: shareEmailHtml(post) });
    console.log(`[blog] share email sent for ${post.slug}`);
    return true;
  } catch (err) {
    await BlogPost.updateOne({ _id: post._id }, { $set: { shareEmailSentAt: null } });
    console.error(`[blog] share email failed for ${post.slug}:`, err.message);
    return false;
  }
}
