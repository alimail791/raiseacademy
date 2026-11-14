// One NEET question per page (/neet-question/<question-words>-<id>), for
// people who search the text of a question. Built as real HTML at deploy time
// by scripts/prerender.mjs; pages added after a deploy load from the YNeet API.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowRight, Check } from "lucide-react";
import { SITE_ORIGIN } from "../seo";
import { useInitialPracticeData, YNEET_API, questionMeta, questionPath, schoolSubject, shorten, type QuestionPageData } from "../practice/practiceData";
import NotFound from "./NotFound";
import { ShortPlayer } from "../components/QuizShorts";

const LETTERS = ["A", "B", "C", "D"];

function setMeta(q: QuestionPageData) {
  const m = questionMeta(q);
  const url = `${SITE_ORIGIN}${questionPath(q)}`;
  document.title = m.title;
  const set = (sel: string, attr: string, val: string, make: () => HTMLElement) => {
    let el = document.head.querySelector(sel) as HTMLElement | null;
    if (!el) { el = make(); document.head.appendChild(el); }
    el.setAttribute(attr, val);
  };
  const meta = (k: string, prop = false) => () => { const e = document.createElement("meta"); e.setAttribute(prop ? "property" : "name", k); return e; };
  set('meta[name="description"]', "content", m.description, meta("description"));
  set('meta[name="robots"]', "content", "index, follow", meta("robots"));
  set('meta[property="og:title"]', "content", m.title, meta("og:title", true));
  set('meta[property="og:description"]', "content", m.description, meta("og:description", true));
  set('meta[property="og:url"]', "content", url, meta("og:url", true));
  set('link[rel="canonical"]', "href", url, () => { const l = document.createElement("link"); l.setAttribute("rel", "canonical"); return l; });
}

