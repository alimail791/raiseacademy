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

function pageHtml(route) {
  const m = metaFor(route);
  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(m.title)}</title>`);
  html = replaceAttr(html, /(<meta\s+name="description"\s+content=")[^"]*(")/, m.description);
  html = replaceAttr(html, /(<meta name="robots" content=")[^"]*(")/, m.noindex ? "noindex, follow" : "index, follow");
  html = replaceAttr(html, /(<link rel="canonical" href=")[^"]*(")/, m.canonical);
  html = replaceAttr(html, /(<meta property="og:title" content=")[^"]*(")/, m.title);
  html = replaceAttr(html, /(<meta property="og:description" content=")[^"]*(")/, m.description);
  html = replaceAttr(html, /(<meta property="og:url" content=")[^"]*(")/, m.canonical);
  html = replaceAttr(html, /(<meta name="twitter:title" content=")[^"]*(")/, m.title);
  return html.replace('<div id="root"></div>', `<div id="root">${render(route)}</div>`);
}

// Flat files (courses.html, not courses/index.html): `serve` maps /courses to
// courses.html via cleanUrls, and a same-named folder would get a directory
// listing at /courses/.
const routes = Object.keys(PAGE_META);
for (const route of routes) {
  const out = route === "/" ? path.join(dist, "index.html") : path.join(dist, `${route.slice(1)}.html`);
  fs.writeFileSync(out, pageHtml(route));
}

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
        { source: "/dashboard", destination: "/app.html" },
        { source: "/admin", destination: "/app.html" },
        { source: "/admin/**", destination: "/app.html" },
      ],
    },
    null,
    2
  )
);

const today = new Date().toISOString().slice(0, 10);
const indexable = routes.filter((r) => !PAGE_META[r].noindex && r !== "/neet-trial");
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
console.log(`Prerendered ${routes.length} pages; sitemap has ${indexable.length} URLs.`);
