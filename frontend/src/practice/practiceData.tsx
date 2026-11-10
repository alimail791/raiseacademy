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
};
export type PaperQuestion = { id: string; chapter: string; question: string; options: string[]; answer: number; explanation: string };
export type PaperSummary = { year: number; total: number; counts: Record<string, number> };
export type Paper = PaperSummary & { subjects: Record<string, PaperQuestion[]> };
export type PracticeData = {
  chapters?: PracticeChapterSummary[];
  chapter?: PracticeChapter | null;
  papers?: PaperSummary[];
  paper?: Paper | null;
  question?: QuestionPageData | null;
};

const Ctx = createContext<PracticeData>({});

export function PracticeDataProvider({ value, children }: { value?: PracticeData; children: ReactNode }) {
  return <Ctx.Provider value={value || {}}>{children}</Ctx.Provider>;
}

export function useInitialPracticeData(): PracticeData {
  const ctx = useContext(Ctx);
  if (ctx.chapters || ctx.chapter || ctx.papers || ctx.paper || ctx.question) return ctx;
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
  return {
    title: long.length <= 65 ? long : `${c.chapter} NEET PYQs with Answers | YNeet`,
    description: `Free ${c.chapter} NEET previous year questions${years} with answers and explanations — ${c.subject}, no login needed. Then take the timed ${c.chapter} chapter test free for 30 days on YNeet.`,
  };
}

export function paperMeta(p: PaperSummary) {
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
