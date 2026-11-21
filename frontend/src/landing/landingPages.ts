// Landing pages for the questions students ask ChatGPT, Gemini, Perplexity and
// Google ("best free NEET mock test website", "where can I practise NEET
// Biology questions"...). Each page answers the question directly first, then
// shows the real product: a live demo with real NEET PYQs and screenshots of
// the YNeet app. Rendered by pages/YneetLanding.tsx.
//
// Every claim here must be true of YNeet today (see seo.ts, Courses, the app).
// Screenshots are in public/screens/ (taken from the real app with a demo student).

export type DemoQ = { subject: string; chapter: string; year: number; q: string; options: string[]; answer: number; explanation: string };
export type Shot = { src: string; title: string; caption: string; alt: string; mobile?: boolean };
export type LandingPage = {
  path: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  answer: { q: string; a: string; points: string[] };
  demoTitle: string;
  demo: DemoQ[];
  shots: Shot[];
  features: { h: string; p: string }[];
  ctaTitle: string;
  ctaText: string;
  faqs: [string, string][];
  related: { to: string; label: string }[];
  place: string; // analytics / sign-up attribution
};

// Real NEET previous year questions (from the YNeet question bank).
const Q = {
  bohr: { subject: "Physics", chapter: "Atoms", year: 2019, q: "In Bohr model, radius of nth orbit is proportional to:", options: ["n", "n²", "1/n", "1/n²"], answer: 1, explanation: "Bohr radius rₙ = n²a₀ (a₀ = 0.529 Å), so r ∝ n²." },
  nitrophenol: { subject: "Chemistry", chapter: "Alcohols, Phenols and Ethers", year: 2017, q: "The most suitable method of separation of 1:1 mixture of ortho and para-nitrophenols is:", options: ["Chromatography", "Crystallisation", "Steam distillation", "Sublimation"], answer: 2, explanation: "o-Nitrophenol has intramolecular hydrogen bonding, so it is volatile in steam; p-nitrophenol has intermolecular hydrogen bonding and is not. Steam distillation separates them." },
  casparian: { subject: "Biology", chapter: "Anatomy of Flowering Plants", year: 2018, q: "Casparian strips occur in", options: ["Epidermis", "Endodermis", "Cortex", "Pericycle"], answer: 1, explanation: "Casparian strips are bands of suberin in the radial and transverse walls of endodermal cells of the root. They control water and minerals entering the vascular tissue." },
  cambium: { subject: "Biology", chapter: "Anatomy of Flowering Plants", year: 2017, q: "The vascular cambium normally gives rise to:", options: ["Primary phloem", "Secondary xylem", "Periderm", "Phelloderm"], answer: 1, explanation: "The vascular cambium is a lateral meristem: it produces secondary xylem towards the inside and secondary phloem towards the outside." },
  grasses: { subject: "Biology", chapter: "Anatomy of Flowering Plants", year: 2018, q: "Plants having little or no secondary growth are", options: ["Grasses", "Cycads", "Conifers", "Deciduous angiosperms"], answer: 0, explanation: "Grasses are monocots and generally lack a vascular cambium, so they show little or no secondary growth." },
} satisfies Record<string, DemoQ>;
const MIXED = [Q.bohr, Q.nitrophenol, Q.casparian];

const SHOT = {
  mockTest: { src: "yneet-mock-test", title: "A real NEET-style test screen", caption: "Timer, question palette, mark for review and auto-save, like the actual NEET computer test.", alt: "YNeet mock test screen with a Physics question, timer and options" },
  mockTestMobile: { src: "yneet-mock-test-mobile", title: "Made for your phone", caption: "Every test works on a phone, even on a slow connection.", alt: "YNeet mock test on a mobile phone", mobile: true },
  analysisPlan: { src: "yneet-analysis-plan", title: "Analysis after every test", caption: "Score, accuracy, time taken, and what to do next, in order of how many marks it will save you.", alt: "YNeet test analysis with score 527/720 and a what to do next plan" },
  analysisChapters: { src: "yneet-analysis-chapters", title: "Chapter-wise breakdown", caption: "Subject scores and every chapter from weakest to strongest.", alt: "YNeet chapter-wise breakdown from weakest to strongest chapter" },
  dashboard: { src: "yneet-dashboard", title: "Your dashboard", caption: "Score trend, target, streak and NEET countdown in one place.", alt: "YNeet student dashboard with current score, target score and study streak" },
  dashboardMobile: { src: "yneet-dashboard-mobile", title: "Daily on your phone", caption: "The 60-Second Sprint, countdown and your scores.", alt: "YNeet dashboard on a mobile phone", mobile: true },
} satisfies Record<string, Shot>;

