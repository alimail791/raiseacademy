// Scheduled blog posts (status "scheduled", publishedAt in the future — made
// by the bulk import in the admin Blog page) go live on their own. Every 5
// minutes this publishes the ones that are due, then:
//  1. tells Bing and the other IndexNow engines about the new URLs right away;
//  2. rebuilds the website (www.yneet.in, Railway project courteous-quietude)
//     so the new post ships as real HTML, in the sitemap, with its FAQ
//     markup. Needs FRONTEND_DEPLOY_TOKEN: a Railway *project* token for
//     courteous-quietude (Project settings → Tokens). Without it this step is
//     skipped and the post still shows (the page loads it in the browser),
//     until the next deploy of the website.
import BlogPost from "../models/BlogPost.js";
import { sendShareEmail } from "./blogShare.js";

const SITE = "https://www.yneet.in";
const INDEXNOW_KEY = "9ff4c670a3bb00e77127363f9fea3aa9"; // = frontend/public/<key>.txt
const FRONTEND_SERVICE_ID = process.env.FRONTEND_SERVICE_ID || "94262233-21b8-4fe0-b6ff-71784c0e7745";
const FRONTEND_ENVIRONMENT_ID = process.env.FRONTEND_ENVIRONMENT_ID || "027d9af4-8091-416f-8a2c-7e81bbab857d";
const live = () => !!process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === "production";

export async function publishDuePosts(now = new Date()) {
  const due = await BlogPost.find({ status: "scheduled", publishedAt: { $lte: now } }, { slug: 1 });
  if (!due.length) return [];
  await BlogPost.updateMany({ _id: { $in: due.map((p) => p._id) }, status: "scheduled" }, { $set: { status: "published" } });
  const slugs = due.map((p) => p.slug);
  console.log(`[blog] published scheduled post(s): ${slugs.join(", ")}`);
  return slugs;
}

async function pingIndexNow(slugs) {
  const urlList = [...slugs.map((s) => `${SITE}/blog/${s}`), `${SITE}/blog`];
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: "www.yneet.in", key: INDEXNOW_KEY, keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`, urlList }),
    });
    console.log(`[blog] IndexNow: ${urlList.length} URL(s), HTTP ${res.status}`);
  } catch (err) {
    console.error("[blog] IndexNow failed:", err.message);
  }
}

async function rebuildWebsite() {
  const token = process.env.FRONTEND_DEPLOY_TOKEN;
  if (!token) { console.log("[blog] FRONTEND_DEPLOY_TOKEN not set; the website picks up the new post on its next deploy."); return false; }
  try {
    const res = await fetch("https://backboard.railway.com/graphql/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Project-Access-Token": token },
      body: JSON.stringify({
        query: "mutation($serviceId: String!, $environmentId: String!) { serviceInstanceDeployV2(serviceId: $serviceId, environmentId: $environmentId) }",
        variables: { serviceId: FRONTEND_SERVICE_ID, environmentId: FRONTEND_ENVIRONMENT_ID },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.errors) { console.error("[blog] website rebuild failed:", JSON.stringify(data.errors || data).slice(0, 300)); return false; }
    console.log("[blog] website rebuild started:", data.data?.serviceInstanceDeployV2);
    return true;
  } catch (err) {
    console.error("[blog] website rebuild failed:", err.message);
    return false;
  }
}

// Everything that happens when posts go live (scheduled or published by hand):
// IndexNow now; a website rebuild; then, once the rebuilt pages (with the
// cover as the share image) are up, IndexNow again and the share email.
// Without a rebuild the share email goes out right away.
export async function onPublished(slugs) {
  if (!slugs.length || !live()) return;
  await pingIndexNow(slugs);
  const rebuilding = await rebuildWebsite();
  const after = async () => {
    if (rebuilding) await pingIndexNow(slugs);
    for (const s of slugs) await sendShareEmail(s);
  };
  if (rebuilding) setTimeout(() => after().catch((e) => console.error("[blog] after-publish failed:", e.message)), 12 * 60 * 1000).unref();
  else await after();
}

async function run() {
  try {
    await onPublished(await publishDuePosts());
  } catch (err) {
    console.error("[blog] scheduled publish failed:", err.message);
  }
}

export function startBlogScheduleJob() {
  setTimeout(run, 20 * 1000).unref();
  setInterval(run, 5 * 60 * 1000).unref();
}
