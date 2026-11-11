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
      "YNeet — NEET preparation built around your class syllabus. Full-length NEET mock tests, PYQs and 70,000+ practice questions for Class 11, 12 and droppers, Foundation tests for Class 9–10, and free tests, puzzles, quiz and Shorts for Class 6–8. Free sample test, no login needed.",
  },
  "/courses": {
    title: "NEET Online Course from Class 6 to Droppers — Mock Tests, Shorts & Practice | YNeet",
    description:
      "Online NEET preparation for Class 11, 12 and droppers (₹399/month), NEET Foundation for Class 9–10 (₹299/month) and free YNeet Junior for Class 6–8. Mock tests, PYQs, concept Shorts, daily quizzes, puzzles and WhatsApp doubt support. 30 days free from Class 9.",
  },
  "/about": {
    title: "About YNeet — Class-Wise NEET Preparation from Class 6 to Dropper",
    description:
      "YNeet is a NEET preparation platform with mock tests, daily quizzes, a practice question bank, a mistake notebook, flashcards and formula sheets for Class 11, 12 and droppers, NEET Foundation for Class 9–10 and free daily puzzles for Class 6–8.",
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
    title: "YNeet for NEET Coaching Centres — Student Plans from ₹3,999/month",
    description:
      "Give your NEET students full mock tests, chapter tests, PYQs 2016–2026 and instant analysis, with a live progress panel for your institute and weekly parent reports. Monthly plans from ₹3,999 for 20 students, and a free 14-day pilot with 5 students.",
  },
  "/neet-readiness": {
    title: "NEET Readiness Test — Free 15-Question Score Check | YNeet",
    description:
      "How ready are you for NEET? Take a free 15-question test (Physics, Chemistry, Biology) with NEET marking, get your readiness score out of 100, your weak chapters and a shareable score card. No login.",
  },
  "/neet-parents": {
    title: "NEET Preparation with a Weekly Report for Parents | YNeet",
    description:
      "YNeet sends parents a weekly NEET progress report: days studied, tests taken, mock scores, accuracy and weak chapters. 1,200+ NEET tests from ₹399/month. Free for 30 days, no card.",
  },
  "/neet-question-papers": {
    title: "NEET Previous Year Question Papers with Answers (Year-wise) — Free | YNeet",
    description: "NEET question papers year by year with answers and explanations for every question. Physics, Chemistry and Biology. Free, no login.",
  },
  "/neet-sprint": {
    title: "NEET 60-Second Sprint — 5 Quick NEET MCQs Against the Clock (Free) | YNeet",
    description: "Play a free NEET speed round: 5 quick Physics, Chemistry and Biology questions in 60 seconds, with answers. No login. Compare your score with YNeet students.",
  },
  "/neet-concept-maps": {
    title: "NEET Concept Maps — Whole NCERT Chapters on One Page (Free) | YNeet",
    description: "Free one-page concept maps of NCERT Biology, Chemistry and Physics chapters for NEET revision. A new map every Monday. No login needed.",
  },
  "/ask-yneet": {
    title: "Ask YNeet — NEET Doubts Answered by Teachers (Physics, Chemistry, Biology) | YNeet",
    description: "Real NEET doubts from students, answered step by step by YNeet teachers. A new answer every Friday. Ask your own doubt in the YNeet app.",
  },
  "/brain-teaser": {
    title: "Science Brain Teaser for Class 6–8 — New Every Wednesday | YNeet",
    description: "A fun 'Who am I?' science riddle for Class 6, 7 and 8 students every Wednesday, from the NCERT syllabus. Pick an answer; it's revealed the next day.",
  },
  "/neet-question-of-the-day": {
    title: "NEET Question of the Day — Daily NEET MCQ with Answer | YNeet",
    description: "One NEET-level question every day, mostly from previous NEET papers, with the answer and explanation. Free, no login. Challenge your friends.",
  },
  "/neet-college-predictor": {
    title: "NEET College Predictor 2027 — MBBS & BDS Colleges by Rank (AIQ + State Quota) | YNeet",
    description:
      "Free NEET college predictor: enter your NEET rank and category to see the MBBS and BDS colleges you can get under the All India Quota and your state quota (Tamil Nadu, Karnataka, Kerala, AP, Telangana, Maharashtra, UP, Bihar, Rajasthan, Delhi, Punjab, Gujarat, Madhya Pradesh, Jharkhand, West Bengal), from last year's official closing ranks.",
  },
  "/neet-college-predictor/report": {
    title: "Your NEET Choice-Filling Report | YNeet",
    description: "Your personal NEET college choice-filling list from the YNeet College Predictor.",
    noindex: true,
  },
  "/neet-2027-exam-date": {
    title: "NEET 2027 Exam Date, Pattern & Marking Scheme — What's Confirmed | YNeet",
    description: "NEET UG 2027 exam date status, registration, CBT and attempt-limit news, and the exam pattern: 180 questions, 720 marks, +4/−1, 3 hours. Checked against NTA notices.",
  },
  "/neet-score-calculator": {
    title: "NEET Score Calculator 2027 — Calculate Marks from Answer Key + Expected Rank (Free) | YNeet",
    description:
      "Free NEET score calculator: match your responses with the NEET answer key (+4/−1), get your score out of 720 for Physics, Chemistry, Botany and Zoology, your expected All India Rank and the MBBS colleges it can get you.",
  },
  "/neet-registration": {
    title: "NEET 2027 Registration: Dates, Eligibility, Fees, Documents & Step-by-Step Guide | YNeet",
    description:
      "How to fill the NEET 2027 application form: expected dates, eligibility checker (age, Class 12, subjects), category-wise fees, a saved document checklist, upload rules and common mistakes. Free WhatsApp alert when registration opens.",
  },
  "/neet-photo-resizer": {
    title: "NEET Photo Size Resizer — Passport, Postcard Photo, Signature & Thumb in KB (Free) | YNeet",
    description:
      "Free NEET photo and signature resizer: crop and compress your passport photo, 4×6 postcard photo, signature and thumb impressions to the exact KB size for the NEET form. Works on your phone, nothing is uploaded.",
  },
  "/neet-question-widget": {
    title: "Free NEET Widgets for Your Website — Question of the Day, College Predictor, Cutoffs | YNeet",
    description: "Free NEET widgets for coaching centre, school and blog websites: a daily NEET question, a NEET college predictor and state-wise government MBBS cutoffs. Copy one code, no sign-up.",
  },
  "/embed/predictor": {
    title: "NEET College Predictor — YNeet",
    description: "Free NEET college predictor box by YNeet.",
    noindex: true,
  },
  "/embed/cutoff": {
    title: "NEET Cutoff — YNeet",
    description: "Government MBBS NEET cutoffs by YNeet.",
    noindex: true,
  },
  "/embed/qotd": {
    title: "NEET Question of the Day — YNeet",
    description: "Today's NEET question with answer and explanation, by YNeet.",
    noindex: true,
  },
  "/ncert-notes": {
    title: "NCERT Biology Notes for NEET — Chapter-wise, Free | YNeet",
    description: "Short NCERT Class 11 and 12 Biology notes for NEET: key points, quick tables and common traps for each chapter, with free PYQs to practise. No login.",
  },
  "/neet-practice": {
    title: "NEET Chapter-wise PYQs & Practice Questions with Answers — Free | YNeet",
    description:
      "Free NEET previous year questions for every Physics, Chemistry and Biology chapter, with answers and explanations. No login needed. Timed chapter tests and full mocks free for 30 days on YNeet.",
  },
  "/neet-cutoff": {
    title: "NEET Cutoff for Government MBBS — All India Quota & State-wise Closing Ranks | YNeet",
    description:
      "NEET closing ranks for every government MBBS college, category-wise: All India Quota and state quota for Tamil Nadu, Karnataka, Kerala, Maharashtra, AP, Telangana, Rajasthan and more. From official counselling data.",
  },
  "/neet-chapter-wise-weightage": {
    title: "NEET Chapter-wise Weightage 2027 — Physics, Chemistry, Biology (Ranked) | YNeet",
    description:
      "NEET chapter-wise weightage for Physics, Chemistry and Biology: expected questions and marks per chapter, ranked High, Medium and Low priority from previous year papers. Free, with PYQs for every chapter.",
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
  "/privacy": {
    title: "Privacy policy — YNeet",
    description: "What YNeet collects, why, who it is shared with, and how to see or delete your data.",
  },
  "/neet-shorts": {
    title: "YNeet Shorts — quick NEET concept videos",
    description: "Short NEET Physics, Chemistry and Biology concept videos from teachers, under 2 minutes each. Free to watch.",
  },
  "/terms": {
    title: "Terms of Service — YNeet",
    description: "The terms for using YNeet: accounts, free trial and one-time plans, fair use, AI explanations, refunds and contact.",
  },
  "/delete-account": {
    title: "Delete your YNeet account",
    description: "How to ask YNeet to delete your account and data, what is deleted and what is kept.",
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
  // Chapter pages set their own title once loaded (pages/PracticeChapter.tsx); the build writes them into the HTML.
  if (/^\/neet-question-papers\/\d{4}(\/(physics|chemistry|biology))?$/.test(clean)) return { ...PAGE_META["/neet-question-papers"], canonical: `${SITE_ORIGIN}${clean}` };
  if (/^\/neet-practice\/[^/]+\/[^/]+$/.test(clean)) return { ...PAGE_META["/neet-practice"], canonical: `${SITE_ORIGIN}${clean}` };
  // One-question pages set their own title once loaded (pages/QuestionPage.tsx); the build writes them into the HTML.
  // Class 6–10 Science MCQ hubs and questions set their own tags once loaded (pages/SchoolHub.tsx, QuestionPage.tsx).
  if (/^\/class-(6|7|8|9|10)-questions(\/[^/]+)?$/.test(clean)) return { ...PAGE_META["/neet-practice"], canonical: `${SITE_ORIGIN}${clean}` };
  if (/^\/(ta|hi|te|kn)\/(neet-cutoff(\/[a-z-]+)?|neet-chapter-wise-weightage)$/.test(clean)) return { ...PAGE_META["/neet-cutoff"], canonical: `${SITE_ORIGIN}${clean}` };
  if (/^\/neet-cutoff\/[a-z-]+$/.test(clean)) return { ...PAGE_META["/neet-cutoff"], canonical: `${SITE_ORIGIN}${clean}` };
  if (/^\/neet-question\/[^/]+$/.test(clean)) return { ...PAGE_META["/neet-practice"], canonical: `${SITE_ORIGIN}${clean}` };
  const meta =
    PAGE_META[clean] ||
    (isAppRoute
      ? { ...PAGE_META["/"], noindex: true }
      : { title: "Page not found — YNeet", description: PAGE_META["/"].description, noindex: true });
  return { ...meta, canonical: `${SITE_ORIGIN}${clean === "/" ? "/" : clean}` };
}
