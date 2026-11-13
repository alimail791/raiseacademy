import { useEffect, useState, Fragment } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowRight, Check, FileText } from "lucide-react";
import { SITE_ORIGIN } from "../seo";
import { useInitialPracticeData, YNEET_API, SUBJECTS, paperMeta, subjectSlug, type Paper, type PaperSummary } from "../practice/practiceData";
import NotFound from "./NotFound";
import UpdatedOn from "../components/UpdatedOn";

const LETTERS = ["A", "B", "C", "D"];

function setMeta(p: PaperSummary, subject?: string) {
  const m = paperMeta(p, subject);
  const url = `${SITE_ORIGIN}/neet-question-papers/${p.year}${subject ? `/${subjectSlug(subject)}` : ""}`;
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
  set('meta[property="og:url"]', "content", url, meta("og:url", true));
  set('link[rel="canonical"]', "href", url, () => { const l = document.createElement("link"); l.setAttribute("rel", "canonical"); return l; });
}

function YearChips({ years, current }: { years: number[]; current?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {years.map((y) => (
        <Link key={y} to={`/neet-question-papers/${y}`}
          className={`min-h-[44px] inline-flex items-center px-4 rounded-full font-semibold ${y === current ? "bg-gold text-ink" : "border border-ink/20 dark:border-paper/25 hover:border-gold"}`}>
          {y}
        </Link>
      ))}
    </div>
  );
}

function Cta({ year }: { year: number }) {
  return (
    <div className="my-6 rounded-2xl bg-ink text-paper p-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="font-display text-xl font-bold">Take NEET-style timed mocks with your rank</p>
        <p className="text-paper/75 text-sm mt-1">Full 720-mark mocks, NEET {year} PYQs and instant analysis. Free for 30 days, no card.</p>
        <p className="web-only text-paper/75 text-sm mt-1">Compare <Link to="/courses" className="text-gold font-semibold underline">NEET course plans for every class</Link>.</p>
      </div>
      <Link to="/register" className="inline-flex items-center gap-2 bg-gold text-ink font-semibold px-5 py-3 rounded-full hover:bg-gold-dark">Start free <ArrowRight size={16} /></Link>
    </div>
  );
}

