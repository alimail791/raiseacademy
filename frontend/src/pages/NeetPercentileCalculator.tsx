import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Percent } from "lucide-react";
import { estimateRank, marksForRank, fmtRank } from "../score/scoring";
import { QuickSignup, track } from "../components/SignupNudge";

// /neet-percentile-calculator: NEET marks or All India Rank → percentile, and
// percentile → rank and marks. Uses NTA's percentile formula and the same
// marks-vs-rank curve as the Rank Predictor and Score Calculator, so all three
// pages agree. Runs in the browser only.

// Candidates who appeared in NEET (UG), roughly 22 lakh in recent years.
const APPEARED = 2200000;

// NTA: percentile = 100 × (candidates with a score equal to or below yours) / total.
// At All India Rank r, (r − 1) students are above you, so N − r + 1 are at or below.
const pctFromRank = (r: number) => Math.max(0, Math.min(100, (100 * (APPEARED - r + 1)) / APPEARED));
const rankFromPct = (p: number) => Math.max(1, Math.round(APPEARED - (p / 100) * APPEARED + 1));
const fmtPct = (p: number) => (p >= 99.9 ? p.toFixed(4) : p.toFixed(2));

const QUALIFY: [string, number][] = [
  ["General (UR) / EWS", 50],
  ["OBC-NCL, SC, ST", 40],
  ["PwD (General / EWS)", 45],
  ["PwD (OBC, SC, ST)", 40],
];

const TABLE_PCT = [99.99, 99.9, 99.5, 99, 98, 97, 95, 90];

const FAQS: [string, string][] = [
  ["What is NEET percentile?", "Your NEET percentile is the percentage of candidates who scored the same as you or less. A 99 percentile means you scored equal to or more than 99% of everyone who took the exam. It is not the same as percentage marks."],
  ["How does NTA calculate NEET percentile?", "Percentile = 100 × (number of candidates with a raw score equal to or less than yours) ÷ (total candidates who appeared). NTA calculates it to 7 decimal places so that very few students share the same percentile."],
  ["What percentile do I need to qualify NEET?", "50th percentile for General and EWS, 40th for OBC-NCL, SC and ST, 45th for PwD (General/EWS) and 40th for PwD in reserved categories. In marks, the General cut-off moves a lot with the paper: 144 in NEET 2025 and 213 in NEET 2026."],
  ["Is 90 percentile good in NEET?", "90 percentile is roughly a rank of 2.2 lakh, which is well above the qualifying mark but usually not enough for a government MBBS seat. For a government seat under All India Quota you generally need around 98.9 percentile or more (a rank within about 25,000), depending on category and state."],
  ["How accurate is this calculator?", "It is an estimate. It assumes about 22 lakh candidates and uses the official marks-vs-rank data of the latest NEET. The exact percentile depends on how many students appear in NEET 2027 and how hard the paper is."],
];

type Mode = "marks" | "rank" | "pct";

