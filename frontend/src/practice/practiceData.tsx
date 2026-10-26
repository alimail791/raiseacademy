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
export type PracticeChapter = PracticeChapterSummary & { questions: PracticeQuestion[] };
export type PracticeData = { chapters?: PracticeChapterSummary[]; chapter?: PracticeChapter | null };

const Ctx = createContext<PracticeData>({});

export function PracticeDataProvider({ value, children }: { value?: PracticeData; children: ReactNode }) {
  return <Ctx.Provider value={value || {}}>{children}</Ctx.Provider>;
}

export function useInitialPracticeData(): PracticeData {
  const ctx = useContext(Ctx);
  if (ctx.chapters || ctx.chapter) return ctx;
  if (typeof window !== "undefined") return (window as any).__PRACTICE_DATA__ || {};
  return {};
}

export const YNEET_API = (import.meta.env.VITE_YNEET_API_URL || "").replace(/\/$/, "");
export const SUBJECTS = ["Physics", "Chemistry", "Biology"] as const;

export function chapterMeta(c: PracticeChapterSummary) {
  const years = c.pyqYears ? ` (${c.pyqYears[0]}–${c.pyqYears[1]})` : "";
  return {
    title: `NEET ${c.chapter} PYQs & Practice Questions with Answers | ${c.subject} | YNeet`,
    description: `Free NEET ${c.subject} practice: ${c.chapter} previous year questions${years} with answers and explanations. No login needed. Take the full timed chapter test free for 30 days on YNeet.`,
  };
}