export const PapersIndex = () => {
  const initial = useInitialPracticeData();
  const [papers, setPapers] = useState<PaperSummary[] | null>(initial.papers || null);
  useEffect(() => {
    if (!YNEET_API || initial.papers) return;
    axios.get(`${YNEET_API}/public/papers`).then((r) => setPapers(r.data.papers || [])).catch(() => setPapers([]));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm">Free · No login</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">NEET Previous Year Question Papers with Answers</h1>
      <UpdatedOn />
      <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg">
        NEET question papers year by year, with the correct answer and an explanation for every question. Pick a year to start. Prefer to practise one chapter at a time? See <Link to="/neet-practice" className="text-rise-dark font-semibold underline">chapter-wise PYQs</Link>.
      </p>
      {papers === null && <p className="mt-8 text-ink/50">Loading papers…</p>}
      {papers !== null && papers.length === 0 && <p className="mt-8 text-ink/60">Papers are being prepared. Meanwhile, try the <Link to="/neet-practice" className="underline font-semibold">chapter-wise PYQs</Link>.</p>}
      {papers && papers.length > 0 && (
        <ul className="mt-8 grid sm:grid-cols-2 gap-3">
          {papers.map((p) => (
            <li key={p.year}>
              <Link to={`/neet-question-papers/${p.year}`} className="flex items-start gap-3 p-5 rounded-2xl border border-ink/10 dark:border-paper/15 hover:border-gold h-full">
                <FileText className="text-gold-dark shrink-0" />
                <span>
                  <span className="font-display font-bold text-lg block">NEET {p.year} Question Paper</span>
                  <span className="text-sm text-ink/60 dark:text-paper/60">{p.total} questions · Physics {p.counts.Physics || 0} · Chemistry {p.counts.Chemistry || 0} · Biology {p.counts.Biology || 0}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Cta year={papers?.[0]?.year || 2026} />
    </div>
  );
};

export const PaperYear = () => {
  const { year = "", subject: subjectParam } = useParams();
  // /neet-question-papers/<year> is the overview; /<year>/<subject> lists that subject's questions.
  const subject = subjectParam ? SUBJECTS.find((s) => subjectSlug(s) === subjectParam.toLowerCase()) : undefined;
  const initial = useInitialPracticeData();
  // Prerendered pages carry only part of a paper (overview: chapters only;
  // subject page: that subject). Use it only when it covers what this URL shows.
  const covers = (x: Paper | null | undefined, s?: string) =>
    !!x && String(x.year) === year && (!s || !!(x.subjects[s] || [])[0]?.question);
  const pre = covers(initial.paper, subject) ? initial.paper : undefined;
  const [p, setP] = useState<Paper | null | undefined>(pre);
  const [years, setYears] = useState<number[]>((initial.papers || []).map((x) => x.year));
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (covers(p, subject)) {
      if (!years.length && YNEET_API) axios.get(`${YNEET_API}/public/papers`).then((r) => setYears((r.data.papers || []).map((x: PaperSummary) => x.year))).catch(() => {});
      return;
    }
    if (!YNEET_API) { setP(null); return; }
    let alive = true;
    setP(undefined);
    axios.get(`${YNEET_API}/public/papers/${year}`)
      .then((r) => { if (alive) { setP(r.data.paper); if (r.data.years?.length) setYears(r.data.years); } })
      .catch((e) => alive && setP(e?.response?.status === 404 ? null : undefined));
    return () => { alive = false; };
  }, [year, subject]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (p) setMeta(p, subject); }, [p, subject]);

  if (p === null || (subjectParam && !subject)) return <NotFound />;
  if (p === undefined) return <div className="max-w-3xl mx-auto px-4 py-20 text-ink/50">Loading questions…</div>;

  const subjects = SUBJECTS.filter((s) => (p.counts[s] || 0) > 0 || (p.subjects[s] || []).length);
  if (subject && !subjects.includes(subject)) return <NotFound />;
  if (!subject) return <PaperOverview p={p} years={years} subjects={subjects} />;
  const active = subject;
  const qs = p.subjects[active] || [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <nav className="text-sm text-ink/55 dark:text-paper/55">
        <Link to="/neet-question-papers" className="hover:underline">NEET question papers</Link> › <Link to={`/neet-question-papers/${p.year}`} className="hover:underline">{p.year}</Link> › <span>{active}</span>
      </nav>
      <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight mt-3">NEET {p.year} {active} Question Paper with Answers</h1>
      <UpdatedOn />
      <p className="text-ink/70 dark:text-paper/70 mt-3">
        {qs.length} NEET {p.year} {active} questions with the correct answer and an explanation for each, chapter-wise. Tap “Show answer” under each question. No login needed.
      </p>
      <div className="mt-6 flex flex-wrap gap-2" aria-label="Subject">
        {subjects.map((s) => (
          <Link key={s} to={`/neet-question-papers/${p.year}/${subjectSlug(s)}`} aria-current={s === active ? "page" : undefined}
            className={`min-h-[44px] inline-flex items-center px-5 rounded-full font-semibold ${s === active ? "bg-ink text-paper dark:bg-gold dark:text-ink" : "border border-ink/20 dark:border-paper/25"}`}>
            {s} ({p.counts[s] || p.subjects[s].length})
          </Link>
        ))}
      </div>

      <ol className="mt-6 space-y-5">
        {qs.map((q, i) => (
          <Fragment key={q.id}>
            <li className="p-5 rounded-2xl border border-ink/10 dark:border-paper/15">
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-ink/50 dark:text-paper/50">
                <span>Q{i + 1}</span>{q.chapter && <span>· {q.chapter}</span>}
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
            {(i + 1) % 15 === 0 && i < qs.length - 1 && <Cta year={p.year} />}
          </Fragment>
        ))}
      </ol>
      <Cta year={p.year} />
      <p className="text-sm text-ink/60 dark:text-paper/60">More free practice: <Link to="/neet-practice" className="underline font-semibold">chapter-wise PYQs</Link> · <Link to="/neet-question-of-the-day" className="underline font-semibold">NEET Question of the Day</Link> · <Link to="/neet-readiness" className="underline font-semibold">Readiness Test</Link></p>
    </div>
  );
};

// /neet-question-papers/<year>: subject links and how many questions came from
// each chapter (shipped without the questions themselves; see prerender.mjs).
function PaperOverview({ p, years, subjects }: { p: Paper; years: number[]; subjects: string[] }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <nav className="text-sm text-ink/55 dark:text-paper/55">
        <Link to="/neet-question-papers" className="hover:underline">NEET question papers</Link> › <span>{p.year}</span>
      </nav>
      <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight mt-3">NEET {p.year} Question Paper with Answers</h1>
      <UpdatedOn />
      <p className="text-ink/70 dark:text-paper/70 mt-3">
        {p.total} NEET {p.year} questions with answers and explanations: Physics {p.counts.Physics || 0}, Chemistry {p.counts.Chemistry || 0}, Biology {p.counts.Biology || 0}. Pick a subject to start. No login needed.
      </p>
      {years.length > 1 && <div className="mt-5"><YearChips years={years} current={p.year} /></div>}

      <ul className="mt-8 grid sm:grid-cols-3 gap-3">
        {subjects.map((s) => (
          <li key={s}>
            <Link to={`/neet-question-papers/${p.year}/${subjectSlug(s)}`} className="block p-5 rounded-2xl border border-ink/10 dark:border-paper/15 hover:border-gold h-full">
              <FileText className="text-gold-dark" />
              <span className="font-display font-bold text-lg block mt-2">NEET {p.year} {s}</span>
              <span className="text-sm text-ink/60 dark:text-paper/60">{p.counts[s] || 0} questions with solutions →</span>
            </Link>
          </li>
        ))}
      </ul>

      {subjects.map((s) => {
        const counts = new Map<string, number>();
        for (const q of p.subjects[s] || []) if (q.chapter) counts.set(q.chapter, (counts.get(q.chapter) || 0) + 1);
        const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);
        if (!rows.length) return null;
        return (
          <section key={s} className="mt-10">
            <h2 className="font-display text-xl font-bold">NEET {p.year} {s}: questions by chapter</h2>
            <table className="w-full mt-3 text-sm border-collapse">
              <tbody>
                {rows.map(([chapter, n]) => (
                  <tr key={chapter} className="border-b border-ink/5 dark:border-paper/10">
                    <td className="py-1.5 pr-3">{chapter}</td><td className="py-1.5 text-right font-semibold">{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Link to={`/neet-question-papers/${p.year}/${subjectSlug(s)}`} className="inline-block mt-3 text-sm font-semibold text-rise-dark underline">Solve NEET {p.year} {s} questions →</Link>
          </section>
        );
      })}

      <p className="mt-10 text-sm">How much is each chapter worth on average? See the <Link to="/neet-chapter-wise-weightage" className="text-rise-dark font-semibold underline">NEET chapter-wise weightage</Link>.</p>
      <Cta year={p.year} />
    </div>
  );
}
