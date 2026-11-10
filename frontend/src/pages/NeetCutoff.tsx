// NEET cutoff pages: /neet-cutoff (all states) and /neet-cutoff/<state>
// (every government MBBS college's closing rank, category-wise). Same data as
// the College Predictor; prerendered at build time by scripts/prerender.mjs.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import api from "../api/axios";
import { SITE_ORIGIN } from "../seo";
import { useInitialPracticeData, cutoffMeta, cutoffTitleName, type CutoffState } from "../practice/practiceData";
import NotFound from "./NotFound";

const fmt = (n: number | undefined) => (n === undefined ? "—" : n.toLocaleString("en-IN"));
const catLabel = (c: string) => (c === "OPEN" ? "General (Open)" : c);
const unitOf = (c: CutoffState) => (c.rankType === "SCORE" ? "NEET marks" : c.rankType === "STATE" ? "state merit rank" : "All India Rank (AIR)");
const valueWord = (c: CutoffState) => (c.rankType === "SCORE" ? "lowest mark admitted" : "closing rank");

function setMeta(title: string, description: string, path: string) {
  const url = `${SITE_ORIGIN}${path}`;
  document.title = title;
  const set = (sel: string, attr: string, val: string, make: () => HTMLElement) => {
    let el = document.head.querySelector(sel) as HTMLElement | null;
    if (!el) { el = make(); document.head.appendChild(el); }
    el.setAttribute(attr, val);
  };
  const meta = (k: string, prop = false) => () => { const e = document.createElement("meta"); e.setAttribute(prop ? "property" : "name", k); return e; };
  set('meta[name="description"]', "content", description, meta("description"));
  set('meta[name="robots"]', "content", "index, follow", meta("robots"));
  set('meta[property="og:title"]', "content", title, meta("og:title", true));
  set('meta[property="og:url"]', "content", url, meta("og:url", true));
  set('link[rel="canonical"]', "href", url, () => { const l = document.createElement("link"); l.setAttribute("rel", "canonical"); return l; });
}