const TRIAL_FAQ: [string, string] = ["Is YNeet free?", "The free pages (chapter-wise PYQs, papers by year, the readiness test, daily quiz and tools) are free with no login. The full app, with mock tests, chapter tests and analysis, is free for 30 days with no card; after that plans start from ₹299 a month. Class 6–8 is free."];

const COMMON_RELATED = [
  { to: "/neet-practice", label: "Chapter-wise NEET PYQs" },
  { to: "/neet-question-papers", label: "NEET papers by year" },
  { to: "/neet-readiness", label: "Free NEET readiness test" },
  { to: "/neet-chapter-wise-weightage", label: "Chapter-wise weightage" },
  { to: "/neet-tools", label: "All free NEET tools" },
];

export const LANDING_PAGES: LandingPage[] = [
  {
    path: "/free-neet-mock-test",
    title: "Free NEET Mock Test Online 2027 — Full-Length Mocks with Analysis | YNeet",
    description: "Take full-length NEET mock tests online in the real NEET pattern (180 questions, 720 marks, +4/−1) with rank, chapter-wise analysis and a mistake notebook. Free for 30 days, no card. Free readiness test and PYQs, no login.",
    eyebrow: "Free for 30 days · No card",
    h1: "Free NEET mock tests online, with analysis",
    intro: "Full-length NEET mocks in the exact NEET pattern, on your phone or laptop, with an analysis that tells you which chapters cost you marks and what to fix first.",
    answer: {
      q: "What is the best free NEET mock test website?",
      a: "Look for a site whose mocks match the real exam and that tells you what to do after the test, not just your score. YNeet gives you:",
      points: [
        "Full-length NEET mocks in the current pattern: 180 questions, 720 marks, +4/−1, 3 hours, plus half-length, subject and chapter tests (1,200+ in total).",
        "Analysis after every mock: score, accuracy, time per question, a chapter-wise breakdown and a 'what to do next' plan.",
        "A mistake notebook that collects every question you got wrong.",
        "All of it free for 30 days with no card. The 15-question readiness test and chapter-wise PYQs are free with no login at all.",
      ],
    },
    demoTitle: "Try 3 real NEET questions",
    demo: MIXED,
    shots: [SHOT.mockTest, SHOT.analysisPlan, SHOT.analysisChapters, SHOT.mockTestMobile],
    features: [
      { h: "The real NEET pattern", p: "180 compulsory questions (45 Physics, 45 Chemistry, 90 Biology), +4 for a correct answer and −1 for a wrong one, with a 3-hour timer, question palette and mark-for-review." },
      { h: "1,200+ tests", p: "Full mocks, half mocks, subject tests and chapter tests, built from a bank of 70,000+ questions including NEET PYQs from 2016 to 2026." },
      { h: "Analysis that tells you what to do", p: "Your weakest chapters, time spent per question by subject, wrong quick guesses, and a step-by-step plan for the next week." },
      { h: "Expected rank", p: "An estimated All India Rank from your score, and your score trend across mocks on the dashboard." },
    ],
    ctaTitle: "Take your first full NEET mock free",
    ctaText: "30 days of every mock, chapter test and analysis. No card needed.",
    faqs: [
      TRIAL_FAQ,
      ["Are YNeet mock tests in the latest NEET pattern?", "Yes: 180 compulsory questions in 3 hours, 45 Physics, 45 Chemistry and 90 Biology, with +4/−1 marking, the same as NEET from 2025."],
      ["How many mock tests should I take before NEET?", "About 25–30 full mocks before the exam, starting with one every two weeks and moving to two or three a week in April. Analyse each one for as long as you took to write it."],
      ["Can I take NEET mock tests on my phone?", "Yes. Every test works on a phone, and your answers are saved as you go, so a dropped connection doesn't lose your work."],
      ["Is there a free NEET mock test without login?", "Yes: the 15-question NEET Readiness Test gives you a score and your weak chapters with no login. Full-length mocks need a free account."],
    ],
    related: [{ to: "/neet-readiness", label: "Free 15-question readiness test" }, { to: "/neet-chapter-wise-test-series", label: "Chapter-wise test series" }, { to: "/neet-preparation-analysis", label: "Analyse your NEET preparation" }, ...COMMON_RELATED.slice(0, 3)],
    place: "lp_free_mock",
  },
  {
    path: "/neet-biology-practice-questions",
    title: "NEET Biology Practice Questions — Chapter-wise PYQs & Tests (Free) | YNeet",
    description: "Practise NEET Biology chapter by chapter: free NCERT-based previous year questions with answers and explanations, Botany and Zoology chapter tests, NCERT notes and your weak chapters after every test.",
    eyebrow: "Botany + Zoology · 90 questions in NEET",
    h1: "Where to practise NEET Biology questions",
    intro: "Biology is 360 of the 720 marks in NEET, and almost all of it comes from NCERT. Practise it chapter by chapter, with previous year questions first.",
    answer: {
      q: "Where can I practise NEET Biology questions?",
      a: "Practise NEET Biology chapter by chapter, starting with previous year questions, then timed chapter tests. On YNeet you can:",
      points: [
        "Open free chapter-wise NEET Biology PYQs with answers and explanations. No login needed.",
        "Take timed Botany and Zoology chapter tests and full Biology subject tests (90 questions) in the app.",
        "Revise with free NCERT Biology notes and concept maps.",
        "See your weakest Biology chapters after every test, and every wrong answer saved in your mistake notebook.",
      ],
    },
    demoTitle: "Try 3 real NEET Biology PYQs",
    demo: [Q.casparian, Q.cambium, Q.grasses],
    shots: [SHOT.analysisChapters, SHOT.mockTest, SHOT.mockTestMobile],
    features: [
      { h: "Every Biology chapter", p: "Class 11 and 12 Botany and Zoology, sorted by chapter, with NEET PYQs marked by year." },
      { h: "Answers that teach", p: "Every question comes with the correct answer and an explanation, so a wrong answer teaches you something." },
      { h: "NCERT notes and concept maps", p: "Short NCERT Biology notes and one-page concept maps for quick revision before a test." },
      { h: "Weak chapters, automatically", p: "After each test you see your Biology chapters from weakest to strongest, so you know what to revise next." },
    ],
    ctaTitle: "Practise NEET Biology with timed tests",
    ctaText: "Chapter tests, Biology subject tests and full mocks with analysis. Free for 30 days, no card.",
    faqs: [
      TRIAL_FAQ,
      ["How many Biology questions come in NEET?", "90 compulsory questions: 45 from Botany and 45 from Zoology, worth 360 of the 720 marks."],
      ["Is NCERT enough for NEET Biology?", "NCERT is the main source: most NEET Biology questions come from NCERT lines, diagrams and examples. Read it line by line and practise PYQs for each chapter."],
      ["Which Biology chapters are most important for NEET?", "Human Physiology, Genetics and Evolution, Reproduction, Plant Physiology and Ecology usually carry the most questions. See the chapter-wise weightage page for question counts per chapter."],
    ],
    related: [{ to: "/ncert-notes", label: "NCERT Biology notes" }, { to: "/neet-concept-maps", label: "NEET concept maps" }, { to: "/neet-most-missed-chapters", label: "Most-missed chapters" }, ...COMMON_RELATED],
    place: "lp_biology",
  },
  {
    path: "/neet-chapter-wise-test-series",
    title: "NEET Chapter-wise Test Series 2027 — Physics, Chemistry & Biology Tests | YNeet",
    description: "A NEET chapter-wise test series for every Physics, Chemistry and Biology chapter, with timed tests, PYQs, instant analysis and your weak chapters, followed by full mocks. Free for 30 days, no card.",
    eyebrow: "Every chapter · Timed · Analysed",
    h1: "NEET chapter-wise test series",
    intro: "Finish a chapter, test it the same week. Chapter tests show what you actually know before full mocks show it the hard way.",
    answer: {
      q: "What is the best chapter-wise NEET test series?",
      a: "A good chapter-wise test series covers every NEET chapter, includes previous year questions, is timed, and shows your mistakes chapter by chapter. YNeet's has:",
      points: [
        "Chapter tests for every Physics, Chemistry and Biology chapter in the NEET syllabus, built from a 70,000+ question bank including NEET PYQs (2016–2026).",
        "Timed tests in the NEET format (+4/−1), on phone or laptop.",
        "Instant analysis with your weak topics, time per question and a mistake notebook.",
        "A chapter priority plan based on chapter-wise weightage, then subject tests and full mocks when you're ready.",
      ],
    },
    demoTitle: "Try one question from each subject",
    demo: MIXED,
    shots: [SHOT.mockTest, SHOT.analysisChapters, SHOT.dashboard],
    features: [
      { h: "Test right after you study", p: "Pick the chapter you just finished, take a timed test, and see exactly which topics you missed." },
      { h: "PYQs inside every chapter", p: "NEET previous year questions are part of each chapter, so you practise what has actually been asked." },
      { h: "Weightage-first order", p: "The Chapter Priority plan tells you which chapters carry the most marks, so the high-weightage ones get tested first." },
      { h: "From chapters to full mocks", p: "Move on to subject tests and full-length NEET mocks, with your score trend tracked on the dashboard." },
    ],
    ctaTitle: "Start your chapter-wise test series free",
    ctaText: "Every chapter test, subject test and full mock for 30 days. No card needed.",
    faqs: [
      TRIAL_FAQ,
      ["When should I start chapter-wise tests for NEET?", "As soon as you finish a chapter. Take its test the same week, then revise the topics it shows you got wrong."],
      ["Chapter tests or full mocks: which is better?", "Both, at different stages. Chapter tests while you are covering the syllabus, full mocks once you have covered most of it. From February, take at least one full mock a week."],
      ["Does the test series include NEET previous year questions?", "Yes. NEET PYQs from 2016 to 2026 are part of the question bank and are marked by year."],
    ],
    related: [{ to: "/free-neet-mock-test", label: "Free NEET mock tests" }, { to: "/neet-chapter-wise-weightage", label: "Chapter-wise weightage" }, { to: "/neet-physics-formula-sheet", label: "Physics formula sheet" }, { to: "/neet-chemistry-formula-sheet", label: "Chemistry formula sheet" }, ...COMMON_RELATED.slice(0, 2)],
    place: "lp_chapter_series",
  },
  {
    path: "/neet-previous-year-questions",
    title: "Free NEET Previous Year Questions with Answers — Chapter-wise & Year-wise | YNeet",
    description: "Free NEET previous year questions (PYQs) with answers and explanations, chapter-wise for Physics, Chemistry and Biology and year-wise as full papers. No login. Then timed PYQ tests on YNeet.",
    eyebrow: "Free · Answers & explanations · No login",
    h1: "Free NEET previous year questions, with answers",
    intro: "NEET repeats ideas from earlier papers. Solve the previous year questions chapter by chapter while you study, and year by year as full papers before the exam.",
    answer: {
      q: "Where can I get free NEET previous year questions?",
      a: "YNeet has free NEET PYQs with answers and explanations, in two ways, with no login:",
      points: [
        "Chapter-wise PYQs for every Physics, Chemistry and Biology chapter, best while you are studying that chapter.",
        "Year-wise NEET question papers with the answer to every question, best for full revision before the exam.",
        "Each question has its own page with the answer, an explanation and more questions from the same chapter.",
        "In the app, take any PYQ paper as a timed test with NEET marking and analysis, free for 30 days.",
      ],
    },
    demoTitle: "Try 3 real NEET PYQs",
    demo: MIXED,
    shots: [SHOT.mockTest, SHOT.analysisPlan, SHOT.mockTestMobile],
    features: [
      { h: "Chapter-wise", p: "All PYQs of a chapter on one page, so you can practise it right after studying it." },
      { h: "Year-wise papers", p: "Full NEET papers year by year, split by subject, with the answer to every question." },
      { h: "Explanations", p: "Why the answer is right, in plain language, so a wrong answer teaches you something." },
      { h: "Timed PYQ tests", p: "In the app, attempt a past paper under exam conditions and get analysis like a mock test." },
    ],
    ctaTitle: "Take NEET PYQ papers as timed tests",
    ctaText: "Every PYQ paper with a timer, NEET marking and analysis. Free for 30 days, no card.",
    faqs: [
      TRIAL_FAQ,
      ["Are NEET previous year questions repeated?", "The exact question is rarely repeated, but the same concepts and NCERT lines come up again and again. That's why PYQs are the best practice for NEET."],
      ["Should I solve PYQs chapter-wise or year-wise?", "Chapter-wise while you are studying each chapter; year-wise as full timed papers in the last 2–3 months."],
      ["Which years' NEET questions are on YNeet?", "NEET PYQs from 2016 to 2026 are in the question bank, and the papers-by-year page lists the full papers available."],
    ],
    related: [{ to: "/neet-practice", label: "Chapter-wise PYQs" }, { to: "/neet-question-papers", label: "NEET papers by year" }, { to: "/neet-pyq-books", label: "NEET PYQ books (PDF)" }, { to: "/neet-daily-quiz", label: "Daily NEET quiz" }, { to: "/neet-chapter-wise-weightage", label: "Chapter-wise weightage" }],
    place: "lp_pyq",
  },
  {
    path: "/neet-online-practice-platform",
    title: "NEET Online Practice Platform — Questions, Mock Tests & Analysis | YNeet",
    description: "YNeet is a NEET online practice platform for Class 11, 12 and droppers: 70,000+ questions, 1,200+ tests, NEET PYQs, daily quizzes, a mistake notebook and analysis, with weekly reports for parents. Free for 30 days.",
    eyebrow: "Class 11, 12 & droppers · Foundation from Class 9",
    h1: "A NEET online practice platform that tells you what to study next",
    intro: "Practice only helps when it's aimed at your weak spots. YNeet puts questions, tests and analysis in one place, and uses your answers to point you at the chapters that will move your score.",
    answer: {
      q: "What is the best online platform to practise for NEET?",
      a: "The best NEET practice platform is one you'll use every day, built on NCERT and NEET PYQs, that shows you what to fix. YNeet gives you:",
      points: [
        "70,000+ practice questions and 1,200+ tests: chapter tests, subject tests, full mocks and PYQ papers.",
        "Daily habits that take minutes: Question of the Day, the 60-Second Sprint, a daily quiz and short concept videos.",
        "A mistake notebook, flashcards and formula sheets for revision.",
        "Analysis after every test, a chapter priority study plan, and a weekly progress report for parents.",
      ],
    },
    demoTitle: "Try a 3-question practice set",
    demo: MIXED,
    shots: [SHOT.dashboard, SHOT.mockTest, SHOT.analysisPlan, SHOT.dashboardMobile],
    features: [
      { h: "Practice by chapter or topic", p: "Pick a subject and chapter, practise at your pace, and see your accuracy build up chapter by chapter." },
      { h: "Tests in the NEET pattern", p: "Timed chapter, subject and full-length tests with +4/−1 marking and an expected rank." },
      { h: "A plan, not just questions", p: "The Chapter Priority plan and the 'what to do next' steps after each test tell you where your next hour should go." },
      { h: "Parents stay informed", p: "A weekly report for parents: days studied, tests taken, scores, accuracy and weak chapters." },
    ],
    ctaTitle: "Start practising for NEET today",
    ctaText: "Every question, test and analysis free for 30 days. No card needed.",
    faqs: [
      TRIAL_FAQ,
      ["Which classes is YNeet for?", "Class 11, 12 and droppers for NEET, NEET Foundation for Class 9–10, and a free version with daily puzzles, quizzes and Shorts for Class 6–8."],
      ["Does YNeet work on mobile?", "Yes. It works in the browser on any phone or laptop, and tests save your answers as you go."],
      ["Can parents see progress?", "Yes. Parents get a weekly report with days studied, tests taken, mock scores, accuracy and weak chapters."],
    ],
    related: [{ to: "/neet-sprint", label: "60-Second Sprint" }, { to: "/neet-question-of-the-day", label: "NEET Question of the Day" }, { to: "/neet-parents", label: "Weekly report for parents" }, ...COMMON_RELATED],
    place: "lp_platform",
  },
  {
    path: "/neet-preparation-analysis",
    title: "How to Analyse Your NEET Preparation — Free Check + Mock Test Analysis | YNeet",
    description: "Analyse your NEET preparation in 3 steps: a free 15-question readiness check, chapter-wise accuracy against NEET weightage, and mock test analysis with time per question and a what-to-do-next plan.",
    eyebrow: "Free check in 5 minutes",
    h1: "How to analyse your NEET preparation",
    intro: "You can't fix what you can't see. Here's how to see where your NEET preparation really stands: by chapter, by subject and by how you use your time in the exam.",
    answer: {
      q: "How can I analyse my NEET preparation?",
      a: "Analyse your preparation by measuring, not by how confident you feel about a chapter. Check three things:",
      points: [
        "Where you stand now: take a short NEET-level test with NEET marking. YNeet's free readiness test (15 questions, no login) gives you a score and your weak chapters.",
        "Chapter-wise accuracy against weightage: a 40% chapter that carries 4 questions matters more than a 40% chapter that carries 1.",
        "How you lose marks in a full mock: wrong answers, quick guesses, and questions that eat your time.",
        "Then turn it into a plan: the two weakest high-weightage chapters first, then take the next mock and compare.",
      ],
    },
    demoTitle: "Start with 3 questions now",
    demo: MIXED,
    shots: [SHOT.analysisPlan, SHOT.analysisChapters, SHOT.dashboard],
    features: [
      { h: "Score and expected rank", p: "Your score out of 720, accuracy and an estimated All India Rank after every full mock." },
      { h: "Chapter-wise breakdown", p: "Every chapter from weakest to strongest, with how many you got right in each." },
      { h: "Time analysis", p: "Average time per question by subject against a good NEET pace, time lost on wrong answers, and your slowest questions." },
      { h: "What to do next", p: "A short, ordered plan after each test: which chapter to fix first, where you're guessing too much, and what's on track." },
    ],
    ctaTitle: "See your full NEET analysis",
    ctaText: "Take a full mock and get the complete analysis. Free for 30 days, no card.",
    faqs: [
      TRIAL_FAQ,
      ["How often should I analyse my NEET preparation?", "After every full mock, and once a month look at your score trend and chapter accuracy together to see whether your weak chapters are improving."],
      ["What should I look at first in a mock test analysis?", "Your two weakest chapters that carry the most questions, and how many marks you lost to wrong quick guesses. Those two usually give the fastest improvement."],
      ["Is the NEET readiness test really free?", "Yes. 15 NEET-level questions with NEET marking, a score out of 100 and your weak chapters, with no login."],
    ],
    related: [{ to: "/neet-readiness", label: "Free readiness test" }, { to: "/neet-most-missed-chapters", label: "Most-missed NEET chapters" }, { to: "/neet-rank-predictor", label: "NEET rank predictor" }, { to: "/neet-percentile-calculator", label: "Percentile calculator" }, { to: "/neet-chapter-wise-weightage", label: "Chapter-wise weightage" }],
    place: "lp_analysis",
  },
];

export const landingByPath = (p: string) => LANDING_PAGES.find((l) => l.path === p.replace(/\/$/, ""));
