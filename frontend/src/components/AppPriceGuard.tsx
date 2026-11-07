import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isFramed, tellYneetApp } from "../utils/appMode";

// Inside the YNeet Android app the website must not show prices, plans or payment
// links (Google Play payments policy: the app is "consumption only").
//
// 1. Adds class "in-app" to <html>; index.css hides links to /courses, pay.yneet.in
//    and institute pages, and anything marked className="web-only".
// 2. Watches the page and hides any small block whose text shows a rupee price
//    (blog posts and other text from the database can mention prices too).
const PRICE = /₹\s?\d|\brs\.?\s?\d{2,}|\binr\s?\d/i;
const BLOCKS = "p, li, tr, td, h1, h2, h3, h4, h5, h6, blockquote, figcaption, small, a, button";

function hidePrices(root: ParentNode) {
  const walker = document.createTreeWalker(root as Node, NodeFilter.SHOW_TEXT);
  const hits: Element[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.nodeValue || "";
    if (!PRICE.test(t)) continue;
    const el = (n.parentElement && n.parentElement.closest(BLOCKS)) || n.parentElement;
    if (el && !el.closest("[data-app-keep]")) hits.push(el);
  }
  hits.forEach((el) => ((el as HTMLElement).style.display = "none"));
}

export function AppPriceGuard() {
  useEffect(() => {
    document.documentElement.classList.add("in-app");
    hidePrices(document.body);
    const mo = new MutationObserver((list) => {
      for (const m of list) m.addedNodes.forEach((n) => {
        if (n.nodeType === 1) hidePrices(n as Element);
        else if (n.nodeType === 3 && n.parentElement) hidePrices(n.parentElement);
      });
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: false });
    return () => { mo.disconnect(); document.documentElement.classList.remove("in-app"); };
  }, []);
  return null;
}

// A page that isn't available in the app (home page, courses, institutes...):
// inside the app frame, go back to the app's Explore screen; otherwise to login.
export function AppLeave() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (isFramed()) tellYneetApp({ type: "yneet-explore" });
  }, [pathname]);
  if (isFramed()) return <p className="py-20 text-center text-ink/50">Opening YNeet…</p>;
  return <Navigate to="/login" replace />;
}