// classNum set → a Class 6–10 page (/class-<n>-questions/<slug>); otherwise NEET.
const QuestionPage = ({ classNum }: { classNum?: number }) => {
  const { slug = "" } = useParams();
  const initial = useInitialPracticeData();
  const pre = initial.question && initial.question.slug === slug ? initial.question : undefined;
  const [q, setQ] = useState<QuestionPageData | null | undefined>(pre);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    setShown(false);
    if (pre) { setQ(pre); return; }
    if (!YNEET_API) { setQ(null); return; }
    let alive = true;
    setQ(undefined);
    axios.get(`${YNEET_API}/public/${classNum ? "school-questions" : "questions"}/${encodeURIComponent(slug)}`)
      .then((r) => alive && setQ(r.data.question))
      .catch(() => alive && setQ(null));
    return () => { alive = false; };
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (q) setMeta(q); }, [q]);

  if (q === null) return <NotFound />;
  if (q === undefined) return <div className="max-w-3xl mx-auto px-4 py-20 text-ink/70">Loading question…</div>;

  const school = q.classNum;
  const hub = school ? `/class-${q.classNum}-questions` : "";
  const chapterLink = school ? `${hub}#${q.chapterSlug}` : `/neet-practice/${q.chapterSlug}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <nav className="text-sm text-ink/70 dark:text-paper/70">
        {school
          ? <Link to={hub} className="hover:underline">Class {q.classNum} Science MCQs</Link>
          : <Link to="/neet-practice" className="hover:underline">NEET Practice</Link>}
        {" › "}<span>{q.subject}</span> ›{" "}
        <Link to={chapterLink} className="hover:underline">{q.chapter}</Link>
      </nav>

      <h1 className="font-display text-2xl sm:text-3xl font-bold leading-snug mt-3 whitespace-pre-line">{q.question}</h1>
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold mt-3">
        {q.pyqYear && <span className="px-2 py-0.5 rounded-full bg-gold/20 text-ink dark:text-paper">NEET {q.pyqYear}</span>}
        {!q.pyqYear && q.boardYear && <span className="px-2 py-0.5 rounded-full bg-ink/5 dark:bg-paper/10">CBSE {q.boardYear} Board</span>}
        {school && <span className="px-2 py-0.5 rounded-full bg-gold/20 text-ink dark:text-paper">Class {q.classNum}</span>}
        <span className="px-2 py-0.5 rounded-full bg-ink/5 dark:bg-paper/10">{school ? schoolSubject(q.subject) : q.subject}</span>
        <span className="text-ink/70 dark:text-paper/70">{q.chapter}{q.topic ? ` · ${q.topic}` : ""}</span>
      </div>

      <ul className="mt-6 space-y-2">
        {q.options.map((o, k) => {
          const right = shown && q.answer === k + 1;
          return (
            <li key={k} className={`flex gap-2 px-4 py-3 rounded-xl border ${right ? "border-rise bg-rise/10" : "border-ink/10 dark:border-paper/15"}`}>
              <b>{LETTERS[k]}.</b> <span className="whitespace-pre-line">{o}</span>
              {right && <Check size={18} className="ml-auto text-rise-dark shrink-0" />}
            </li>
          );
        })}
      </ul>

      {/* The answer is in the HTML (inside <details>) so Google reads it; students see it on tap. */}
      <details className="mt-5 p-5 rounded-2xl bg-rise/5 border border-rise/20" onToggle={(e) => setShown((e.target as HTMLDetailsElement).open)}>
        <summary className="cursor-pointer font-semibold text-rise-dark">Show answer & explanation</summary>
        <h2 className="mt-3 font-bold">Answer: ({LETTERS[q.answer - 1]}) {q.options[q.answer - 1]}</h2>
        <h3 className="mt-3 text-sm font-semibold text-ink/70 dark:text-paper/70">Explanation</h3>
        <p className="mt-1 text-ink/80 dark:text-paper/80 whitespace-pre-line">{q.explanation}</p>
      </details>

      <div className="my-8 rounded-2xl bg-ink text-paper p-6">
        {school && school <= 8 ? (
          <>
            <p className="font-display font-bold text-xl">Free Class {school} tests, puzzles and quizzes</p>
            <p className="text-sm text-paper/75 mt-2">YNeet is free for Class 6–8: chapter tests on your school syllabus, daily puzzles and a weekly Brain Teaser.</p>
          </>
        ) : school ? (
          <>
            <p className="font-display font-bold text-xl">Class {school} Science tests + NEET Foundation</p>
            <p className="text-sm text-paper/75 mt-2">Chapter tests on your Class {school} syllabus, your score and weak topics, and an early start on NEET.</p>
          </>
        ) : (
          <>
            <p className="font-display font-bold text-xl">Practise every {q.chapter} question with a timer</p>
            <p className="text-sm text-paper/75 mt-2">Chapter tests, full NEET mocks, your score and weak topics — 70,000+ questions on YNeet.</p>
          </>
        )}
        <Link to="/register" className="mt-4 inline-flex items-center gap-2 bg-gold text-ink font-semibold px-6 py-3 rounded-full hover:bg-gold-dark">
          {school && school <= 8 ? "Start free" : "Start free for 30 days"} <ArrowRight size={16} />
        </Link>
        <p className="text-xs mt-2 text-paper/60">No payment, no card. Register in 2 minutes.</p>
        {!school && <p className="web-only text-sm mt-3 text-paper/75">For Class 11, 12 and droppers, see what the <Link to="/courses" className="text-gold font-semibold underline">YNeet NEET online course</Link> includes.</p>}
      </div>

      {q.short && (
        <section className="mb-8">
          <h2 className="font-display text-xl font-bold">Watch it as a 25-second quiz</h2>
          <div className="mt-3 max-w-[280px]"><ShortPlayer s={{ videoId: q.short.videoId, thumbnail: q.short.thumbnail, title: q.short.title || "", subject: q.subject, chapter: q.chapter, questionSlug: q.slug, date: "" }} /></div>
          <Link to="/neet-quiz-shorts" className="inline-block mt-2 text-sm font-semibold text-rise-dark underline">More daily NEET quiz Shorts →</Link>
        </section>
      )}

      {q.related.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold">More {q.chapter} questions</h2>
          <ul className="mt-3 space-y-2">
            {q.related.map((r) => (
              <li key={r.slug}>
                <Link to={questionPath({ slug: r.slug, classNum: q.classNum })} className="text-rise-dark hover:underline">
                  {shorten(r.question, 110)}{r.pyqYear ? ` (NEET ${r.pyqYear})` : ""}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Link to={school ? hub : chapterLink} className="inline-block mt-6 text-sm font-semibold underline">
        {school ? `All Class ${q.classNum} Science questions →` : `All free ${q.chapter} PYQs →`}
      </Link>
    </div>
  );
};

export default QuestionPage;
