import { useEffect, useState, Fragment } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowRight, Check, Timer, Target, TrendingUp } from "lucide-react";
import { SITE_ORIGIN } from "../seo";
import { useInitialPracticeData, YNEET_API, chapterMeta, type PracticeChapter as Chapter, type PracticeChapterSummary } from "../practice/practiceData";
import NotFound from "./NotFound";
import { NCERT_NOTES } from "../ncert/notes";

const LETTERS = ["A", "B", "C", "D"];

function setMeta(c: Chapter) {
  const m = chapterMeta(c);
  const url = `${SITE_ORIGIN}/neet-practice/${c.slug}`;
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

function Cta({ chapter, total, big }: { chapter: string; total: number; big?: boolean }) {
  return (
    <div className={`my-8 rounded-2xl ${big ? "bg-ink text-paper p-7" : "bg-gold/15 border border-gold/40 p-5"}`}>
      <p className={`font-display font-bold ${big ? "text-2xl" : "text-lg"}`}>Practise all {total} {chapter} questions with a timer</p>
      <ul className={`mt-3 grid sm:grid-cols-3 gap-2 text-sm ${big ? "text-paper/80" : "text-ink/75 dark:text-paper/75"}`}>
        <li className="flex items-center gap-2"><Timer size={16} className="text-gold-dark" /> Timed chapter test</li>
        <li className="flex items-center gap-2"><Target size={16} className="text-gold-dark" /> Score + weak topics</li>
        <li className="flex items-center gap-2"><TrendingUp size={16} className="text-gold-dark" /> Full NEET mocks & rank</li>
      </ul>
      <Link to="/register" className="mt-4 inline-flex items-center gap-2 bg-gold text-ink font-semibold px-6 py-3 rounded-full hover:bg-gold-dark">
        Start free for 30 days <ArrowRight size={16} />
      </Link>
      <p className={`text-xs mt-2 ${big ? "text-paper/60" : "text-ink/55 dark:text-paper/55"}`}>No payment, no card. Register in 2 minutes.</p>
    </div>
  );
}

const PracticeChapter = () => {
  const { subject = "", chapter = "" } = useParams();
  const slug = `${subject}/${chapter}`.toLowerCase();
  const initial = useInitialPracticeData();
  const pre = initial.chapter && initial.chapter.slug === slug ? initial.chapter : undefined;
  const [c, setC] = useState<Chapter | null | undefined>(pre);
  const [related, setRelated] = useState<PracticeChapterSummary[]>(initial.chapters || []);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!YNEET_API) { if (!pre) setC(null); return; }
    let alive = true;
    if (!pre) axios.get(`${YNEET_API}/public/practice/${slug}`).then((r) => alive && setC(r.data.chapter)).catch((e) => alive && setC(e?.response?.status === 404 ? null : (x) => x ?? null));
    if (!initial.chapters) axios.get(`${YNEET_API}/public/practice`).then((r) => alive && setRelated(r.data.chapters || [])).catch(() => {});
    return () => { alive = false; };
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (c) setMeta(c); }, [c]);

  if (c === null) return <NotFound />;
  if (c === undefined) return <div className="max-w-3xl mx-auto px-4 py-20 text-ink/50">Loading questions…</div>;

  const more = related.filter((r) => r.subject === c.subject && r.slug !== c.slug).slice(0, 12);
  const yrs = c.pyqYears ? `${c.pyqYears[0]}–${c.pyqYears[1]}` : "";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <nav className="text-sm text-ink/55 dark:text-paper/55">
        <Link to="/neet-practice" className="hover:underline">NEET Practice</Link> › <span>{c.subject}</span> › <span>{c.chapter}</span>
      </nav>
      <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight mt-3">NEET {c.chapter} PYQs & Practice Questions</h1>
      <p className="text-ink/70 dark:text-paper/70 mt-3">
        {c.questions.length} free NEET {c.subject} questions on <b>{c.chapter}</b>{c.pyqCount > 0 ? <>, starting with previous year questions{yrs ? ` (${yrs})` : ""}</> : null}. Tap “Show answer” to check each one. No login needed.
      </p>
      {(() => {
        const note = NCERT_NOTES.find((n) => n.subject === c.subject && n.chapter.toLowerCase() === c.chapter.toLowerCase());
        return note ? <p className="text-sm mt-2"><Link to={`/ncert-notes/${note.slug}`} className="font-semibold text-rise-dark underline">Read the short NCERT notes for this chapter first</Link></p> : null;
      })()}
      {c.topics.length > 0 && (
        <p className="text-sm text-ink/60 dark:text-paper/60 mt-2">Topics: {c.topics.join(" · ")}</p>
      )}

      <ol className="mt-8 space-y-6">
        {c.questions.map((q, i) => (
          <Fragment key={q.id}>
            <li className="p-5 rounded-2xl border border-ink/10 dark:border-paper/15">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="text-ink/50 dark:text-paper/50">Q{i + 1}</span>
                {q.pyqYear && <span className="px-2 py-0.5 rounded-full bg-gold/20 text-ink dark:text-paper">NEET {q.pyqYear}</span>}
                {q.topic && <span className="text-ink/45 dark:text-paper/45">{q.topic}</span>}
              </div>
              <p className="mt-2 font-medium whitespace-pre-line">{q.question}</p>
              <ul className="mt-3 space-y-1.5">
                {q.options.map((o, k) => {
                  const right = open[q.id] && q.answer === k + 1;
                  return (
                    <li key={k} className={`flex gap-2 px-3 py-2 rounded-lg border ${right ? "border-rise bg-rise/10" : "border-ink/10 dark:border-paper/10"}`}>
                      <b>{LETTERS[k]}.</b> <span className="whitespace-pre-line">{o}</span>
                      {right && <Check size={16} className="ml-auto text-rise-dark shrink-0" />}
                    </li>
                  );
                })}
              </ul>
              <details className="mt-3" onToggle={(e) => setOpen((s) => ({ ...s, [q.id]: (e.target as HTMLDetailsElement).open }))}>
                <summary className="cursor-pointer text-sm font-semibold text-rise-dark">Show answer</summary>
                <div className="mt-2 text-sm">
                  <p><b>Answer: {LETTERS[q.answer - 1]}</b> — {q.options[q.answer - 1]}</p>
                  {q.explanation && <p className="mt-1 text-ink/75 dark:text-paper/75 whitespace-pre-line">{q.explanation}</p>}
                </div>
              </details>
            </li>
            {(i === 3 || i === 7) && i < c.questions.length - 1 && <Cta chapter={c.chapter} total={c.total} />}
          </Fragment>
        ))}
      </ol>

      <Cta chapter={c.chapter} total={c.total} big />

      {more.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold">More NEET {c.subject} chapters</h2>
          <ul className="mt-3 grid sm:grid-cols-2 gap-2">
            {more.map((r) => (
              <li key={r.slug}><Link to={`/neet-practice/${r.slug}`} className="text-rise-dark font-semibold hover:underline">{r.chapter} PYQs</Link></li>
            ))}
          </ul>
          <Link to="/neet-practice" className="inline-block mt-4 text-sm font-semibold underline">All NEET chapters →</Link>
        </section>
      )}
    </div>
  );
};

export default PracticeChapter;
