// One place for every public page's <title>, description and canonical.
// Used twice: by scripts/prerender.mjs at build time (so Google gets the
// right tags in the raw HTML) and by usePageMeta() in the browser (so they
// stay right when a visitor navigates between pages without a reload).
// Before this, every URL shipped the homepage's tags — /courses and /about
// both told Google "my canonical is https://www.yneet.in/".

export const SITE_ORIGIN = "https://www.yneet.in";

export type PageMeta = {
  title: string;
  description: string;
  noindex?: boolean;
};

export const PAGE_META: Record<string, PageMeta> = {
  "/": {
    title: "YNeet | NEET Coaching, Mock Tests & Practice Questions Online",
    description:
      "YNeet — NEET preparation built around your class syllabus. Full-length mock tests, daily quizzes, thousands of practice questions, a mistake notebook, flashcards, and formula sheets for Class 6 through Dropper. Free sample test, no login needed.",
  },
  "/courses": {
    title: "NEET Online Course for Class 11, 12 & Droppers — Mock Tests & Practice | YNeet",
    description:
      "Online NEET preparation for Class 11, Class 12 and droppers, plus NEET Foundation for Classes 6–10. Chapter-wise and full-length mock tests, previous year questions, daily quizzes and WhatsApp doubt support. Start with a ₹99 five-day trial.",
  },
  "/about": {
    title: "About YNeet — Class-Wise NEET Preparation from Class 6 to Dropper",
    description:
      "YNeet is a NEET preparation platform with mock tests, daily quizzes, a practice question bank, a mistake notebook, flashcards and formula sheets — matched to your exact class, from Class 6 foundation to Dropper.",
  },
  "/help": {
    title: "Help & FAQs — YNeet NEET Preparation",
    description:
      "Answers to common questions about YNeet: how to enroll, which courses are available, the free sample test and ₹99 trial, plans, and how to reach us on WhatsApp.",
  },
  "/neet-trial": {
    title: "Start NEET Prep for ₹99 — 5-Day Full-Access Trial | YNeet",
    description:
      "Five days of full access to every YNeet mock test, daily quiz and practice question for just ₹99. Made for Class 11, 12 and droppers. Monthly plans from ₹300.",
  },
  "/register": {
    title: "Register for YNeet — Start Your NEET Preparation",
    description:
      "Create your YNeet account in about two minutes and start NEET preparation with mock tests, daily quizzes and practice questions matched to your class.",
  },
  "/login": {
    title: "Log in — YNeet",
    description: "Log in to your YNeet account.",
    noindex: true,
  },
  "/forgot-password": {
    title: "Reset your password — YNeet",
    description: "Reset your YNeet account password.",
    noindex: true,
  },
};

export function metaFor(path: string): PageMeta & { canonical: string } {
  const clean = path !== "/" ? path.replace(/\/+$/, "") : "/";
  const isAppRoute = clean === "/dashboard" || clean === "/admin" || clean.startsWith("/admin/");
  const meta =
    PAGE_META[clean] ||
    (isAppRoute
      ? { ...PAGE_META["/"], noindex: true }
      : { title: "Page not found — YNeet", description: PAGE_META["/"].description, noindex: true });
  return { ...meta, canonical: `${SITE_ORIGIN}${clean === "/" ? "/" : clean}` };
}
