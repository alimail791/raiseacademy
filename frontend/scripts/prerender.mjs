// Runs after `vite build` (see package.json "build"). For each public page it
// writes a real HTML file — dist/courses/index.html, dist/about/index.html,
// … — with that page's own <title>, description, canonical and rendered
// text. `serve -s dist` (the Railway start command) serves these files
// directly for their URLs and still falls back to dist/index.html for
// app-only routes like /dashboard, so nothing changes for logged-in users.
//
// Also regenerates public sitemap.xml from the same page list, so the sitemap
// can't drift from what is actually prerendered.

import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const ssrEntry = path.join(root, "dist-ssr", "entry-server.js");

const { render, metaFor, PAGE_META, SITE_ORIGIN, chapterMeta, paperMeta, questionMeta, schoolHubMeta, cutoffMeta, LANGS, CUTOFF_STATES, langsForState, regionalCutoffMeta, regionalCutoffIndexMeta, regionalWeightageMeta, alternates, NCERT_NOTES, ncertMeta } = await import(pathToFileURL(ssrEntry).href);

const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function replaceAttr(html, selectorRe, value) {
  return html.replace(selectorRe, (_m, a, b) => `${a}${esc(value)}${b}`);
}

// Data fetches retry a few times: a deploy that coincides with an API restart
// should wait it out, not ship without its pages.
async function fetchRetry(url, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      return await fetch(url, { signal: AbortSignal.timeout(60000) });
    } catch (err) {
      if (i >= tries) throw err;
      await new Promise((r) => setTimeout(r, 5000 * i));
    }
  }
}
// Sources whose fetch failed this build (see the strict check below).
const failedSources = [];

