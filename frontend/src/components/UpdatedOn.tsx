import { useLocation } from "react-router-dom";

// Visible "Updated <date>" line for evergreen pages. AI search tools (ChatGPT,
// Perplexity, Google AI answers) prefer pages that show they're fresh.
//
// The date is the page's real sitemap <lastmod> (the day its content last
// changed), filled in by scripts/prerender.mjs after the page is rendered:
// - build-time render: outputs a placeholder that prerender swaps for the date
//   (or removes the line if the page has no lastmod);
// - browser: reads <meta name="yn-updated" content="/route|YYYY-MM-DD"> that
//   prerender added to the page's <head>, and shows the date only on the page
//   it belongs to (nothing after in-app navigation to another page).
export const UPDATED_PLACEHOLDER = "YN_UPDATED_DATE";

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const UpdatedOn = ({ className = "" }: { className?: string }) => {
  const { pathname } = useLocation();
  const cls = `text-sm text-ink/50 dark:text-paper/50 mt-2 ${className}`.trim();
  if (typeof document === "undefined") {
    return <p className={cls} data-yn-updated="">Updated {UPDATED_PLACEHOLDER}</p>;
  }
  const raw = document.head.querySelector('meta[name="yn-updated"]')?.getAttribute("content") || "";
  const [route, date] = raw.split("|");
  if (!date || (route !== pathname.replace(/\/$/, "") && !(route === "/" && pathname === "/"))) return null;
  return <p className={cls} data-yn-updated="">Updated {fmt(date)}</p>;
};

export default UpdatedOn;
