import { useEffect, useState, Fragment } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowRight, Check, FileText } from "lucide-react";
import { SITE_ORIGIN } from "../seo";
import { useInitialPracticeData, YNEET_API, SUBJECTS, paperMeta, type Paper, type PaperSummary } from "../practice/practiceData";
import NotFound from "./NotFound";

const LETTERS = ["A", "B", "C", "D"];

function setMeta(p: PaperSummary) {
  const m = paperMeta(p);
  const url = `${SITE_ORIGIN}/neet-question-papers/${p.year}`;
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
  const { year = "" } = useParams();
  const initial = useInitialPracticeData();
  const pre = initial.paper && String(initial.paper.year) === year ? initial.paper : undefined;
  const [p, setP] = useState<Paper | null | undefined>(pre);
  const [years, setYears] = useState<number[]>((initial.papers || []).map((x) => x.year));
  const [subject, setSubject] = useState<string>("Physics");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!YNEET_API) { if (!pre) setP(null); return; }
    let alive = true;
    if (!pre) axios.get(`${YNEET_API}/public/papers/${year}`)
      .then((r) => { if (alive) { setP(r.data.paper); setYears(r.data.years || []); } })
      .catch((e) => alive && setP(e?.response?.status === 404 ? null : undefined));
    else if (!years.length) axios.get(`${YNEET_API}/public/papers`).then((r) => alive && setYears((r.data.papers || []).map((x: PaperSummary) => x.year))).catch(() => {});
    return () => { alive = false; };
  }, [year]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (p) setMeta(p); }, [p]);

  if (p === null) return <NotFound />;
  if (p === undefined) return <div className="max-w-3xl mx-auto px-4 py-20 text-ink/50">Loading questions…</div>;

  const subjects = SUBJECTS.filter((s) => (p.subjects[s] || []).length);
  const active = subjects.includes(subject as typeof SUBJECTS[number]) ? subject : subjects[0];
  const qs = p.subjects[active] || [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <nav className="text-sm text-ink/55 dark:text-paper/55">
        <Link to="/neet-question-papers" className="hover:underline">NEET question papers</Link> › <span>{p.year}</span>
      </nav>
      <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight mt-3">NEET {p.year} Question Paper with Answers</h1>
      <p className="text-ink/70 dark:text-paper/70 mt-3">
        {p.total} NEET {p.year} questions with answers and explanations: Physics {p.counts.Physics || 0}, Chemistry {p.counts.Chemistry || 0}, Biology {p.counts.Biology || 0}. Tap “Show answer” under each question. No login needed.
      </p>
      {years.length > 1 && <div className="mt-5"><YearChips years={years} current={p.year} /></div>}

      <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Subject">
        {subjects.map((s) => (
          <button key={s} role="tab" aria-selected={s === active} onClick={() => setSubject(s)}
            className={`min-h-[44px] px-5 rounded-full font-semibold ${s === active ? "bg-ink text-paper dark:bg-gold dark:text-ink" : "border border-ink/20 dark:border-paper/25"}`}>
            {s} ({p.subjects[s].length})
          </button>
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
