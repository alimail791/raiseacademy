// "Read the guide" links from busy free pages to the blog articles about the
// same thing. A link shows only once its post is published: the build
// (scripts/prerender.mjs) writes the published slugs into each page as
// window.__YN_BLOG_SLUGS__ (and sets globalThis.__YN_BLOG_SLUGS__ while
// rendering), so the server HTML and the browser agree.
import { Link } from "react-router-dom";

const TITLES: Record<string, string> = {
  "best-chapter-wise-neet-practice-tests": "Best Chapter-wise NEET Practice Tests: How to Use Them",
  "best-free-neet-mock-test-websites-india": "Best Free NEET Mock Test Websites in India (2027): What to Look For",
  "best-neet-preparation-websites": "Best NEET Preparation Websites: A Checklist for 2027",
  "free-neet-biology-mcq-practice": "Free NEET Biology MCQ Practice: Chapter-wise with Answers",
  "how-many-mock-tests-before-neet-2027": "How Many Mock Tests Before NEET 2027? A Month-by-Month Plan",
  "how-to-analyse-neet-mock-test-performance": "How to Analyse Your NEET Mock Test Performance",
  "how-to-identify-weak-chapters-in-neet": "How to Identify Weak Chapters in NEET (and Fix Them)",
  "how-to-improve-neet-mock-test-scores": "How to Improve Your NEET Mock Test Scores: 9 Proven Steps",
  "how-to-prepare-for-neet-2027": "How to Prepare for NEET 2027: A Month-by-Month Plan",
  "how-to-read-ncert-biology-for-neet": "How to Read NCERT Biology for NEET: A Line-by-Line Method",
  "neet-2027-six-month-study-plan": "NEET 2027: A 6-Month Study Plan From November to May",
  "neet-biology-chapter-wise-tests": "NEET Biology Chapter-wise Tests: Botany and Zoology Plan",
  "neet-chemistry-important-questions": "NEET Chemistry Important Questions: Chapter-wise Guide",
  "neet-college-predictor-guide": "NEET College Predictor Guide: AIQ and State Quota",
  "neet-negative-marking-when-to-guess": "NEET Negative Marking: When Should You Guess?",
  "neet-physics-numerical-practice": "NEET Physics Numerical Practice: Formulas, Speed and PYQs",
  "neet-previous-year-question-papers-with-answers": "NEET Previous Year Question Papers with Answers (2016–2026)",
  "neet-pyq-chapter-wise": "NEET PYQ Chapter-wise: How to Use Previous Year Questions",
  "neet-rank-predictor-guide": "NEET Rank Predictor Guide: Marks vs Rank Explained"
};

export const GUIDES: Record<string, string[]> = {
  "/free-neet-mock-test": [
    "best-free-neet-mock-test-websites-india",
    "how-many-mock-tests-before-neet-2027",
    "how-to-improve-neet-mock-test-scores"
  ],
  "/neet-readiness": [
    "how-to-prepare-for-neet-2027",
    "how-to-identify-weak-chapters-in-neet"
  ],
  "/neet-chapter-wise-test-series": [
    "best-chapter-wise-neet-practice-tests",
    "neet-biology-chapter-wise-tests"
  ],
  "/neet-biology-practice-questions": [
    "free-neet-biology-mcq-practice",
    "neet-biology-chapter-wise-tests",
    "how-to-read-ncert-biology-for-neet"
  ],
  "/neet-previous-year-questions": [
    "neet-previous-year-question-papers-with-answers",
    "neet-pyq-chapter-wise"
  ],
  "/neet-question-papers": [
    "neet-previous-year-question-papers-with-answers",
    "neet-pyq-chapter-wise"
  ],
  "/neet-online-practice-platform": [
    "best-neet-preparation-websites",
    "best-free-neet-mock-test-websites-india"
  ],
  "/neet-preparation-analysis": [
    "how-to-analyse-neet-mock-test-performance",
    "how-to-identify-weak-chapters-in-neet",
    "how-to-improve-neet-mock-test-scores"
  ],
  "/neet-practice": [
    "free-neet-biology-mcq-practice",
    "neet-physics-numerical-practice",
    "neet-chemistry-important-questions",
    "best-chapter-wise-neet-practice-tests"
  ],
  "/neet-chapter-wise-weightage": [
    "how-to-prepare-for-neet-2027",
    "how-to-identify-weak-chapters-in-neet"
  ],
  "/neet-most-missed-chapters": [
    "how-to-identify-weak-chapters-in-neet",
    "neet-chemistry-important-questions"
  ],
  "/neet-rank-predictor": [
    "neet-rank-predictor-guide",
    "neet-college-predictor-guide"
  ],
  "/neet-college-predictor": [
    "neet-college-predictor-guide",
    "neet-rank-predictor-guide"
  ],
  "/neet-compare-colleges": [
    "neet-college-predictor-guide"
  ],
  "/neet-score-calculator": [
    "neet-rank-predictor-guide",
    "neet-negative-marking-when-to-guess"
  ],
  "/neet-physics-formula-sheet": [
    "neet-physics-numerical-practice"
  ],
  "/neet-chemistry-formula-sheet": [
    "neet-chemistry-important-questions"
  ],
  "/neet-tools": [
    "how-to-prepare-for-neet-2027",
    "best-neet-preparation-websites"
  ],
  "/neet-2027-exam-date": [
    "how-to-prepare-for-neet-2027",
    "neet-2027-six-month-study-plan"
  ],
  "/neet-sprint": [
    "how-to-improve-neet-mock-test-scores"
  ]
};

function publishedSlugs(): string[] | null {
  const g: any = typeof window !== "undefined" ? window : globalThis;
  return Array.isArray(g.__YN_BLOG_SLUGS__) ? g.__YN_BLOG_SLUGS__ : null;
}

export default function BlogGuides({ path }: { path: string }) {
  const want = GUIDES[path.replace(/\/+$/, "") || "/"];
  const live = publishedSlugs();
  if (!want || !live) return null;
  const list = want.filter((s) => live.includes(s));
  if (!list.length) return null;
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
      <div className="rounded-2xl border border-ink/10 dark:border-paper/15 p-5 sm:p-6">
        <h2 className="font-display text-xl font-bold">Read the guide</h2>
        <ul className="mt-3 space-y-2">
          {list.map((s) => (
            <li key={s}><Link to={`/blog/${s}`} className="text-rise-dark dark:text-gold font-semibold hover:underline">{TITLES[s]}</Link></li>
          ))}
        </ul>
      </div>
    </section>
  );
}