// Prerendered state pages carry only their own state's full table (other states
// as names), so anything else is fetched from the API.
function useCutoffs(slug?: string): CutoffState[] | null | undefined {
  const initial = useInitialPracticeData();
  const has = (list?: CutoffState[]) => !!list && (slug ? !!list.find((s) => s.slug === slug)?.colleges.length : list.every((s) => s.colleges.length));
  const [states, setStates] = useState<CutoffState[] | null | undefined>(has(initial.cutoffs) ? initial.cutoffs : undefined);
  useEffect(() => {
    if (has(states || undefined)) return;
    let alive = true;
    api.get("/predictor/cutoff-pages").then((r) => alive && setStates(r.data.states || [])).catch(() => alive && setStates(null));
    return () => { alive = false; };
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps
  return states;
}

function PredictorCta() {
  return (
    <div className="my-8 rounded-2xl bg-ink text-paper p-6">
      <p className="font-display font-bold text-xl">Which colleges can you get with your rank?</p>
      <p className="text-sm text-paper/75 mt-2">Enter your NEET rank and category in the free College Predictor: All India Quota plus your state quota, Safe / Good chance / Borderline.</p>
      <Link to="/neet-college-predictor" className="mt-4 inline-flex items-center gap-2 bg-gold text-ink font-semibold px-6 py-3 rounded-full hover:bg-gold-dark">
        Open the College Predictor <ArrowRight size={16} />
      </Link>
    </div>
  );
}

function StateLinks({ states, current }: { states: CutoffState[]; current?: string }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-2 text-sm">
      {states.filter((s) => s.slug !== current).map((s) => (
        <li key={s.slug}><Link to={`/neet-cutoff/${s.slug}`} className="inline-block px-3 py-1.5 rounded-full border border-ink/15 dark:border-paper/20 hover:border-gold">{cutoffTitleName(s)}</Link></li>
      ))}
    </ul>
  );
}

export const NeetCutoffIndex = () => {
  const states = useCutoffs();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm">From official counselling data</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">NEET Cutoff for Government MBBS: All India Quota & State-wise</h1>
      <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg">
        Closing ranks of every government MBBS college in the latest NEET counselling, category-wise, for the 15% All India Quota and each state's 85% quota. Pick your quota.
      </p>
      {states === undefined && <p className="mt-8 text-ink/50">Loading…</p>}
      {states === null && <p className="mt-8 text-ink/60">Couldn't load the cutoffs. Try the <Link to="/neet-college-predictor" className="underline font-semibold">College Predictor</Link>.</p>}
      {states && states.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-ink/15 dark:border-paper/20">
                <th className="py-2 pr-3">Quota</th><th className="py-2 pr-3">Govt MBBS colleges</th><th className="py-2 pr-3">General: last govt seat</th><th className="py-2">Ranked by</th>
              </tr>
            </thead>
            <tbody>
              {states.map((s) => {
                const open = s.categorySummary.find((x) => x.category === "OPEN");
                return (
                  <tr key={s.slug} className="border-b border-ink/5 dark:border-paper/10">
                    <td className="py-2 pr-3"><Link to={`/neet-cutoff/${s.slug}`} className="font-semibold text-rise-dark hover:underline">{cutoffTitleName(s)} cutoff {s.year}</Link></td>
                    <td className="py-2 pr-3">{s.colleges.length}</td>
                    <td className="py-2 pr-3">{fmt(open?.last)}</td>
                    <td className="py-2 text-ink/60 dark:text-paper/60">{unitOf(s)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <PredictorCta />
    </div>
  );
};

export const NeetCutoffState = () => {
  const { state = "" } = useParams();
  const states = useCutoffs(state);
  const c = states?.find((s) => s.slug === state);

  useEffect(() => {
    if (c) { const m = cutoffMeta(c); setMeta(m.title, m.description, `/neet-cutoff/${c.slug}`); }
  }, [c]);

  if (states === undefined) return <div className="max-w-3xl mx-auto px-4 py-20 text-ink/50">Loading…</div>;
  if (!c) return <NotFound />;

  const open = c.categorySummary.find((x) => x.category === "OPEN");
  const top = c.colleges[0];
  const name = cutoffTitleName(c);
  const higherIsHarder = c.rankType === "SCORE";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <nav className="text-sm text-ink/55 dark:text-paper/55">
        <Link to="/neet-cutoff" className="hover:underline">NEET cutoff</Link> › <span>{name}</span>
      </nav>
      <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight mt-3">{name} NEET Cutoff {c.year} for Government MBBS Colleges</h1>
      <p className="text-ink/75 dark:text-paper/75 mt-3">
        In {name} NEET {c.year} counselling (up to round {c.round}), {c.colleges.length} government MBBS colleges filled seats. Cutoffs here are by {unitOf(c)}.
        {open && <> For the General (Open) category, the last government MBBS seat went at {c.rankType === "SCORE" ? "" : "rank "}<b>{fmt(open.last)}</b>{c.rankType === "SCORE" ? " marks" : ""}</>}
        {open && top && top.closing.OPEN !== undefined && <>, and the most competitive college, {top.college}, closed at <b>{fmt(top.closing.OPEN)}</b>{c.rankType === "SCORE" ? " marks" : ""}</>}.
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">Category-wise cutoff for government MBBS</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b border-ink/15 dark:border-paper/20">
              <th className="py-2 pr-3">Category</th><th className="py-2 pr-3">Most competitive college</th><th className="py-2 pr-3">Last government seat</th><th className="py-2">Colleges</th>
            </tr>
          </thead>
          <tbody>
            {c.categorySummary.map((x) => (
              <tr key={x.category} className="border-b border-ink/5 dark:border-paper/10">
                <td className="py-2 pr-3 font-semibold">{catLabel(x.category)}</td>
                <td className="py-2 pr-3">{fmt(x.toughest)}</td>
                <td className="py-2 pr-3">{fmt(x.last)}</td>
                <td className="py-2">{x.colleges}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink/55 dark:text-paper/55 mt-2">{higherIsHarder ? "Higher marks = more competitive." : "Lower rank = more competitive."} Seats reserved for special groups (PwD, domicile-only, minority, management/NRI) are not included.</p>

      <h2 className="font-display text-2xl font-bold mt-10">{name} government MBBS colleges: {valueWord(c)} {c.year}</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b border-ink/15 dark:border-paper/20">
              <th className="py-2 pr-3">College</th>
              {c.categories.map((cat) => <th key={cat} className="py-2 pr-3 text-right whitespace-nowrap">{catLabel(cat)}</th>)}
            </tr>
          </thead>
          <tbody>
            {c.colleges.map((col) => (
              <tr key={col.college} className="border-b border-ink/5 dark:border-paper/10">
                <td className="py-2 pr-3">{col.college}{col.type && !/^government$/i.test(col.type) ? <span className="text-xs text-ink/50 dark:text-paper/50"> · {col.type}</span> : null}</td>
                {c.categories.map((cat) => <td key={cat} className="py-2 pr-3 text-right">{fmt(col.closing[cat])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(c.privateMbbs || c.govtBds) && (
        <section className="mt-10 space-y-2 text-ink/80 dark:text-paper/80">
          <h2 className="font-display text-2xl font-bold text-ink dark:text-paper">Private MBBS and BDS</h2>
          {c.privateMbbs && <p><b>Private MBBS (merit seats, General):</b> {c.privateMbbs.colleges} colleges, from {fmt(c.privateMbbs.toughest)} to {fmt(c.privateMbbs.last)}{c.rankType === "SCORE" ? " marks" : ""}. Fees are much higher than government colleges.</p>}
          {c.govtBds && <p><b>Government BDS (General):</b> {c.govtBds.colleges} colleges, from {fmt(c.govtBds.toughest)} to {fmt(c.govtBds.last)}{c.rankType === "SCORE" ? " marks" : ""}.</p>}
        </section>
      )}

      <PredictorCta />

      <section className="space-y-3 text-ink/80 dark:text-paper/80">
        <h2 className="font-display text-2xl font-bold text-ink dark:text-paper">How to read these cutoffs</h2>
        <p>The {valueWord(c)} is the {c.rankType === "SCORE" ? "lowest NEET mark" : "last rank"} that got a seat in that college and category in {c.year}, across the regular counselling rounds. If your {c.rankType === "SCORE" ? "mark is at or above" : "rank is at or better than"} a college's figure, you had a real chance there last year.</p>
        <p>Cutoffs move every year with the number of seats, new colleges and how hard the paper was, so use them as a guide, not a guarantee. Always check the official seat matrix and rules {c.code === "AIQ" || c.code === "DL" ? "on mcc.nic.in" : "on the state counselling website"} before choice filling. YNeet is not connected with MCC or any state counselling authority.</p>
      </section>

      {states && states.length > 1 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-bold">NEET cutoff for other states</h2>
          <StateLinks states={states} current={c.slug} />
        </section>
      )}
    </div>
  );
};
