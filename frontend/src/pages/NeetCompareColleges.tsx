import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Plus, Search, Share2, X } from "lucide-react";
import api from "../api/axios";
import { QuickSignup, track } from "../components/SignupNudge";

// /neet-compare-colleges: up to 3 medical/dental colleges side by side — state,
// type, fee (when known) and last year's closing rank in every quota the college
// fills through, for the chosen course and category. Data: the College
// Predictor's cutoff imports (GET /api/predictor/colleges + /compare).
// Picked colleges live in the URL (?c=id1,id2) so a comparison can be shared.

type CollegeHit = { id: string; name: string; state: string; type: string; courses: string[]; quotas: string[]; fee: number | null };
type CutRow = { quota: string; quotaName: string; year: number; round: number; rankType: string; course: string; seatType: string; category: string; closingRank: number; strayClosingRank: number | null; seats: number | null; annualFee: number | null };
type College = CollegeHit & { rows: CutRow[] };

const MAX = 3;
const MAIN_CATS = ["OPEN", "OBC", "EWS", "SC", "ST"];
const CAT_LABEL: Record<string, string> = { OPEN: "General / Open", OBC: "OBC", EWS: "EWS", SC: "SC", ST: "ST" };
const MGMT = /management|\bnri\b|non-resident|institutional|paid|self-financ|esi/i;
const fmt = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString("en-IN"));

const FAQS: [string, string][] = [
  ["Where do these closing ranks come from?", "From the official seat allotment results of the latest NEET counselling: MCC for All India Quota and each state's counselling authority for state quota. They are the same numbers our College Predictor uses."],
  ["What does closing rank mean?", "The last rank that got a seat in that college, quota and category in the regular counselling rounds. If your rank is better (a smaller number) than the closing rank, you had a good chance last year."],
  ["Why is a college missing a quota?", "A college only shows the quotas it fills seats through, and only for the states whose data we have. Some states use marks instead of ranks; those are shown as marks."],
  ["Are fees shown for every college?", "Only where the counselling data lists them. Always check the fee on the college's official fee notice before choice filling."],
];

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

