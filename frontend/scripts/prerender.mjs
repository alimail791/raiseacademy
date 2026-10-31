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
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const ssrEntry = path.join(root, "dist-ssr", "entry-server.js");

const { render, metaFor, PAGE_META, SITE_ORIGIN, chapterMeta, paperMeta, NCERT_NOTES, ncertMeta } = await import(pathToFileURL(ssrEntry).href);

const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function replaceAttr(html, selectorRe, value) {
  return html.replace(selectorRe, (_m, a, b) => `${a}${esc(value)}${b}`);
}

// Published blog posts, fetched from the API so each article ships as a real
// HTML page. If the API can't be reached the build still succeeds: the blog
// pages then load their content in the browser (see the /blog rewrites below).
const API_URL = (process.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
let blogPosts = [];
try {
  const res = await fetch(`${API_URL}/blog/export`);
  if (!res.ok) throw new Error(`API responded ${res.status}`);
  blogPosts = (await res.json()).posts || [];
} catch (err) {
  console.warn(`prerender: could not fetch blog posts (${err.message}) — blog pages will load in the browser.`);
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
    const res = await fetch(`${YNEET_API}/public/practice?full=1`);
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    practiceChapters = (await res.json()).chapters || [];
  } catch (err) {
    console.warn(`prerender: could not fetch practice chapters (${err.message}) — chapter pages will load in the browser.`);
  }
}
const practiceSummaries = practiceChapters.map(({ questions, ...rest }) => rest);

// NEET previous-year papers by year (/neet-question-papers/<year>), same approach.
let papers = [];
if (YNEET_API) {
  try {
    const res = await fetch(`${YNEET_API}/public/papers?full=1`);
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    papers = (await res.json()).papers || [];
  } catch (err) {
    console.warn(`prerender: could not fetch question papers (${err.message}) — paper pages will load in the browser.`);
  }
}
const paperSummaries = papers.map(({ subjects, ...rest }) => rest);
const practiceFile = (slug) => `${slug.replace("/", "--")}.html`;
const blogDataScript = (data) =>
  `<script>window.__BLOG_DATA__=${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
const practiceDataScript = (data) =>
  `<script>window.__PRACTICE_DATA__=${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;

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
  html = html.replace('<div id="root"></div>', `<div id="root">${render(route, blogData, practiceData)}</div>`);
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
  const pData = route === "/neet-practice" && practiceSummaries.length ? { chapters: practiceSummaries }
    : route === "/neet-question-papers" && paperSummaries.length ? { papers: paperSummaries } : undefined;
  fs.writeFileSync(out, pageHtml(route, route === "/blog" ? { posts: summaries } : undefined, undefined, pData));
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
for (const paper of papers) {
  const route = `/neet-question-papers/${paper.year}`;
  const meta = { ...paperMeta(paper), canonical: `${SITE_ORIGIN}${route}` };
  fs.writeFileSync(path.join(dist, "paper-pages", `${paper.year}.html`), pageHtml(route, undefined, meta, { paper, papers: paperSummaries }));
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
        ...NCERT_NOTES.map((n) => ({ source: `/ncert-notes/${n.slug}`, destination: `/ncert-pages/${n.slug}.html` })),
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

const today = new Date().toISOString().slice(0, 10);
const indexable = [
  ...routes.filter((r) => !PAGE_META[r].noindex && r !== "/neet-trial"),
  ...blogPosts.map((p) => `/blog/${p.slug}`),
  ...practiceChapters.map((c) => `/neet-practice/${c.slug}`),
  ...papers.map((p) => `/neet-question-papers/${p.year}`),
  ...NCERT_NOTES.map((n) => `/ncert-notes/${n.slug}`),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable
  .map((r) => `  <url>
    <loc>${SITE_ORIGIN}${r}</loc>
    <lastmod>${today}</lastmod>
  </url>`)
  .join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(dist, "sitemap.xml"), sitemap);

fs.rmSync(path.join(root, "dist-ssr"), { recursive: true, force: true });
console.log(`Prerendered ${practiceChapters.length} chapter practice pages and ${papers.length} question-paper years.`);
if (practiceSummaries.length) {
  const have = new Set(practiceSummaries.map((c) => c.slug));
  const slug = (x) => x.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  const missing = NCERT_NOTES.filter((n) => !have.has(`${slug(n.subject)}/${slug(n.chapter)}`)).map((n) => n.chapter);
  console.log(`NCERT_NOTES ${NCERT_NOTES.length} pages; no matching PYQ page for: ${missing.join(", ") || "none"}`);
}
if (papers.length) console.log("PAPERS " + papers.map((p) => `${p.year}:${p.total}(P${p.counts.Physics}/C${p.counts.Chemistry}/B${p.counts.Biology})`).join(" "));
if (practiceChapters.length) console.log("PRACTICE_CHAPTERS " + practiceChapters.map((c) => `${c.subject[0]}:${c.chapter}(${c.total}/${c.pyqCount})`).join(" | "));
console.log(`Prerendered ${routes.length} pages and ${blogPosts.length} blog posts; sitemap has ${indexable.length} URLs.`);