// Published blog posts, fetched from the API so each article ships as a real
// HTML page. If the API can't be reached the build still succeeds: the blog
// pages then load their content in the browser (see the /blog rewrites below).
const API_URL = (process.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
let blogPosts = [];
try {
  const res = await fetchRetry(`${API_URL}/blog/export`);
  if (!res.ok) throw new Error(`API responded ${res.status}`);
  blogPosts = (await res.json()).posts || [];
} catch (err) {
  console.warn(`prerender: could not fetch blog posts (${err.message}) — blog pages will load in the browser.`);
  failedSources.push("blog posts");
}
const summaries = blogPosts.map(({ bodyHtml, ...rest }) => rest);

// Free chapter practice pages (/neet-practice/<subject>/<chapter>): 10 free
// questions per NEET chapter from the YNeet API, rendered as real HTML so Google
// can index them. If the API is down, the build still succeeds and the pages
// load their questions in the browser (see the /neet-practice rewrite below).
const YNEET_API = (process.env.VITE_YNEET_API_URL || "").replace(/\/$/, "");
let practiceChapters = [];
if (YNEET_API) {
  try {
    const res = await fetchRetry(`${YNEET_API}/public/practice?full=1`);
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    practiceChapters = (await res.json()).chapters || [];
  } catch (err) {
    console.warn(`prerender: could not fetch practice chapters (${err.message}) — chapter pages will load in the browser.`);
    failedSources.push("practice chapters");
  }
}
const practiceSummaries = practiceChapters.map(({ questions, ...rest }) => rest);

// NEET previous-year papers by year (/neet-question-papers/<year>), same approach.
let papers = [];
if (YNEET_API) {
  try {
    const res = await fetchRetry(`${YNEET_API}/public/papers?full=1`);
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    papers = (await res.json()).papers || [];
  } catch (err) {
    console.warn(`prerender: could not fetch question papers (${err.message}) — paper pages will load in the browser.`);
    failedSources.push("question papers");
  }
}
const paperSummaries = papers.map(({ subjects, ...rest }) => rest);

// One-question pages (/neet-question/<question-words>-<id>), so a student who
// searches the text of a question lands on its answer. Capped per build
// (QUESTION_PAGES_LIMIT, default 3000) to keep deploys quick; the API orders
// them PYQs first and interleaves chapters, so raising the cap later just adds
// pages. Questions without a page yet still open in the browser (via 404.html,
// which loads the app), and get a real page on a later deploy.
const QUESTION_PAGES_LIMIT = Math.max(0, parseInt(process.env.QUESTION_PAGES_LIMIT ?? "3000", 10) || 0);
let questionPages = [];
if (YNEET_API && QUESTION_PAGES_LIMIT > 0) {
  try {
    const res = await fetchRetry(`${YNEET_API}/public/questions?limit=${QUESTION_PAGES_LIMIT}`);
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    questionPages = ((await res.json()).pages || []).filter((q) => /^[a-z0-9-]+$/i.test(q.slug));
  } catch (err) {
    console.warn(`prerender: could not fetch question pages (${err.message}) — skipping one-question pages.`);
    failedSources.push("question pages");
  }
}
// Class 6–10 Science MCQs: one hub per class (/class-<n>-questions) and one
// page per question (/class-<n>-questions/<slug>). Small enough to build all.
let schoolClasses = [];
let schoolPages = [];
if (YNEET_API) {
  try {
    const res = await fetchRetry(`${YNEET_API}/public/school-questions`);
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    const body = await res.json();
    schoolClasses = body.classes || [];
    schoolPages = (body.pages || []).filter((q) => /^[a-z0-9-]+$/i.test(q.slug) && /^(6|7|8|9|10)$/.test(String(q.classNum)));
  } catch (err) {
    console.warn(`prerender: could not fetch school questions (${err.message}) — skipping Class 6–10 pages.`);
    failedSources.push("Class 6–10 questions");
  }
}

// NEET cutoff pages (/neet-cutoff/<state>) from the College Predictor's data on
// the Raise Academy API (same server as the blog). Skipped if it can't be reached.
let cutoffStates = [];
try {
  const res = await fetchRetry(`${API_URL}/predictor/cutoff-pages`);
  if (!res.ok) throw new Error(`API responded ${res.status}`);
  cutoffStates = ((await res.json()).states || []).filter((c) => /^[a-z-]+$/.test(c.slug));
} catch (err) {
  console.warn(`prerender: could not fetch cutoff pages (${err.message}) — /neet-cutoff pages will load in the browser.`);
  failedSources.push("cutoff pages");
}

// A production build that can't reach the APIs used to deploy anyway: the
// sitemap dropped from thousands of URLs to ~40 and every practice, paper,
// question and cutoff page became an empty shell until the next good deploy.
// When the YNeet API is configured (production), a failed source now fails
// the build, so Railway keeps the last good deploy live. Local builds without
// VITE_YNEET_API_URL are unaffected; PRERENDER_ALLOW_PARTIAL=1 overrides.
const strict = !!YNEET_API && process.env.PRERENDER_ALLOW_PARTIAL !== "1";
if (strict && (practiceChapters.length === 0 || questionPages.length === 0) && !failedSources.length) {
  failedSources.push("practice chapters / question pages (empty response)");
}
if (strict && failedSources.length) {
  console.error(`prerender: aborting build — could not load: ${failedSources.join(", ")}. The live site stays on its last good deploy. Set PRERENDER_ALLOW_PARTIAL=1 to build anyway.`);
  process.exit(1);
}

// Daily NEET quiz Shorts (public YouTube videos the shorts-bot reported):
// listed on /neet-quiz-shorts and embedded on their question's page.
let quizShorts = [];
try {
  const res = await fetchRetry(`${API_URL}/youtube-shorts?limit=200`);
  if (!res.ok) throw new Error(`API responded ${res.status}`);
  quizShorts = (await res.json()).shorts || [];
} catch (err) {
  console.warn(`prerender: could not fetch quiz Shorts (${err.message}).`);
}
const shortBySlug = new Map(quizShorts.filter((x) => x.questionSlug).map((x) => [x.questionSlug, { videoId: x.videoId, thumbnail: x.thumbnail || "", title: x.title || "" }]));

// Each chapter page links to its question pages (how Google finds them besides the sitemap).
const QUESTION_LINKS_PER_CHAPTER = 60;
for (const c of practiceChapters) {
  c.questionLinks = questionPages
    .filter((q) => q.chapterSlug === c.slug)
    .slice(0, QUESTION_LINKS_PER_CHAPTER)
    .map((q) => ({ slug: q.slug, question: q.question.slice(0, 140), pyqYear: q.pyqYear }));
}
const practiceFile = (slug) => `${slug.replace("/", "--")}.html`;
const blogDataScript = (data) =>
  `<script>window.__BLOG_DATA__=${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
const practiceDataScript = (data) =>
  `<script>window.__PRACTICE_DATA__=${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;

// Content fingerprint of every page written (for honest sitemap <lastmod> dates).
const contentHash = new Map();
function pageHtml(route, blogData, metaOverride, practiceData) {
  const m = metaOverride || metaFor(route);
  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(m.title)}</title>`);
  html = replaceAttr(html, /(<meta\s+name="description"\s+content=")[^"]*(")/, m.description);
  html = replaceAttr(html, /(<meta name="robots" content=")[^"]*(")/, m.noindex ? "noindex, follow" : "index, follow");
  html = replaceAttr(html, /(<link rel="canonical" href=")[^"]*(")/, m.canonical);
  html = replaceAttr(html, /(<meta property="og:title" content=")[^"]*(")/, m.title);
  html = replaceAttr(html, /(<meta property="og:description" content=")[^"]*(")/, m.description);
  html = replaceAttr(html, /(<meta property="og:url" content=")[^"]*(")/, m.canonical);
  html = replaceAttr(html, /(<meta name="twitter:title" content=")[^"]*(")/, m.title);
  // Regional pages (/ta/…): page language + hreflang links to the other versions.
  if (m.lang) html = html.replace(/<html lang="[^"]*"/, `<html lang="${m.lang}"`);
  if (m.alternates?.length) html = html.replace("</head>", `${m.alternates.map((a) => `<link rel="alternate" hreflang="${a.hreflang}" href="${esc(a.href)}" />`).join("\n")}\n</head>`);
  const body = render(route, blogData, practiceData);
  contentHash.set(route, createHash("sha1").update(`${m.title}\n${m.description}\n${body}`).digest("hex").slice(0, 16));
  html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  if (blogData) html = html.replace("</head>", `${blogDataScript(blogData)}\n</head>`);
  if (practiceData) html = html.replace("</head>", `${practiceDataScript(practiceData)}\n</head>`);
  return html;
}

// Flat files (courses.html, not courses/index.html): `serve` maps /courses to
// courses.html via cleanUrls, and a same-named folder would get a directory
// listing at /courses/.
const routes = Object.keys(PAGE_META);
for (const route of routes) {
  const out = route === "/" ? path.join(dist, "index.html") : path.join(dist, `${route.slice(1)}.html`);
  fs.mkdirSync(path.dirname(out), { recursive: true }); // e.g. /embed/qotd → dist/embed/
  const pData = (route === "/neet-practice" || route === "/neet-chapter-wise-weightage") && practiceSummaries.length ? { chapters: practiceSummaries }
    : route === "/neet-question-papers" && paperSummaries.length ? { papers: paperSummaries }
    : route === "/neet-cutoff" && cutoffStates.length ? { cutoffs: cutoffStates }
    : route === "/neet-quiz-shorts" && quizShorts.length ? { quizShorts } : undefined;
  // The English cutoff index and weightage page also list their language versions.
  const alt = route === "/neet-cutoff" || route === "/neet-chapter-wise-weightage" ? { ...metaFor(route), alternates: alternates(route, LANGS, SITE_ORIGIN) } : undefined;
  fs.writeFileSync(out, pageHtml(route, route === "/blog" ? { posts: summaries } : undefined, alt, pData));
}

// One file per chapter in practice-pages/ (flat, like blog-posts/).
fs.mkdirSync(path.join(dist, "practice-pages"), { recursive: true });
for (const chapter of practiceChapters) {
  const route = `/neet-practice/${chapter.slug}`;
  const meta = { ...chapterMeta(chapter), canonical: `${SITE_ORIGIN}${route}` };
  fs.writeFileSync(path.join(dist, "practice-pages", practiceFile(chapter.slug)), pageHtml(route, undefined, meta, { chapter, chapters: practiceSummaries }));
}
fs.writeFileSync(
  path.join(dist, "practice-shell.html"),
  template.replace(/(<meta name="robots" content=")[^"]*(")/, "$1index, follow$2").replace(/\s*<link rel="canonical"[^>]*>/, "")
);

// One file per NEET paper year in paper-pages/.
fs.mkdirSync(path.join(dist, "paper-pages"), { recursive: true });
// The year page is an overview (subject links + questions per chapter), so it
// ships only each question's chapter; the questions live on the subject pages
// (/neet-question-papers/<year>/<subject>), one file each.
const SUBJECTS = ["Physics", "Chemistry", "Biology"];
const paperSubjectRoutes = [];
for (const paper of papers) {
  const route = `/neet-question-papers/${paper.year}`;
  const meta = { ...paperMeta(paper), canonical: `${SITE_ORIGIN}${route}` };
  const overview = { ...paper, subjects: Object.fromEntries(Object.entries(paper.subjects || {}).map(([s, qs]) => [s, qs.map((q) => ({ id: q.id, chapter: q.chapter }))])) };
  fs.writeFileSync(path.join(dist, "paper-pages", `${paper.year}.html`), pageHtml(route, undefined, meta, { paper: overview, papers: paperSummaries }));
  for (const subject of SUBJECTS) {
    if (!(paper.subjects?.[subject] || []).length) continue;
    const sRoute = `${route}/${subject.toLowerCase()}`;
    const sMeta = { ...paperMeta(paper, subject), canonical: `${SITE_ORIGIN}${sRoute}` };
    const only = { ...paper, subjects: { [subject]: paper.subjects[subject] } };
    fs.writeFileSync(path.join(dist, "paper-pages", `${paper.year}-${subject.toLowerCase()}.html`), pageHtml(sRoute, undefined, sMeta, { paper: only, papers: paperSummaries }));
    paperSubjectRoutes.push({ year: paper.year, subject: subject.toLowerCase() });
  }
}

// One file per question in neet-question/. No rewrite needed: with cleanUrls,
// /neet-question/<slug> is served straight from neet-question/<slug>.html
// (there is no /neet-question page, so the folder name can't clash).
fs.mkdirSync(path.join(dist, "neet-question"), { recursive: true });
for (const q of questionPages) {
  const route = `/neet-question/${q.slug}`;
  const meta = { ...questionMeta(q), canonical: `${SITE_ORIGIN}${route}` };
  const withShort = shortBySlug.has(q.slug) ? { ...q, short: shortBySlug.get(q.slug) } : q;
  fs.writeFileSync(path.join(dist, "neet-question", `${q.slug}.html`), pageHtml(route, undefined, meta, { question: withShort }));
}

// Class 6–10: hub file class-<n>-questions.html plus a same-named folder of
// question files. cleanUrls tries "<path>.html" first, so the hub URL is served
// from the file and the folder never shows (directoryListing is off anyway).
const schoolSummaries = schoolClasses.map(({ chapters, ...c }) => c);
for (const cl of schoolClasses) {
  const n = cl.classNum;
  const mine = schoolPages.filter((q) => q.classNum === n);
  const hub = {
    classNum: n, classes: schoolSummaries, chapters: cl.chapters,
    links: mine.map(({ slug, chapterSlug, question }) => ({ slug, chapterSlug, question: question.slice(0, 140) })),
  };
  const route = `/class-${n}-questions`;
  fs.writeFileSync(path.join(dist, `class-${n}-questions.html`), pageHtml(route, undefined, { ...schoolHubMeta(n, cl.total), canonical: `${SITE_ORIGIN}${route}` }, { school: hub }));
  fs.mkdirSync(path.join(dist, `class-${n}-questions`), { recursive: true });
  for (const q of mine) {
    const qRoute = `${route}/${q.slug}`;
    fs.writeFileSync(path.join(dist, `class-${n}-questions`, `${q.slug}.html`), pageHtml(qRoute, undefined, { ...questionMeta(q), canonical: `${SITE_ORIGIN}${qRoute}` }, { question: q }));
  }
}

// One file per cutoff state in neet-cutoff/ (cleanUrls, like class-<n>-questions/).
// Each page ships its own full table; other states only as names for the links.
fs.mkdirSync(path.join(dist, "neet-cutoff"), { recursive: true });
for (const c of cutoffStates) {
  const route = `/neet-cutoff/${c.slug}`;
  const others = cutoffStates.map((o) => (o.slug === c.slug ? o : { ...o, colleges: [], categorySummary: [] }));
  const langs = langsForState(c.slug);
  fs.writeFileSync(path.join(dist, "neet-cutoff", `${c.slug}.html`), pageHtml(route, undefined, { ...cutoffMeta(c), canonical: `${SITE_ORIGIN}${route}`, ...(langs.length && { alternates: alternates(route, langs, SITE_ORIGIN) }) }, { cutoffs: others }));
}

// Tamil / Hindi / Telugu / Kannada versions (/<lang>/neet-cutoff…, /<lang>/neet-chapter-wise-weightage).
const regionalRoutes = [];
for (const lang of LANGS) {
  fs.mkdirSync(path.join(dist, lang, "neet-cutoff"), { recursive: true });
  const write = (route, file, meta, data) => {
    fs.writeFileSync(path.join(dist, file), pageHtml(route, undefined, { ...meta, canonical: `${SITE_ORIGIN}${route}`, lang }, data));
    regionalRoutes.push(route);
  };
  if (cutoffStates.length) {
    write(`/${lang}/neet-cutoff`, `${lang}/neet-cutoff.html`, { ...regionalCutoffIndexMeta(lang), alternates: alternates("/neet-cutoff", LANGS, SITE_ORIGIN) }, { cutoffs: cutoffStates });
    for (const c of cutoffStates.filter((x) => CUTOFF_STATES[lang].includes(x.slug))) {
      const others = cutoffStates.map((o) => (o.slug === c.slug ? o : { ...o, colleges: [], categorySummary: [] }));
      write(`/${lang}/neet-cutoff/${c.slug}`, `${lang}/neet-cutoff/${c.slug}.html`, { ...regionalCutoffMeta(lang, c), alternates: alternates(`/neet-cutoff/${c.slug}`, langsForState(c.slug), SITE_ORIGIN) }, { cutoffs: others });
    }
  }
  if (practiceSummaries.length) {
    write(`/${lang}/neet-chapter-wise-weightage`, `${lang}/neet-chapter-wise-weightage.html`, { ...regionalWeightageMeta(lang), alternates: alternates("/neet-chapter-wise-weightage", LANGS, SITE_ORIGIN) }, { chapters: practiceSummaries });
  }
}

// NCERT notes (static content in src/ncert/notes.ts), one file each in ncert-pages/.
fs.mkdirSync(path.join(dist, "ncert-pages"), { recursive: true });
for (const n of NCERT_NOTES) {
  const route = `/ncert-notes/${n.slug}`;
  const meta = { ...ncertMeta(n), canonical: `${SITE_ORIGIN}${route}` };
  fs.writeFileSync(path.join(dist, "ncert-pages", `${n.slug}.html`), pageHtml(route, undefined, meta, practiceSummaries.length ? { chapters: practiceSummaries } : undefined));
}

// One file per published article, in blog-posts/ (not blog/, which would
// clash with blog.html under cleanUrls). serve.json below maps each
// /blog/<slug> to its file.
fs.mkdirSync(path.join(dist, "blog-posts"), { recursive: true });
for (const post of blogPosts) {
  const route = `/blog/${post.slug}`;
  const meta = { title: `${post.title} | YNeet`, description: post.metaDescription || post.excerpt, canonical: `${SITE_ORIGIN}${route}` };
  fs.writeFileSync(path.join(dist, "blog-posts", `${post.slug}.html`), pageHtml(route, { post, posts: summaries }, meta));
}
// Articles published after this build: an indexable shell that loads the
// article in the browser. The next deploy turns them into real files.
fs.writeFileSync(
  path.join(dist, "blog-shell.html"),
  template.replace(/(<meta name="robots" content=")[^"]*(")/, "$1index, follow$2").replace(/\s*<link rel="canonical"[^>]*>/, "")
);

// Logged-in app routes get the plain, empty shell (no homepage text flash,
// noindex). Anything else unknown gets a real 404 status via 404.html,
// instead of the old `serve -s` behaviour of answering every mistyped URL
// with the homepage and a 200 — a "soft 404" in Search Console.
const noindex = (html) => html.replace(/(<meta name="robots" content=")[^"]*(")/, "$1noindex, follow$2");
fs.writeFileSync(path.join(dist, "app.html"), noindex(template).replace(/\s*<link rel="canonical"[^>]*>/, ""));
fs.writeFileSync(
  path.join(dist, "404.html"),
  noindex(template)
    .replace(/<title>[\s\S]*?<\/title>/, "<title>Page not found — YNeet</title>")
    .replace(/\s*<link rel="canonical"[^>]*>/, "")
    .replace('<div id="root"></div>', `<div id="root">${render("/__not-found__")}</div>`)
);

// Config for the Railway start command `serve dist` (no -s: single-page mode
// puts its catch-all rewrite ahead of everything, which would hide the files
// above). Only the client-side app routes are rewritten.
fs.writeFileSync(
  path.join(dist, "serve.json"),
  JSON.stringify(
    {
      cleanUrls: true,
      trailingSlash: false,
      directoryListing: false,
      // Common misspellings of the free-trial landing page ("trail" for "trial") go to the real page.
      redirects: ["/neet-trail", "/free-trial", "/free-trail", "/trial", "/trail"].map((source) => ({ source, destination: "/neet-trial", type: 301 })),
      rewrites: [
        ...blogPosts.map((p) => ({ source: `/blog/${p.slug}`, destination: `/blog-posts/${p.slug}.html` })),
        { source: "/blog/:slug", destination: "/blog-shell.html" },
        ...practiceChapters.map((c) => ({ source: `/neet-practice/${c.slug}`, destination: `/practice-pages/${practiceFile(c.slug)}` })),
        { source: "/neet-practice/:subject/:chapter", destination: "/practice-shell.html" },
        ...papers.map((p) => ({ source: `/neet-question-papers/${p.year}`, destination: `/paper-pages/${p.year}.html` })),
        { source: "/neet-question-papers/:year", destination: "/practice-shell.html" },
        ...paperSubjectRoutes.map((r) => ({ source: `/neet-question-papers/${r.year}/${r.subject}`, destination: `/paper-pages/${r.year}-${r.subject}.html` })),
        { source: "/neet-question-papers/:year/:subject", destination: "/practice-shell.html" },
        ...NCERT_NOTES.map((n) => ({ source: `/ncert-notes/${n.slug}`, destination: `/ncert-pages/${n.slug}.html` })),
        { source: "/logout", destination: "/app.html" },
        { source: "/dashboard", destination: "/app.html" },
        { source: "/admin", destination: "/app.html" },
        { source: "/admin/**", destination: "/app.html" },
        { source: "/institute", destination: "/app.html" },
        { source: "/institute/**", destination: "/app.html" },
      ],
    },
    null,
    2
  )
);

// <lastmod> = the day a page's content last changed, not the build date (search
// engines ignore lastmod when it's always "today"). Previous fingerprints and
// dates come from the live site's sitemap-lastmod.json; a page keeps its date
// until its text, title or description changes.
const today = new Date().toISOString().slice(0, 10);
let prevLastmod = {};
try {
  const r = await fetch(process.env.SITEMAP_LASTMOD_URL || `${SITE_ORIGIN}/sitemap-lastmod.json`, { signal: AbortSignal.timeout(15000) });
  if (r.ok) prevLastmod = await r.json();
} catch { /* first build with this: every page gets today */ }
const indexable = [
  ...routes.filter((r) => !PAGE_META[r].noindex && r !== "/neet-trial"),
  ...blogPosts.map((p) => `/blog/${p.slug}`),
  ...practiceChapters.map((c) => `/neet-practice/${c.slug}`),
  ...papers.map((p) => `/neet-question-papers/${p.year}`),
  ...paperSubjectRoutes.map((r) => `/neet-question-papers/${r.year}/${r.subject}`),
  ...NCERT_NOTES.map((n) => `/ncert-notes/${n.slug}`),
  ...questionPages.map((q) => `/neet-question/${q.slug}`),
  ...cutoffStates.map((c) => `/neet-cutoff/${c.slug}`),
  ...regionalRoutes,
  ...schoolClasses.map((c) => `/class-${c.classNum}-questions`),
  ...schoolPages.map((q) => `/class-${q.classNum}-questions/${q.slug}`),
];
const lastmod = {};
let changed = 0;
for (const r of indexable) {
  const h = contentHash.get(r) || "";
  const prev = prevLastmod[r];
  const same = prev && h && prev.h === h;
  lastmod[r] = { h, d: same ? prev.d : today };
  if (!same) changed++;
}
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable
  .map((r) => `  <url>
    <loc>${SITE_ORIGIN}${r}</loc>
    <lastmod>${lastmod[r].d}</lastmod>
  </url>`)
  .join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(dist, "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(dist, "sitemap-lastmod.json"), JSON.stringify(lastmod));
console.log(`Sitemap lastmod: ${changed} new or changed pages dated ${today}, ${indexable.length - changed} kept their earlier date.`);

// llms.txt for AI search engines: what YNeet is and its main pages, built from
// the same PAGE_META titles and descriptions (prices included) as the pages,
// so it can't contradict them.
{
  const pick = (r) => PAGE_META[r] && !PAGE_META[r].noindex ? `- [${PAGE_META[r].title}](${SITE_ORIGIN}${r === "/" ? "/" : r}): ${PAGE_META[r].description}` : null;
  const section = (title, list) => `## ${title}\n\n${list.map(pick).filter(Boolean).join("\n")}\n`;
  const freeTools = routes.filter((r) => !PAGE_META[r].noindex && /^\/neet-|^\/ncert-|^\/brain-teaser|^\/ask-yneet|^\/blog$/.test(r) && r !== "/neet-trial" && r !== "/neet-parents" && r !== "/neet-pyq-books");
  const llmsTxt = [
    `# YNeet\n`,
    `> ${PAGE_META["/"].description}\n`,
    `YNeet is an online NEET UG preparation platform by Raise Academy (Chennai, India). Students use the app at https://app.yneet.in; this site (${SITE_ORIGIN}) has plans, prices and free NEET tools.\n`,
    section("Plans and prices", ["/courses", "/neet-trial", "/neet-parents", "/institutes", "/neet-pyq-books"]),
    section("About", ["/about", "/help"]),
    section("Free NEET tools and study material", freeTools),
  ].join("\n");
  fs.writeFileSync(path.join(dist, "llms.txt"), llmsTxt);
}

fs.rmSync(path.join(root, "dist-ssr"), { recursive: true, force: true });
console.log(`Prerendered ${practiceChapters.length} chapter practice pages, ${papers.length} question-paper years, ${questionPages.length} one-question pages and ${schoolPages.length} Class 6–10 question pages (${schoolClasses.map((c) => `C${c.classNum}:${c.total}`).join(" ")}).`);
if (practiceSummaries.length) {
  const have = new Set(practiceSummaries.map((c) => c.slug));
  const slug = (x) => x.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  const missing = NCERT_NOTES.filter((n) => !have.has(`${slug(n.subject)}/${slug(n.chapter)}`)).map((n) => n.chapter);
  console.log(`NCERT_NOTES ${NCERT_NOTES.length} pages; no matching PYQ page for: ${missing.join(", ") || "none"}`);
}
if (papers.length) console.log("PAPERS " + papers.map((p) => `${p.year}:${p.total}(P${p.counts.Physics}/C${p.counts.Chemistry}/B${p.counts.Biology})`).join(" "));
if (practiceChapters.length) console.log("PRACTICE_CHAPTERS " + practiceChapters.map((c) => `${c.subject[0]}:${c.chapter}(${c.total}/${c.pyqCount})`).join(" | "));
console.log(`Quiz Shorts: ${quizShorts.length} public (${shortBySlug.size} linked to question pages).`);
console.log(`Prerendered ${cutoffStates.length} NEET cutoff state pages and ${regionalRoutes.length} regional-language pages.`);
console.log(`Prerendered ${routes.length} pages and ${blogPosts.length} blog posts; sitemap has ${indexable.length} URLs.`);
