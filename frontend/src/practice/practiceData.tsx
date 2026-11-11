// Free chapter practice pages (/neet-practice, /neet-practice/<subject>/<chapter>).
// Same pattern as blog/blogData.tsx: scripts/prerender.mjs fetches the data from
// the YNeet API at build time, renders real HTML for Google, and embeds the
// data as window.__PRACTICE_DATA__ so the browser shows it without a reload.
import { createContext, useContext, type ReactNode } from "react";

export type PracticeQuestion = {
  id: string;
  topic: string;
  question: string;
  options: string[];
  answer: number; // 1-based (optionA = 1)
  explanation: string;
  pyqYear: number | null;
};
export type PracticeChapterSummary = {
  slug: string;
  subject: string;
  chapter: string;
  total: number;
  pyqCount: number;
  pyqYears: [number, number] | null;
  classes: string[];
  topics: string[];
  // NEET weightage (same numbers as the app's Chapter Priority map); null when the chapter has none.
  weightage?: ChapterWeightage | null;
  topTopics?: { topic: string; count: number }[];
};
export type ChapterWeightage = {
  expectedQs: number;
  marks: number;
  classLevel: string;
  yearsAppeared: number;
  yearsUsed: number;
  rank: number;
  ofChapters: number;
  priority: "High" | "Medium" | "Low";
};
export type QuestionLink = { slug: string; question: string; pyqYear: number | null };
export type PracticeChapter = PracticeChapterSummary & { questions: PracticeQuestion[]; questionLinks?: QuestionLink[] };
// One-question page (/neet-question/<slug>).
export type QuestionPageData = PracticeQuestion & {
  slug: string;
  subject: string;
  chapter: string;
  chapterSlug: string;
  related: (QuestionLink & { id: string })[];
  classNum?: number; // set on Class 6–10 pages (/class-<n>-questions/<slug>)
  boardYear?: number | null; // a CBSE Class 12 board PYQ (not a NEET question)
  short?: { videoId: string; thumbnail?: string; title?: string } | null; // its daily quiz Short on YouTube
};
// Class 6–10 hub (/class-<n>-questions): chapters with links to their questions.
export type SchoolChapter = { subject: string; chapter: string; slug: string; count: number };
export type SchoolClassSummary = { classNum: number; total: number };
export type SchoolHubData = {
  classNum: number;
  classes: SchoolClassSummary[];
  chapters: SchoolChapter[];
  links: { slug: string; chapterSlug: string; question: string }[];
};
export const SCHOOL_CLASSES = [6, 7, 8, 9, 10] as const;
// School students call Physics/Chemistry/Biology "Science".
export const schoolSubject = (s: string) => `Science (${s})`;
export const questionPath = (q: { slug: string; classNum?: number }) =>
  q.classNum ? `/class-${q.classNum}-questions/${q.slug}` : `/neet-question/${q.slug}`;
export type PaperQuestion = { id: string; chapter: string; question: string; options: string[]; answer: number; explanation: string };
export type PaperSummary = { year: number; total: number; counts: Record<string, number> };
export type Paper = PaperSummary & { subjects: Record<string, PaperQuestion[]> };
export type PracticeData = {
  chapters?: PracticeChapterSummary[];
  chapter?: PracticeChapter | null;
  papers?: PaperSummary[];
  paper?: Paper | null;
  question?: QuestionPageData | null;
  school?: SchoolHubData | null;
  cutoffs?: CutoffState[];
  quizShorts?: import("../components/QuizShorts").QuizShort[];
  cutoff?: CutoffState | null;
};
// NEET cutoff pages (/neet-cutoff, /neet-cutoff/<state>), from the College Predictor's data.
export type CutoffRange = { colleges: number; toughest: number; last: number };
export type CutoffState = {
  code: string;
  slug: string;
  name: string;
  year: number;
  round: number;
  rankType: "AIR" | "STATE" | "SCORE";
  categories: string[];
  colleges: { college: string; type: string; closing: Record<string, number> }[];
  categorySummary: { category: string; toughest: number; last: number; colleges: number }[];
  privateMbbs: CutoffRange | null;
  govtBds: CutoffRange | null;
};
export const cutoffTitleName = (c: Pick<CutoffState, "code" | "name">) => (c.code === "AIQ" ? "All India Quota (AIQ)" : c.name);
export function cutoffMeta(c: CutoffState) {
  const open = c.categorySummary.find((x) => x.category === "OPEN");
  const unit = c.rankType === "SCORE" ? "marks" : c.rankType === "STATE" ? "state rank" : "AIR";
  const fig = open ? ` General category closed at ${unit} ${open.last.toLocaleString("en-IN")} for the last government seat.` : "";
  return {
    title: `${cutoffTitleName(c)} NEET Cutoff ${c.year} for Government MBBS (Category-wise) | YNeet`,
    description: `${cutoffTitleName(c)} NEET ${c.year} closing ranks for every government MBBS college, category-wise.${fig} Plus private MBBS and BDS ranges. Free college predictor.`,
  };
}

