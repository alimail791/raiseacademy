import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, ArrowRight, Check, Share2, X } from "lucide-react";
import api from "../api/axios";
import { SITE_ORIGIN } from "../seo";
import { ShortPlayer, type QuizShort } from "../components/QuizShorts";
import { useInitialPracticeData, YNEET_API, shorten, type QuestionPageData } from "../practice/practiceData";
import { QuickSignup, track } from "../components/SignupNudge";
import NotFound from "./NotFound";

// NEET Daily Quiz: the three daily quiz Shorts (Physics, Chemistry, Biology) as
// one page per day, each with the full question, answer, explanation and more
// questions from the same chapter.
//   /neet-daily-quiz          today's (latest) quiz
//   /neet-daily-quiz/<date>   one day's quiz (YYYY-MM-DD), the archive
// Built at deploy time from the Shorts list (scripts/prerender.mjs); days after
// the last deploy load in the browser.

export type DailyQuizItem = { short: QuizShort; question: QuestionPageData | null };
export type DailyQuizData = { date: string; items: DailyQuizItem[]; dates: string[] };

const LETTERS = ["A", "B", "C", "D"];
const ORDER = ["Physics", "Chemistry", "Biology"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const niceDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

export function dailyQuizMeta(d: Pick<DailyQuizData, "date" | "items">, latest: boolean) {
  const chapters = d.items.map((i) => i.short.chapter).filter(Boolean).join(", ");
  return {
    title: latest ? "NEET Daily Quiz — Today's Physics, Chemistry & Biology Questions with Answers | YNeet"
      : `NEET Daily Quiz ${niceDate(d.date)} — Physics, Chemistry & Biology with Answers | YNeet`,
    description: shorten(`Three NEET questions for ${niceDate(d.date)}, one each from Physics, Chemistry and Biology${chapters ? ` (${chapters})` : ""}, with answers, explanations, the quiz video and more practice questions. Free, no login.`, 158),
  };
}

function setMeta(title: string, description: string, path: string) {
  document.title = title;
  const set = (sel: string, attr: string, val: string, make: () => HTMLElement) => {
    let el = document.head.querySelector(sel) as HTMLElement | null;
    if (!el) { el = make(); document.head.appendChild(el); }
    el.setAttribute(attr, val);
  };
  const meta = (k: string) => () => { const e = document.createElement("meta"); e.setAttribute("name", k); return e; };
  set('meta[name="description"]', "content", description, meta("description"));
  set('meta[name="robots"]', "content", "index, follow", meta("robots"));
  set('link[rel="canonical"]', "href", `${SITE_ORIGIN}${path}`, () => { const l = document.createElement("link"); l.setAttribute("rel", "canonical"); return l; });
}

// Groups the Shorts list into days, newest first, Physics → Chemistry → Biology.
export function groupByDate(shorts: QuizShort[]) {
  const days = new Map<string, QuizShort[]>();
  for (const s of shorts) {
    if (!s.date || !DATE_RE.test(s.date)) continue;
    if (!days.has(s.date)) days.set(s.date, []);
    days.get(s.date)!.push(s);
  }
  for (const list of days.values()) list.sort((a, b) => ORDER.indexOf(a.subject) - ORDER.indexOf(b.subject));
  return new Map([...days.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)));
}

