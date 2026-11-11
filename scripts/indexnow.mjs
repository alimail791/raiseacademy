// IndexNow: tells Bing, Yandex, Seznam, Naver (and others that share IndexNow)
// about new and changed pages on www.yneet.in, so they're crawled in minutes.
// Run by .github/workflows/indexnow.yml. The key file is frontend/public/<key>.txt.
//
// Sends: every URL in the live sitemap that it hasn't sent before (state file
// from the previous run), plus pages that change daily. The first run sends all.
//   node scripts/indexnow.mjs --state .indexnow/sent.json [--all]
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const SITE = "https://www.yneet.in";
const HOST = "www.yneet.in";
const args = process.argv.slice(2);
const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const STATE = opt("--state") || ".indexnow/sent.json";

// Pages whose content changes every day (new question, new Shorts, new uploads).
const DAILY = ["/", "/neet-quiz-shorts", "/neet-question-of-the-day", "/neet-pyq-books", "/neet-practice", "/neet-cutoff"];

const keyFile = (await readdir(new URL("../frontend/public/", import.meta.url))).find((f) => /^[a-f0-9]{32}\.txt$/.test(f));
if (!keyFile) throw new Error("IndexNow key file missing in frontend/public/");
const KEY = keyFile.replace(/\.txt$/, "");

// The key file must be live before engines will accept submissions.
const live = await fetch(`${SITE}/${keyFile}`).then((r) => (r.ok ? r.text() : "")).catch(() => "");
if (live.trim() !== KEY) { console.log(`Key file not live yet at ${SITE}/${keyFile} — skipping this run.`); process.exit(0); }

const xml = await fetch(`${SITE}/sitemap.xml`).then((r) => r.text());
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).filter((u) => u.startsWith(SITE));
if (urls.length < 10) throw new Error(`Sitemap looks wrong (${urls.length} URLs)`);

// What's in the live sitemap, by page type (shows in the run log).
const TYPES = [
  ["NEET question pages", /\/neet-question\//], ["Class 6–10 question pages", /\/class-\d+-questions\/./], ["Class 6–10 hubs", /\/class-\d+-questions$/],
  ["Chapter PYQ pages", /\/neet-practice\/./], ["Year papers", /\/neet-question-papers\/\d{4}$/], ["Subject papers", /\/neet-question-papers\/\d{4}\/[a-z]+$/],
  ["State cutoffs (English)", /^https:\/\/www\.yneet\.in\/neet-cutoff\/./], ["Regional pages (ta/hi/te/kn)", /\.in\/(ta|hi|te|kn)\//],
  ["Blog posts", /\/blog\/./], ["NCERT notes", /\/ncert-notes\/./],
];
const counts = TYPES.map(([label, re]) => [label, urls.filter((u) => re.test(u)).length]);
const typed = new Set(urls.filter((u) => TYPES.some(([, re]) => re.test(u))));
console.log(`Live sitemap: ${urls.length} URLs`);
for (const [label, n] of counts) console.log(`  ${label}: ${n}`);
console.log(`  Other pages: ${urls.length - typed.size} — ${urls.filter((u) => !typed.has(u)).map((u) => u.replace("https://www.yneet.in", "") || "/").join(" ")}`);
const dates = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
const byDate = dates.reduce((a, d) => ((a[d] = (a[d] || 0) + 1), a), {});
console.log(`  lastmod dates: ${Object.entries(byDate).sort().map(([d, n]) => `${d}: ${n}`).join(", ")}`);

let sent = new Set();
try { sent = new Set(JSON.parse(await readFile(STATE, "utf8"))); } catch { /* first run */ }
const fresh = args.includes("--all") ? urls : urls.filter((u) => !sent.has(u));
const daily = DAILY.map((p) => `${SITE}${p}`); // "/" → https://www.yneet.in/ (as in the sitemap)
const toSend = [...new Set([...fresh, ...daily])];

let ok = 0;
for (let i = 0; i < toSend.length; i += 10000) {
  const urlList = toSend.slice(i, i + 10000);
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${SITE}/${keyFile}`, urlList }),
  });
  // 200 = accepted, 202 = accepted (key check pending); anything else is a problem.
  if (res.status !== 200 && res.status !== 202) {
    const body = (await res.text()).slice(0, 300);
    // A brand-new key is verified by IndexNow in the background (minutes to hours).
    // Don't record anything as sent; the next run tries everything again.
    if (res.status === 403 && /SiteVerificationNotCompleted/.test(body)) {
      console.log("IndexNow is still verifying the site key — nothing recorded; the next run will send these URLs.");
      process.exit(0);
    }
    throw new Error(`IndexNow responded ${res.status}: ${body}`);
  }
  ok += urlList.length;
}
await mkdir(path.dirname(STATE), { recursive: true });
await writeFile(STATE, JSON.stringify(urls));
console.log(`IndexNow: sent ${ok} URLs (${fresh.length} new of ${urls.length} in the sitemap, plus daily pages).`);
