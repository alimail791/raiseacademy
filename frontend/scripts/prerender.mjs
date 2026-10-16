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

const { render, metaFor, PAGE_META, SITE_ORIGIN } = await import(pathToFileURL(ssrEntry).href);

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
const blogDataScript = (data) =>
  `<script>window.__BLOG_DATA__=${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;

function pageHtml(route, blogData, metaOverride) {
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
  html = html.replace('<div id="root"></div>', `<div id="root">${render(route, blogData)}</div>`);
  if (blogData) html = html.replace("</head>", `${blogDataScript(blogData)}\n</head>`);
  return html;
}

// Flat files (courses.html, not courses/index.html): `serve` maps /courses to
// courses.html via cleanUrls, and a same-named folder would get a directory
// listing at /courses/.
const routes = Object.keys(PAGE_META);
for (const route of routes) {
  const out = route === "/" ? path.join(dist, "index.html") : path.join(dist, `${route.slice(1)}.html`);
  fs.writeFileSync(out, pageHtml(route, route === "/blog" ? { posts: summaries } : undefined));
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
      rewrites: [
        ...blogPosts.map((p) => ({ source: `/blog/${p.slug}`, destination: `/blog-posts/${p.slug}.html` })),
        { source: "/blog/:slug", destination: "/blog-shell.html" },
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
console.log(`Prerendered ${routes.length} pages and ${blogPosts.length} blog posts; sitemap has ${indexable.length} URLs.`);
