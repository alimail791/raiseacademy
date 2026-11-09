// NEET score calculator logic: answer keys, scoring, marks → rank estimate.
// Kept separate from the page so the same logic can later score YNeet mocks.

export type Section = { name: string; from: number; to: number }; // 1-based, inclusive
// Per question: acceptable options (1–4), or "*" = dropped/bonus (+4 to everyone, as NTA does).
export type KeyEntry = number[] | "*";
export type AnswerKey = {
  id: string;
  label: string; // shown in the picker, e.g. "NEET 2027 — Code 45 (provisional)"
  status: "provisional" | "final" | "practice";
  sections: Section[];
  answers: KeyEntry[]; // index 0 = question 1
};

// NEET 2025/2026 layout: 180 questions, all compulsory.
export const NEET_SECTIONS: Section[] = [
  { name: "Physics", from: 1, to: 45 },
  { name: "Chemistry", from: 46, to: 90 },
  { name: "Botany", from: 91, to: 135 },
  { name: "Zoology", from: 136, to: 180 },
];
export const TOTAL_QS = 180;

// Answer keys YNeet publishes. Add the official NTA keys (one per booklet code) here
// the day NTA releases them; flip status to "final" when the final key is out.
// Format tip: parseKeyText() turns "1 3, 2 1, 3 4 ..." pasted from the NTA PDF into answers.
export const PUBLISHED_KEYS: AnswerKey[] = [];

// ---------- parsing ----------

// Student's responses typed/pasted in order: 1-4 or A-D per question; 0, -, x, . = skipped.
export function parseResponses(text: string, n = TOTAL_QS): (number | null)[] {
  const out: (number | null)[] = [];
  for (const ch of text.toUpperCase()) {
    if (out.length >= n) break;
    if ("1234".includes(ch)) out.push(Number(ch));
    else if ("ABCD".includes(ch)) out.push("ABCD".indexOf(ch) + 1);
    else if ("0-X.".includes(ch)) out.push(null);
  }
  while (out.length < n) out.push(null);
  return out;
}

// Answer key pasted from the NTA PDF. Accepts "Q.No Answer" pairs in any separator
// ("1 3", "1-3", "1) 3", "1: 3"), multiple answers as "2/4" or "2,4" inside brackets,
// and "drop"/"bonus"/"*" for dropped questions. Falls back to a plain sequence of answers.
export function parseKeyText(text: string, n = TOTAL_QS): { answers: KeyEntry[]; found: number } {
  const answers: (KeyEntry | null)[] = new Array(n).fill(null);
  const t = text.replace(/\r/g, "");
  const pair = /(\d{1,3})\s*[).:\-–]?\s*(\*|drop(?:ped)?|bonus|[1-4A-Da-d](?:\s*[/|&]\s*[1-4A-Da-d])*)\b/gi;
  let m: RegExpExecArray | null;
  let found = 0;
  while ((m = pair.exec(t))) {
    const q = Number(m[1]);
    if (q < 1 || q > n || answers[q - 1] !== null) continue;
    answers[q - 1] = toEntry(m[2]);
    found++;
  }
  if (found < n * 0.5) {
    // Not a numbered list — read it as answers in order.
    const seq = parseResponses(t, n);
    const count = seq.filter((x) => x !== null).length;
    if (count > found) return { answers: seq.map((x) => (x ? [x] : "*")), found: count };
  }
  return { answers: answers.map((a) => a ?? "*"), found };
}
function toEntry(s: string): KeyEntry {
  const v = s.trim().toUpperCase();
  if (v === "*" || v.startsWith("DROP") || v === "BONUS") return "*";
  return v.split(/[/|&\s]+/).filter(Boolean).map((c) => ("ABCD".includes(c) ? "ABCD".indexOf(c) + 1 : Number(c)));
}

// ---------- scoring ----------

export type SectionResult = { name: string; correct: number; wrong: number; skipped: number; bonus: number; marks: number; total: number };
export type ScoreResult = { score: number; max: number; correct: number; wrong: number; skipped: number; sections: SectionResult[] };

export function scoreResponses(key: AnswerKey, resp: (number | null)[]): ScoreResult {
  const sections = key.sections.map((s) => {
    const r: SectionResult = { name: s.name, correct: 0, wrong: 0, skipped: 0, bonus: 0, marks: 0, total: s.to - s.from + 1 };
    for (let q = s.from; q <= s.to; q++) {
      const k = key.answers[q - 1];
      const a = resp[q - 1];
      if (k === "*") { r.bonus++; r.marks += 4; continue; } // dropped: +4 to all
      if (a == null) { r.skipped++; continue; }
      if (k && k.includes(a)) { r.correct++; r.marks += 4; } else { r.wrong++; r.marks -= 1; }
    }
    return r;
  });
  return summarise(sections);
}

// Quick mode: just counts per section.
export function scoreCounts(rows: { name: string; correct: number; wrong: number; total: number }[]): ScoreResult {
  return summarise(rows.map((r) => ({ ...r, skipped: Math.max(0, r.total - r.correct - r.wrong), bonus: 0, marks: r.correct * 4 - r.wrong })));
}

function summarise(sections: SectionResult[]): ScoreResult {
  const sum = (k: keyof SectionResult) => sections.reduce((a, s) => a + (s[k] as number), 0);
  return { score: sum("marks"), max: sum("total") * 4, correct: sum("correct") + sum("bonus"), wrong: sum("wrong"), skipped: sum("skipped"), sections };
}

// ---------- marks → All India Rank ----------
// Re-NEET 2026 (normal paper): official counts of candidates at or above a score
// (700+: 19, 690+: 138, 650+: 1,492, 600+: 10,160, 500+: 90,780); below 500 the
// points are approximate. NEET 2025 (tough paper, topper 686) from NTA's marks-vs-rank data.
const CURVE_2026: [number, number][] = [[715, 1], [700, 19], [690, 138], [650, 1492], [600, 10160], [500, 90780], [450, 150000], [400, 230000], [350, 330000], [300, 440000], [200, 800000], [140, 1150000]];
const CURVE_2025: [number, number][] = [[686, 1], [650, 77], [600, 1386], [582, 3200], [563, 7497], [543, 15000], [526, 26500], [430, 150000], [410, 190000], [300, 420000], [200, 780000], [140, 1150000]];

function rankOn(curve: [number, number][], marks: number) {
  if (marks >= curve[0][0]) return 1;
  for (let i = 0; i < curve.length - 1; i++) {
    const [m1, r1] = curve[i], [m2, r2] = curve[i + 1];
    if (marks <= m1 && marks >= m2) {
      const f = (m1 - marks) / (m1 - m2);
      return Math.max(1, Math.round(Math.exp(Math.log(r1) + f * (Math.log(r2) - Math.log(r1))))); // log-linear
    }
  }
  return null; // below the qualifying range
}

export function estimateRank(marks: number) {
  return { normal: rankOn(CURVE_2026, marks), tough: rankOn(CURVE_2025, marks) };
}

// NEET 2025 General qualifying cut-off (50th percentile) was 144 marks; reserved categories ~113.
export const QUALIFY_GENERAL = 144;
export const QUALIFY_RESERVED = 113;

export const fmtRank = (n: number | null) => (n == null ? "—" : n.toLocaleString("en-IN"));
