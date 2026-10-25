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
      "Online NEET preparation for Class 11, Class 12 and droppers, plus NEET Foundation for Classes 6–10. Chapter-wise and full-length mock tests, previous year questions, daily quizzes and WhatsApp doubt support. Start with a free 30-day trial.",
  },
  "/about": {
    title: "About YNeet — Class-Wise NEET Preparation from Class 6 to Dropper",
    description:
      "YNeet is a NEET preparation platform with mock tests, daily quizzes, a practice question bank, a mistake notebook, flashcards and formula sheets — matched to your exact class, from Class 6 foundation to Dropper.",
  },
  "/help": {
    title: "Help & FAQs — YNeet NEET Preparation",
    description:
      "Answers to common questions about YNeet: how to enroll, which courses are available, the free sample test and free 30-day trial, plans, and how to reach us on WhatsApp.",
  },
  "/neet-trial": {
    title: "Start NEET Prep Free — 30-Day Full-Access Trial | YNeet",
    description:
      "30 days of free full access to every YNeet mock test, daily quiz and practice question. Made for Class 11, 12 and droppers. After the trial, plans from ₹399/month or ₹3,199 for a full year.",
  },
  "/institutes": {
    title: "YNeet for NEET Coaching Centres — Student Packs from ₹9,999/month",
    description:
      "Give your NEET students full mock tests, chapter tests, PYQs 2016–2026 and instant analysis, with a live progress panel for your institute and weekly parent reports. Monthly plans from ₹9,999 for 20 students.",
  },
  "/blog": {
    title: "NEET Preparation Blog — PYQs, Mock Tests, Cutoffs & Study Plans | YNeet",
    description:
      "NEET preparation guides from YNeet: how to use previous year questions, mock test strategy, cutoffs, counselling and study plans for Class 11, 12 and droppers.",
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
  // Institute panel pages (login, forgot password, dashboard) — not indexed.
  if (clean === "/institute" || clean.startsWith("/institute/")) {
    const title = clean === "/institute/login" ? "Institute Login — YNeet" : clean === "/institute/forgot" ? "Reset Institute Password — YNeet" : "Institute Panel — YNeet";
    return { title, description: "YNeet institute panel for coaching centres.", noindex: true, canonical: `${SITE_ORIGIN}${clean}` };
  }
  // Individual articles set their own title/description once loaded (see
  // pages/BlogPost.tsx); until then they get the blog's tags, still indexable.
  if (/^\/blog\/[^/]+$/.test(clean)) return { ...PAGE_META["/blog"], canonical: `${SITE_ORIGIN}${clean}` };
  const meta =
    PAGE_META[clean] ||
    (isAppRoute
      ? { ...PAGE_META["/"], noindex: true }
      : { title: "Page not found — YNeet", description: PAGE_META["/"].description, noindex: true });
  return { ...meta, canonical: `${SITE_ORIGIN}${clean === "/" ? "/" : clean}` };
}
