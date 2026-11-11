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
  if (res.status !== 200 && res.status !== 202) throw new Error(`IndexNow responded ${res.status}: ${(await res.text()).slice(0, 200)}`);
  ok += urlList.length;
}
await mkdir(path.dirname(STATE), { recursive: true });
await writeFile(STATE, JSON.stringify(urls));
console.log(`IndexNow: sent ${ok} URLs (${fresh.length} new of ${urls.length} in the sitemap, plus daily pages).`);