function QuizQuestion({ item, n }: { item: DailyQuizItem; n: number }) {
  const { short: s, question: q } = item;
  const [picked, setPicked] = useState<number | null>(null);
  const shown = picked !== null;
  return (
    <section className="rounded-3xl border border-ink/10 dark:border-paper/15 overflow-hidden">
      <div className="bg-ink text-paper px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gold">Question {n} · {s.subject}{s.chapter ? ` · ${s.chapter}` : ""}{q?.pyqYear ? ` · NEET ${q.pyqYear}` : ""}</p>
        {q && <h2 className="mt-2 font-display text-lg sm:text-xl font-bold leading-snug whitespace-pre-line">{q.question}</h2>}
      </div>
      <div className="p-5 grid sm:grid-cols-[1fr_200px] gap-5">
        <div>
          {q ? (
            <>
              <div className="space-y-2">
                {q.options.map((o, k) => {
                  const right = shown && q.answer === k + 1;
                  const wrong = shown && picked === k + 1 && !right;
                  return (
                    <button key={k} type="button" disabled={shown}
                      onClick={() => { setPicked(k + 1); track("daily_quiz_answer", { subject: s.subject, correct: q.answer === k + 1 }); }}
                      className={`w-full text-left flex gap-3 px-4 py-3 rounded-xl border min-h-[48px] ${right ? "border-rise bg-rise/10 font-semibold" : wrong ? "border-red-400 bg-red-50 dark:bg-red-900/20" : "border-ink/15 dark:border-paper/15 hover:border-gold"}`}>
                      <b>{LETTERS[k]}.</b> <span className="whitespace-pre-line">{o}</span>
                      {right && <Check size={18} className="ml-auto text-rise-dark shrink-0" />}
                      {wrong && <X size={18} className="ml-auto text-red-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {/* Answer is in the HTML (for search engines), revealed on tap or in the details box. */}
              <details open={shown} className="mt-4 rounded-xl bg-ink/[0.03] dark:bg-paper/5 p-4 text-sm">
                <summary className="cursor-pointer font-semibold">Show answer and explanation</summary>
                {shown && <p className={`mt-2 font-bold ${picked === q.answer ? "text-rise-dark" : "text-red-600"}`}>{picked === q.answer ? "Correct!" : "Not quite."}</p>}
                <p className="mt-2 font-semibold">Answer: {LETTERS[q.answer - 1]}. {q.options[q.answer - 1]}</p>
                {q.explanation && <p className="mt-1 text-ink/75 dark:text-paper/75 whitespace-pre-line">{q.explanation}</p>}
              </details>
              <div className="mt-4 text-sm space-y-1.5">
                <p><Link to={`/neet-practice/${q.chapterSlug}`} className="font-semibold text-rise-dark underline">Practise more {q.chapter} PYQs →</Link></p>
                {q.related?.slice(0, 3).map((r) => (
                  <p key={r.slug}><Link to={`/neet-question/${r.slug}`} className="text-ink/75 dark:text-paper/75 hover:underline">{shorten(r.question, 90)}</Link></p>
                ))}
              </div>
            </>
          ) : (
            s.questionSlug
              ? <Link to={`/neet-question/${s.questionSlug}`} className="font-semibold text-rise-dark underline">See the question, answer and explanation →</Link>
              : <p className="text-ink/70">Watch the video for this question.</p>
          )}
        </div>
        <div className="max-w-[200px] w-full mx-auto">
          <ShortPlayer s={s} />
          <p className="text-xs text-center text-ink/60 dark:text-paper/60 mt-2">The 5-second quiz video</p>
        </div>
      </div>
    </section>
  );
}

const NeetDailyQuiz = () => {
  const { date: param } = useParams();
  const initial = useInitialPracticeData() as { dailyQuiz?: DailyQuizData };
  const pre = initial.dailyQuiz && (!param || initial.dailyQuiz.date === param) ? initial.dailyQuiz : undefined;
  const [d, setD] = useState<DailyQuizData | null | undefined>(pre);

  useEffect(() => {
    if (pre) { setD(pre); return; }
    if (param && !DATE_RE.test(param)) { setD(null); return; }
    let alive = true;
    setD(undefined);
    (async () => {
      try {
        const r = await api.get("/youtube-shorts", { params: { limit: 200 } });
        const days = groupByDate(r.data.shorts || []);
        const date = param || [...days.keys()][0];
        const shorts = date ? days.get(date) : undefined;
        if (!date || !shorts) { if (alive) setD(null); return; }
        const items = await Promise.all(shorts.map(async (s) => {
          if (!s.questionSlug || !YNEET_API) return { short: s, question: null };
          try {
            const q = await axios.get(`${YNEET_API}/public/questions/${encodeURIComponent(s.questionSlug)}`);
            return { short: s, question: q.data.question as QuestionPageData };
          } catch { return { short: s, question: null }; }
        }));
        if (alive) setD({ date, items, dates: [...days.keys()] });
      } catch { if (alive) setD(null); }
    })();
    return () => { alive = false; };
  }, [param]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!d) return;
    const m = dailyQuizMeta(d, !param);
    setMeta(m.title, m.description, param ? `/neet-daily-quiz/${d.date}` : "/neet-daily-quiz");
  }, [d, param]);

  if (d === null) return <NotFound />;
  if (d === undefined) return <div className="max-w-3xl mx-auto px-4 py-20 text-ink/70">Loading the quiz…</div>;

  const i = d.dates.indexOf(d.date);
  const newer = i > 0 ? d.dates[i - 1] : null;
  const older = i >= 0 && i < d.dates.length - 1 ? d.dates[i + 1] : null;
  const pageUrl = `${SITE_ORIGIN}/neet-daily-quiz/${d.date}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <p className="text-gold-deep dark:text-gold font-semibold uppercase tracking-widest text-sm">Free · 3 questions a day</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2 leading-tight">NEET Daily Quiz — {niceDate(d.date)}</h1>
      <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg">One Physics, one Chemistry and one Biology question, mostly from previous NEET papers. Answer each, check the explanation, then practise more from the same chapter. New questions every day at 8 am, 1 pm and 7 pm.</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <a href={`https://wa.me/?text=${encodeURIComponent(`Can you solve today's 3 NEET questions? ${pageUrl}`)}`} target="_blank" rel="noopener noreferrer"
          onClick={() => track("daily_quiz_share")} className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold px-5 py-3 rounded-full">
          <Share2 size={18} /> Challenge a friend
        </a>
        <Link to="/neet-question-of-the-day" className="inline-flex items-center gap-2 border border-ink/20 dark:border-paper/25 font-semibold px-5 py-3 rounded-full">Question of the Day</Link>
      </div>

      <div className="mt-8 space-y-6">
        {d.items.map((it, k) => <QuizQuestion key={it.short.videoId} item={it} n={k + 1} />)}
      </div>

      <nav className="mt-8 flex justify-between gap-3 text-sm font-semibold" aria-label="Other days">
        {older ? <Link to={`/neet-daily-quiz/${older}`} className="inline-flex items-center gap-1 text-rise-dark hover:underline"><ArrowLeft size={16} /> {niceDate(older)}</Link> : <span />}
        {newer ? <Link to={`/neet-daily-quiz/${newer}`} className="inline-flex items-center gap-1 text-rise-dark hover:underline">{niceDate(newer)} <ArrowRight size={16} /></Link> : <span />}
      </nav>

      <div className="web-only mt-10 rounded-2xl bg-gold/15 border border-gold/40 p-6">
        <p className="font-display text-xl font-bold">Got all three? Try a full chapter test</p>
        <p className="text-sm text-ink/70 dark:text-paper/70 mt-1">Timed chapter tests, full NEET mocks with rank and a mistake notebook. Free for 30 days, no card.</p>
        <QuickSignup place="daily_quiz" />
      </div>

      {d.dates.length > 1 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold">Earlier daily quizzes</h2>
          <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            {d.dates.filter((x) => x !== d.date).slice(0, 30).map((x) => (
              <li key={x}><Link to={`/neet-daily-quiz/${x}`} className="text-rise-dark hover:underline">{niceDate(x)}</Link></li>
            ))}
          </ul>
          <p className="mt-4 text-sm"><Link to="/neet-quiz-shorts" className="font-semibold text-rise-dark underline">All quiz videos →</Link></p>
        </section>
      )}
    </div>
  );
};

export default NeetDailyQuiz;
