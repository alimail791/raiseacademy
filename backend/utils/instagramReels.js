import mongoose from "mongoose";
import InstaReel from "../models/InstaReel.js";
import IgAuth from "../models/IgAuth.js";

// Posts the daily NEET quiz Reels to Instagram (Instagram API with Instagram Login).
// Needs one Railway variable: IG_ACCESS_TOKEN (long-lived token of the Instagram
// professional account). Optional: IG_USER_ID, PUBLIC_API_URL.
// Every 5 minutes: refresh the token weekly, then post any Reel whose time has come:
// create a container from the public video URL, wait until Instagram has processed it, publish.

const GRAPH = (process.env.IG_GRAPH_URL || "https://graph.instagram.com/v21.0").replace(/\/$/, "");
const TICK_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const LATE_MS = 3 * 3600 * 1000; // older than this when first seen (e.g. before Instagram was connected) → skip, don't flood

export const reelsBucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "reels" });
const publicBase = () => (process.env.PUBLIC_API_URL || "https://raiseacademy-production.up.railway.app/api").replace(/\/$/, "");
export const videoUrl = (r) => `${publicBase()}/instagram-reels/video/${r._id}.mp4`;
export const igConfigured = () => !!process.env.IG_ACCESS_TOKEN;

async function ig(path, { method = "GET", token, body } = {}) {
  const url = new URL(path.startsWith("http") ? path : `${GRAPH}${path}`);
  if (method === "GET") url.searchParams.set("access_token", token);
  const res = await fetch(url, {
    method,
    headers: method === "GET" ? {} : { "content-type": "application/json" },
    body: method === "GET" ? undefined : JSON.stringify({ ...body, access_token: token }),
    signal: AbortSignal.timeout(60000),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.error) throw new Error(j.error?.message || `Instagram responded ${res.status}`);
  return j;
}

export async function getAuth() {
  const env = process.env.IG_ACCESS_TOKEN;
  if (!env) return null;
  let a = await IgAuth.findById("ig");
  if (!a || a.fromEnv !== env) a = await IgAuth.findOneAndUpdate({ _id: "ig" }, { token: env, fromEnv: env, userId: "", username: "", refreshedAt: new Date() }, { upsert: true, new: true });
  if (Date.now() - new Date(a.refreshedAt || 0) > 7 * 864e5) {
    try {
      const r = await ig(`${GRAPH.replace(/\/v[0-9.]+$/, "")}/refresh_access_token?grant_type=ig_refresh_token`, { token: a.token });
      if (r.access_token) { a.token = r.access_token; a.refreshedAt = new Date(); await a.save(); console.log("Instagram: token refreshed"); }
    } catch (e) { console.warn(`Instagram: token refresh failed — ${e.message}`); }
  }
  if (!a.userId) {
    const me = await ig(`/me?fields=user_id,username`, { token: a.token });
    a.userId = process.env.IG_USER_ID || me.user_id || me.id; a.username = me.username || ""; await a.save();
  }
  return a;
}

async function step(r, auth) {
  if (!r.containerId) {
    const c = await ig(`/${auth.userId}/media`, { method: "POST", token: auth.token, body: { media_type: "REELS", video_url: videoUrl(r), caption: r.caption, share_to_feed: true } });
    r.containerId = c.id; r.status = "posting"; await r.save();
    return; // Instagram needs a minute or two to fetch and process the video
  }
  const s = await ig(`/${r.containerId}?fields=status_code,status`, { token: auth.token });
  if (s.status_code === "IN_PROGRESS") return;
  if (s.status_code !== "FINISHED") throw new Error(`Processing ${s.status_code}: ${s.status || ""}`);
  const p = await ig(`/${auth.userId}/media_publish`, { method: "POST", token: auth.token, body: { creation_id: r.containerId } });
  r.mediaId = p.id; r.status = "posted"; r.postedAt = new Date(); r.error = "";
  try { r.permalink = (await ig(`/${p.id}?fields=permalink`, { token: auth.token })).permalink || ""; } catch { /* optional */ }
  await r.save();
  console.log(`Instagram: posted ${r.key} ${r.permalink}`);
}

let running = false;
export async function tick() {
  if (running || !igConfigured()) return;
  running = true;
  try {
    const now = Date.now();
    const due = await InstaReel.find({ status: { $in: ["pending", "posting"] }, $or: [{ publishAt: null }, { publishAt: { $lte: new Date(now) } }] }).sort({ publishAt: 1 }).limit(5);
    if (!due.length) return;
    const auth = await getAuth();
    for (const r of due) {
      if (r.status === "pending" && !r.containerId && r.publishAt && now - r.publishAt > LATE_MS) { r.status = "skipped"; r.error = "Too late when first seen"; await r.save(); continue; }
      try { await step(r, auth); }
      catch (e) {
        r.attempts += 1; r.error = e.message.slice(0, 300); r.containerId = "";
        r.status = r.attempts >= MAX_ATTEMPTS ? "failed" : "pending";
        await r.save();
        console.warn(`Instagram: ${r.key} attempt ${r.attempts} failed — ${e.message}`);
      }
    }
    // Videos are only needed until Instagram has them.
    const old = await InstaReel.find({ status: { $in: ["posted", "skipped", "failed"] }, fileId: { $ne: null }, updatedAt: { $lt: new Date(now - 3 * 864e5) } }).limit(20);
    for (const r of old) { await reelsBucket().delete(r.fileId).catch(() => {}); r.fileId = undefined; await r.save(); }
  } catch (e) {
    console.warn(`Instagram: ${e.message}`);
  } finally { running = false; }
}

export function startInstagramReelsJob() {
  setTimeout(tick, 30 * 1000);
  setInterval(tick, TICK_MS);
}