export default function NeetPercentileCalculator() {
  const [mode, setMode] = useState<Mode>("marks");
  const [val, setVal] = useState("");
  const [shown, setShown] = useState(false);

  const num = Number(val.replace(/,/g, ""));
  const ok = val !== "" && Number.isFinite(num) && (
    mode === "marks" ? num >= -180 && num <= 720 : mode === "rank" ? num >= 1 && num <= APPEARED : num > 0 && num < 100
  );

  const result = useMemo(() => {
    if (!ok) return null;
    if (mode === "marks") {
      const r = estimateRank(Math.round(num)).normal;
      return r == null ? { below: true as const } : { rank: r, pct: pctFromRank(r), marks: Math.round(num) };
    }
    if (mode === "rank") {
      const r = Math.round(num);
      return { rank: r, pct: pctFromRank(r), marks: marksForRank(r) };
    }
    const r = rankFromPct(num);
    return { rank: r, pct: num, marks: marksForRank(r) };
  }, [ok, mode, num]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ok) return;
    setShown(true);
    track("percentile_calc_run", { mode, value: num });
    setTimeout(() => document.getElementById("pc-result")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const labels: Record<Mode, [string, string, string]> = {
    marks: ["Marks → Percentile", "Your NEET marks (out of 720)", "e.g. 560"],
    rank: ["Rank → Percentile", "Your All India Rank", "e.g. 25000"],
    pct: ["Percentile → Rank", "Your NEET percentile", "e.g. 99.5"],
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight">NEET Percentile Calculator 2027</h1>
      <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg">Convert your NEET marks or All India Rank to a percentile, or a percentile to the rank and marks it means. Uses NTA's percentile formula and the latest official NEET marks-vs-rank data. Free, no login.</p>

      <div className="mt-6 inline-flex flex-wrap rounded-full border border-ink/15 dark:border-paper/20 p-1">
        {(Object.keys(labels) as Mode[]).map((k) => (
          <button key={k} type="button" onClick={() => { setMode(k); setVal(""); setShown(false); }}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${mode === k ? "bg-ink text-paper dark:bg-paper dark:text-ink" : ""}`}>{labels[k][0]}</button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 rounded-2xl border border-ink/10 dark:border-paper/15 p-5 grid gap-4">
        <label className="text-sm font-semibold">{labels[mode][1]}
          <input inputMode="decimal" value={val} placeholder={labels[mode][2]} className="cp-in"
            onChange={(e) => { setVal(e.target.value.replace(mode === "pct" ? /[^\d.]/g : /[^\d,-]/g, "").slice(0, 12)); setShown(false); }} />
        </label>
        <button type="submit" disabled={!ok} className="inline-flex justify-center items-center gap-2 bg-gold text-ink font-bold px-6 py-3 rounded-full hover:bg-gold-dark disabled:opacity-50">
          <Percent size={18} /> Calculate
        </button>
        {val !== "" && !ok && (
          <p className="text-sm text-red-600">
            {mode === "marks" ? "Enter marks between −180 and 720." : mode === "rank" ? "Enter a rank between 1 and 22,00,000." : "Enter a percentile between 0 and 100."}
          </p>
        )}
      </form>

      {shown && result && (
        <div id="pc-result" className="mt-8 rounded-2xl bg-rise/10 border border-rise/25 p-6">
          {"below" in result ? (
            <>
              <p className="font-display text-xl font-bold">Below the qualifying range</p>
              <p className="mt-2 text-ink/75 dark:text-paper/75">{Math.round(num)}/720 is likely below the 50th percentile. The General qualifying mark was 144 in NEET 2025 and 213 in NEET 2026; reserved categories (40th percentile) needed 113 and 177.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-ink/70 dark:text-paper/70">Expected NEET percentile</p>
              <p className="font-display text-4xl font-bold mt-1">{fmtPct(result.pct)}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white/70 dark:bg-ink-light p-3"><p className="text-ink/60 dark:text-paper/60">All India Rank</p><p className="font-bold text-lg">~{fmtRank(result.rank)}</p></div>
                <div className="rounded-xl bg-white/70 dark:bg-ink-light p-3"><p className="text-ink/60 dark:text-paper/60">Marks (out of 720)</p><p className="font-bold text-lg">{result.marks != null ? `~${result.marks}` : "below 140"}</p></div>
              </div>
              <p className="mt-4 text-sm text-ink/75 dark:text-paper/75">
                {result.pct >= 70 ? "Comfortably above the qualifying percentile in every category." : "Close to the qualifying line. Below about 70 percentile the estimate is rough: the General qualifying mark was 144 in NEET 2025 but 213 in NEET 2026, so check against the official cutoff."}
                {" "}See which colleges this rank can get with the <Link to="/neet-college-predictor" className="font-semibold underline">College Predictor</Link>.
              </p>
            </>
          )}
          <div className="web-only mt-5 pt-5 border-t border-rise/25">
            <p className="font-semibold">Want to push your percentile up?</p>
            <p className="text-sm text-ink/70 dark:text-paper/70 mt-1">Full NEET mocks with All India-style rank, chapter tests and your weak chapters after every test. 30 days free.</p>
            <QuickSignup place="percentile_calc" />
          </div>
        </div>
      )}

      <h2 className="font-display text-2xl font-bold mt-12">NEET qualifying percentile by category</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 dark:border-paper/15">
        <table className="w-full text-sm">
          <thead className="bg-ink/[0.04] dark:bg-paper/5 text-left"><tr><th className="p-3">Category</th><th className="p-3">Qualifying percentile</th></tr></thead>
          <tbody>
            {QUALIFY.map(([c, p]) => (
              <tr key={c} className="border-t border-ink/10 dark:border-paper/10"><td className="p-3">{c}</td><td className="p-3 font-semibold">{p}th</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="font-display text-2xl font-bold mt-12">NEET percentile vs rank vs marks</h2>
      <p className="text-ink/70 dark:text-paper/70 mt-2 text-sm">Approximate, for about 22 lakh candidates and a normal-difficulty paper. Below 90 percentile, marks swing a lot from year to year (the 50th percentile was 144 marks in NEET 2025 and 213 in NEET 2026).</p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 dark:border-paper/15">
        <table className="w-full text-sm">
          <thead className="bg-ink/[0.04] dark:bg-paper/5 text-left"><tr><th className="p-3">Percentile</th><th className="p-3">All India Rank</th><th className="p-3">Marks</th></tr></thead>
          <tbody>
            {TABLE_PCT.map((p) => {
              const r = rankFromPct(p);
              const mk = marksForRank(r);
              return (
                <tr key={p} className="border-t border-ink/10 dark:border-paper/10">
                  <td className="p-3 font-semibold">{p}</td><td className="p-3">~{fmtRank(r)}</td><td className="p-3">{mk != null ? `~${mk}` : "~140"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-sm mt-4">Know your exact answers? Work out your marks with the <Link to="/neet-score-calculator" className="text-rise-dark font-semibold underline">NEET score calculator</Link>, or your rank with the <Link to="/neet-rank-predictor" className="text-rise-dark font-semibold underline">NEET rank predictor</Link>.</p>

      <h2 className="font-display text-2xl font-bold mt-12">Frequently asked questions</h2>
      <div className="mt-4 space-y-3">
        {FAQS.map(([q, a]) => (
          <details key={q} className="rounded-2xl border border-ink/10 dark:border-paper/15 p-4">
            <summary className="cursor-pointer font-semibold">{q}</summary>
            <p className="mt-2 text-ink/75 dark:text-paper/75">{a}</p>
          </details>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "FAQPage",
          mainEntity: FAQS.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
        }).replace(/</g, "\\u003c"),
      }} />
    </div>
  );
}