function Picker({ course, exclude, onPick }: { course: string; exclude: string[]; onPick: (c: CollegeHit) => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<CollegeHit[]>([]);
  const [busy, setBusy] = useState(false);
  const dq = useDebounced(q.trim(), 250);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (dq.length < 2) { setHits([]); return; }
    let alive = true;
    setBusy(true);
    api.get("/predictor/colleges", { params: { q: dq, course } })
      .then((r) => { if (alive) setHits((r.data.colleges || []).filter((c: CollegeHit) => !exclude.includes(c.id))); })
      .catch(() => { if (alive) setHits([]); })
      .finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, [dq, course, exclude.join(",")]);
  return (
    <div ref={box} className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 mt-0.5 text-ink/40" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a college name or city, e.g. AIIMS, Madras, Guntur" className="cp-in !pl-9" />
      </div>
      {(hits.length > 0 || (busy && dq.length >= 2)) && (
        <ul className="absolute z-20 mt-1 w-full max-h-72 overflow-auto rounded-xl border border-ink/15 bg-white dark:bg-ink-light dark:border-paper/20 shadow-lg">
          {busy && hits.length === 0 && <li className="p-3 text-sm text-ink/60">Searching…</li>}
          {hits.map((h) => (
            <li key={h.id}>
              <button type="button" onClick={() => { onPick(h); setQ(""); setHits([]); }} className="w-full text-left p-3 hover:bg-gold/15 text-sm">
                <span className="font-semibold">{h.name}</span>
                <span className="block text-xs text-ink/60 dark:text-paper/60">{[h.state, h.type, h.courses.join(" · ")].filter(Boolean).join(" · ")}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {!busy && dq.length >= 2 && hits.length === 0 && <p className="text-xs text-ink/60 mt-1">No {course} college found for "{dq}". Try a shorter name or the city.</p>}
    </div>
  );
}

// Best (most relevant) closing rank per quota for the chosen course + category:
// merit seats first, then management/NRI/paid seats listed separately.
function cutoffsByQuota(c: College, course: string, category: string) {
  const rows = c.rows.filter((r) => r.course === course && r.category === category);
  const byQuota = new Map<string, { quotaName: string; year: number; rankType: string; merit: CutRow[]; paid: CutRow[] }>();
  for (const r of rows) {
    let g = byQuota.get(r.quota);
    if (!g) { g = { quotaName: r.quotaName, year: r.year, rankType: r.rankType, merit: [], paid: [] }; byQuota.set(r.quota, g); }
    (MGMT.test(r.seatType) ? g.paid : g.merit).push(r);
  }
  return byQuota;
}

export default function NeetCompareColleges() {
  const [params, setParams] = useSearchParams();
  const ids = useMemo(() => (params.get("c") || "").split(",").filter(Boolean).slice(0, MAX), [params]);
  const [course, setCourse] = useState(params.get("course") === "BDS" ? "BDS" : "MBBS");
  const [category, setCategory] = useState("OPEN");
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!ids.length) { setColleges([]); return; }
    let alive = true;
    setLoading(true);
    api.get("/predictor/compare", { params: { ids: ids.join(",") } })
      .then((r) => { if (alive) setColleges(r.data.colleges || []); })
      .catch(() => { if (alive) setColleges([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [ids.join(",")]);

  const setIds = (next: string[]) => {
    const p = new URLSearchParams(params);
    if (next.length) p.set("c", next.join(",")); else p.delete("c");
    if (course === "BDS") p.set("course", "BDS"); else p.delete("course");
    setParams(p, { replace: true });
  };
  const add = (c: CollegeHit) => { setIds([...ids, c.id].slice(0, MAX)); setAdding(false); track("compare_colleges_add", { college: c.name, n: ids.length + 1 }); };
  const remove = (id: string) => setIds(ids.filter((x) => x !== id));

  // Categories that appear for the picked colleges (main ones first).
  const cats = useMemo(() => {
    const s = new Set<string>();
    colleges.forEach((c) => c.rows.forEach((r) => { if (r.course === course) s.add(r.category); }));
    const main = MAIN_CATS.filter((k) => s.has(k));
    const rest = [...s].filter((k) => !MAIN_CATS.includes(k)).sort();
    return [...(main.length ? main : MAIN_CATS), ...rest];
  }, [colleges, course]);
  useEffect(() => { if (cats.length && !cats.includes(category)) setCategory(cats[0]); }, [cats.join(",")]);

  const quotas = useMemo(() => {
    const s = new Map<string, string>();
    colleges.forEach((c) => c.rows.forEach((r) => { if (r.course === course) s.set(r.quota, r.quotaName); }));
    return [...s.entries()].sort((a, b) => (a[0] === "AIQ" ? -1 : b[0] === "AIQ" ? 1 : a[1].localeCompare(b[1])));
  }, [colleges, course]);
  const cut = useMemo(() => colleges.map((c) => cutoffsByQuota(c, course, category)), [colleges, course, category]);

  const shareUrl = `https://www.yneet.in/neet-compare-colleges${ids.length ? `?c=${ids.join(",")}${course === "BDS" ? "&course=BDS" : ""}` : ""}`;
  const shareText = colleges.length >= 2 ? `Compare ${colleges.map((c) => c.name).join(" vs ")} — NEET closing ranks: ${shareUrl}` : `Compare NEET medical colleges side by side, free: ${shareUrl}`;
  const showPicker = ids.length < MAX && (adding || ids.length === 0 || ids.length === 1);

  const rankCell = (rows: CutRow[], rankType: string) => {
    if (!rows.length) return <span className="text-ink/40">—</span>;
    return (
      <ul className="space-y-1">
        {rows.slice().sort((a, b) => (rankType === "SCORE" ? b.closingRank - a.closingRank : a.closingRank - b.closingRank)).slice(0, 3).map((r, i) => (
          <li key={i}>
            <span className="font-semibold">{rankType === "SCORE" ? `${fmt(r.closingRank)} marks` : fmt(r.closingRank)}</span>
            {r.seatType && <span className="block text-[11px] text-ink/55 dark:text-paper/55">{r.seatType}</span>}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight">Compare NEET Medical Colleges</h1>
      <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg max-w-3xl">Pick up to 3 MBBS or BDS colleges and see them side by side: state, type, fee and last year's closing rank under All India and state quota for your category. Free, no login.</p>

      <div className="mt-6 flex flex-wrap gap-3 items-end">
        <div className="inline-flex rounded-full border border-ink/15 dark:border-paper/20 p-1">
          {["MBBS", "BDS"].map((k) => (
            <button key={k} type="button" onClick={() => setCourse(k)} className={`px-4 py-2 rounded-full text-sm font-semibold ${course === k ? "bg-ink text-paper dark:bg-paper dark:text-ink" : ""}`}>{k}</button>
          ))}
        </div>
        <label className="text-sm font-semibold">Category
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="cp-in !py-2">
            {cats.map((k) => <option key={k} value={k}>{CAT_LABEL[k] || k}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {colleges.map((c) => (
          <div key={c.id} className="rounded-2xl border border-ink/10 dark:border-paper/15 p-4 relative">
            <button type="button" onClick={() => remove(c.id)} aria-label={`Remove ${c.name}`} className="absolute top-2 right-2 p-1 rounded-full hover:bg-ink/10"><X size={16} /></button>
            <p className="font-semibold pr-6">{c.name}</p>
            <p className="text-xs text-ink/60 dark:text-paper/60 mt-1">{[c.state, c.type].filter(Boolean).join(" · ")}</p>
          </div>
        ))}
        {ids.length > 0 && ids.length < MAX && !adding && ids.length !== 1 && (
          <button type="button" onClick={() => setAdding(true)} className="rounded-2xl border-2 border-dashed border-ink/20 dark:border-paper/25 p-4 flex items-center justify-center gap-2 font-semibold hover:border-gold"><Plus size={18} /> Add a college</button>
        )}
      </div>
      {showPicker && (
        <div className="mt-4 max-w-xl">
          <p className="text-sm font-semibold mb-1">{ids.length === 0 ? "Pick the first college" : ids.length === 1 ? "Pick a college to compare with" : "Add a third college"}</p>
          <Picker course={course} exclude={ids} onPick={add} />
        </div>
      )}

      {loading && <p className="mt-6 text-sm text-ink/60">Loading closing ranks…</p>}

      {colleges.length > 0 && !loading && (
        <>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 dark:border-paper/15">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="bg-ink/[0.04] dark:bg-paper/5 text-left align-top">
                <tr>
                  <th className="p-3 w-40"></th>
                  {colleges.map((c) => <th key={c.id} className="p-3 font-semibold">{c.name}</th>)}
                </tr>
              </thead>
              <tbody className="align-top">
                <tr className="border-t border-ink/10 dark:border-paper/10"><td className="p-3 font-semibold">State</td>{colleges.map((c) => <td key={c.id} className="p-3">{c.state || "—"}</td>)}</tr>
                <tr className="border-t border-ink/10 dark:border-paper/10"><td className="p-3 font-semibold">Type</td>{colleges.map((c) => <td key={c.id} className="p-3">{c.type || "—"}</td>)}</tr>
                <tr className="border-t border-ink/10 dark:border-paper/10"><td className="p-3 font-semibold">Courses</td>{colleges.map((c) => <td key={c.id} className="p-3">{c.courses.join(", ")}</td>)}</tr>
                <tr className="border-t border-ink/10 dark:border-paper/10"><td className="p-3 font-semibold">Annual fee</td>{colleges.map((c) => <td key={c.id} className="p-3">{c.fee ? `₹${fmt(c.fee)} / yr` : <span className="text-ink/50">Check college notice</span>}</td>)}</tr>
                {quotas.map(([code, name]) => {
                  const g0 = cut.find((m) => m.get(code))?.get(code);
                  const unit = g0?.rankType === "SCORE" ? "lowest marks" : g0?.rankType === "STATE" ? "state rank" : "AIR";
                  return [
                    <tr key={code} className="border-t border-ink/10 dark:border-paper/10 bg-rise/5">
                      <td className="p-3 font-semibold">{code === "AIQ" ? "All India Quota" : `${name} state quota`}<span className="block text-[11px] font-normal text-ink/55 dark:text-paper/55">{CAT_LABEL[category] || category} · closing {unit}{g0 ? ` · ${g0.year}` : ""}</span></td>
                      {cut.map((m, i) => <td key={colleges[i].id} className="p-3">{rankCell(m.get(code)?.merit || [], m.get(code)?.rankType || "AIR")}</td>)}
                    </tr>,
                    cut.some((m) => (m.get(code)?.paid.length || 0) > 0) && (
                      <tr key={`${code}-paid`} className="border-t border-ink/10 dark:border-paper/10">
                        <td className="p-3 font-semibold">{code === "AIQ" ? "AIQ paid / NRI / ESI seats" : `${name}: management / NRI seats`}</td>
                        {cut.map((m, i) => <td key={colleges[i].id} className="p-3">{rankCell(m.get(code)?.paid || [], m.get(code)?.rankType || "AIR")}</td>)}
                      </tr>
                    ),
                  ];
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-ink/60 dark:text-paper/60 mt-2">Closing rank in the regular counselling rounds of the latest NEET counselling. "—" means no {CAT_LABEL[category] || category} {course} seat in that quota, or no data for that state yet.</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" onClick={() => track("compare_colleges_share")}
              className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold px-5 py-2.5 rounded-full"><Share2 size={16} /> Share this comparison</a>
            <Link to="/neet-college-predictor" onClick={() => track("compare_to_predictor")} className="inline-flex items-center gap-2 bg-ink text-paper dark:bg-paper dark:text-ink font-semibold px-5 py-2.5 rounded-full">Which colleges can my rank get? <ArrowRight size={16} /></Link>
          </div>

          <div className="mt-8 rounded-2xl bg-gold/15 border border-gold/40 p-6">
            <p className="font-display text-xl font-bold">Need a better rank for these colleges?</p>
            <p className="text-sm text-ink/70 dark:text-paper/70 mt-1">YNeet's chapter-wise tests and full NEET mocks show where you lose marks. 30 days free.</p>
            <QuickSignup place="compare_colleges" />
          </div>
        </>
      )}

      <h2 className="font-display text-2xl font-bold mt-12">Popular comparisons</h2>
      <p className="text-sm text-ink/70 dark:text-paper/70 mt-2">Not sure where to start? Search for colleges you're considering, like AIIMS New Delhi vs Maulana Azad, or Madras Medical College vs Stanley. You can also check <Link to="/neet-cutoff" className="text-rise-dark font-semibold underline">state-wise NEET cutoffs</Link> or estimate your rank with the <Link to="/neet-rank-predictor" className="text-rise-dark font-semibold underline">NEET rank predictor</Link>.</p>

      <h2 className="font-display text-2xl font-bold mt-12">Frequently asked questions</h2>
      <div className="mt-4 space-y-3 max-w-3xl">
        {FAQS.map(([q, a]) => (
          <details key={q} className="rounded-2xl border border-ink/10 dark:border-paper/15 p-4">
            <summary className="cursor-pointer font-semibold">{q}</summary>
            <p className="mt-2 text-ink/75 dark:text-paper/75">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