const Ctx = createContext<PracticeData>({});

export function PracticeDataProvider({ value, children }: { value?: PracticeData; children: ReactNode }) {
  return <Ctx.Provider value={value || {}}>{children}</Ctx.Provider>;
}

export function useInitialPracticeData(): PracticeData {
  const ctx = useContext(Ctx);
  if (ctx.chapters || ctx.chapter || ctx.papers || ctx.paper || ctx.question || ctx.school || ctx.cutoffs || ctx.cutoff || ctx.quizShorts) return ctx;
  if (typeof window !== "undefined") return (window as any).__PRACTICE_DATA__ || {};
  return {};
}

export const YNEET_API = (import.meta.env.VITE_YNEET_API_URL || "").replace(/\/$/, "");
export const SUBJECTS = ["Physics", "Chemistry", "Biology"] as const;

export function chapterMeta(c: PracticeChapterSummary) {
  const years = c.pyqYears ? ` (${c.pyqYears[0]}–${c.pyqYears[1]})` : "";
  // Chapter name first and short enough not to be cut off on mobile: people
  // search "<chapter> neet pyqs" / "<chapter> neet questions".
  const long = `${c.chapter} NEET PYQs & Questions with Answers | YNeet`;
  const w = c.weightage ? ` Weightage: about ${c.weightage.expectedQs} questions (${c.weightage.marks} marks) per paper.` : "";
  return {
    title: long.length <= 65 ? long : `${c.chapter} NEET PYQs with Answers | YNeet`,
    description: `Free ${c.chapter} NEET previous year questions${years} with answers and explanations — ${c.subject}, no login needed.${w || ` Then take the timed ${c.chapter} chapter test free for 30 days on YNeet.`}`,
  };
}

export const subjectSlug = (s: string) => s.toLowerCase();
export function paperMeta(p: PaperSummary, subject?: string) {
  if (subject) {
    const n = p.counts[subject] || 0;
    return {
      title: `NEET ${p.year} ${subject} Question Paper with Answers & Solutions | YNeet`,
      description: `NEET ${p.year} ${subject} questions with answers and step-by-step explanations: ${n} questions, chapter-wise. Free, no login. Then take timed NEET ${subject} mocks free for 30 days on YNeet.`,
    };
  }
  return {
    title: `NEET ${p.year} Question Paper with Answers & Explanations | YNeet`,
    description: `NEET ${p.year} previous year questions with answers and explanations: ${p.total} questions across Physics, Chemistry and Biology. Free, no login. Take NEET-style timed mocks free for 30 days on YNeet.`,
  };
}

// Question text without line breaks, cut at a word boundary.
export function shorten(text: string, max: number) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > max * 0.6 ? cut.lastIndexOf(" ") : cut.length).replace(/[,;:.]$/, "")}…`;
}

export function questionMeta(q: QuestionPageData) {
  if (q.classNum) {
    const tail = ` | Class ${q.classNum} Science MCQ`;
    return {
      title: `${shorten(q.question, 68 - tail.length)}${tail}`,
      description: shorten(`Class ${q.classNum} Science MCQ on ${q.chapter}: ${q.question} Answer with explanation. Free, no login needed.`, 158),
    };
  }
  // Question first (that's what people search), then the chapter if it fits in ~68 characters.
  const long = ` | NEET ${q.chapter}`;
  const tail = long.length <= 32 ? long : ` | NEET ${q.subject}`;
  const title = `${shorten(q.question, 68 - tail.length)}${tail}`;
  const year = q.pyqYear ? `NEET ${q.pyqYear} question. ` : "";
  return {
    title,
    description: shorten(`${year}${q.question} Answer with explanation — free NEET ${q.subject} practice on ${q.chapter}, no login needed.`, 158),
  };
}

export function schoolHubMeta(classNum: number, total: number) {
  return {
    title: `Class ${classNum} Science MCQ Questions with Answers | YNeet`,
    description: `${total} free Class ${classNum} Science MCQs with answers and explanations — Physics, Chemistry and Biology, chapter-wise. No login needed.`,
  };
}
