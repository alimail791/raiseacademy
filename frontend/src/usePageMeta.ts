import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { metaFor } from "./seo";

function setTag(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let el = document.head.querySelector(selector) as HTMLElement | null;
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

const meta = (key: string, isProperty = false) => () => {
  const el = document.createElement("meta");
  el.setAttribute(isProperty ? "property" : "name", key);
  return el;
};

// Keeps <title>, description, canonical and robots in step with the current
// route during in-app navigation. The prerendered HTML already has the right
// values for the first load; this only matters once React Router takes over.
export default function usePageMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const m = metaFor(pathname);
    document.title = m.title;
    setTag('meta[name="description"]', meta("description"), "content", m.description);
    setTag('meta[name="robots"]', meta("robots"), "content", m.noindex ? "noindex, follow" : "index, follow");
    setTag('meta[property="og:title"]', meta("og:title", true), "content", m.title);
    setTag('meta[property="og:description"]', meta("og:description", true), "content", m.description);
    setTag('meta[property="og:url"]', meta("og:url", true), "content", m.canonical);
    setTag('meta[name="twitter:title"]', meta("twitter:title"), "content", m.title);
    setTag('link[rel="canonical"]', () => {
      const el = document.createElement("link");
      el.setAttribute("rel", "canonical");
      return el;
    }, "href", m.canonical);
  }, [pathname]);
}
