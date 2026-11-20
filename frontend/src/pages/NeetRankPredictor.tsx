import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Share2, Target, TrendingUp } from "lucide-react";
import { estimateRank, fmtRank, QUALIFY_GENERAL, QUALIFY_RESERVED } from "../score/scoring";
import { QuickSignup, track } from "../components/SignupNudge";

// /neet-rank-predictor: NEET marks → expected All India Rank (and the reverse:
// marks needed for a target rank). Uses the same marks-vs-rank curves as the
// Score Calculator (score/scoring.ts), so both pages always agree. All in the
// browser; nothing is sent to the server.

const STORE = "neet_rank_pred_v1";
const CATEGORIES = [
  { code: "GEN", label: "General (UR)" },
  { code: "EWS", label: "EWS" },
  { code: "OBC", label: "OBC-NCL" },
  { code: "SC", label: "SC" },
  { code: "ST", label: "ST" },
  { code: "PWD", label: "PwD (General)" },
];
const qualifyMark = (cat: string) => (cat === "GEN" || cat === "EWS" ? QUALIFY_GENERAL : cat === "PWD" ? 127 : QUALIFY_RESERVED);

const TABLE_MARKS = [710, 700, 690, 680, 670, 660, 650, 640, 630, 620, 600, 580, 560, 540, 520, 500, 480, 450, 420, 400, 350, 300, 250, 200, 150];

const FAQS: [string, string][] = [
  ["How is the expected rank calculated?", "From the official marks-vs-rank data of the last two NEET exams: Re-NEET 2026 (a normal paper) and NEET 2025 (a tough paper, where the topper scored 686). We show both, because your real rank depends on how hard the 2027 paper is."],
  ["Why are there two ranks?", "The same marks give a better rank in a tough year (fewer students score high) and a lower rank in an easy year. The 'normal paper' rank is the one to plan with; the 'tough paper' rank is your best case."],
  ["Does this show my category rank?", "No. NTA publishes the category rank with the result. Counselling (MCC and state) uses your All India Rank or state merit rank, and the College Predictor shows category-wise closing ranks for that."],
  ["What marks are needed for a government MBBS seat?", "Under All India Quota, General category students needed an AIR within about 25,000 for a government MBBS seat in the latest counselling (the last seats closed near 27,000). State quota cutoffs are often easier for home-state students. Use the College Predictor to check your state."],
  ["Is my data saved?", "Your marks stay in this browser only. Nothing is sent to our server."],
];

function marksForRank(target: number, which: "normal" | "tough") {
  for (let m = 0; m <= 720; m++) {
    const r = estimateRank(m)[which];
    if (r != null && r <= target) return m;
  }
  return null;
}

export default function NeetRankPredictor() {
  const [mode, setMode] = useState<"marks" | "target">("marks");
  const [marks, setMarks] = useState("");
  const [cat, setCat] = useState("GEN");
  const [target, setTarget] = useState("");
  const [shown, setShown] = useState(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORE) || "{}");
      if (s.marks) setMarks(String(s.marks));
      if (s.cat) setCat(s.cat);
      if (s.target) setTarget(String(s.target));
    } catch { /* storage blocked */ }
  }, []);
  const save = (patch: Record<string, unknown>) => {
    try { localStorage.setItem(STORE, JSON.stringify({ marks, cat, target, ...patch })); } catch { /* storage blocked */ }
  };

  const m = Math.round(Number(marks));
  const marksOk = marks !== "" && Number.isFinite(m) && m >= -180 && m <= 720;
  const rank = useMemo(() => (marksOk ? estimateRank(m) : null), [marksOk, m]);
  const qualifies = marksOk && m >= qualifyMark(cat);

  const t = Math.round(Number(target.replace(/[^\d]/g, "")));
  const targetOk = t >= 1 && t <= 2500000;
  const need = useMemo(() => (targetOk ? { normal: marksForRank(t, "normal"), tough: marksForRank(t, "tough") } : null), [targetOk, t]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "marks" && !marksOk) return;
    if (mode === "target" && !targetOk) return;
    setShown(true);
    save({});
    track("rank_predictor_run", { mode, marks: mode === "marks" ? m : undefined, target: mode === "target" ? t : undefined, category: cat });
    setTimeout(() => document.getElementById("rp-result")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const shareText = rank?.normal != null
    ? `With ${m}/720 in NEET my expected All India Rank is ~${fmtRank(rank.normal)}. Check yours free: https://www.yneet.in/neet-rank-predictor`
    : "Check your expected NEET rank from your marks, free: https://www.yneet.in/neet-rank-predictor";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight">NEET Rank Predictor 2027</h1>
      <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg">Enter your NEET marks to see your expected All India Rank, or enter a target rank to see the marks you need. Based on official NEET marks-vs-rank data. Free, no login.</p>

      <div className="mt-6 inline-flex rounded-full border border-ink/15 dark:border-paper/20 p-1">
        {([["marks", "Marks → Rank"], ["target", "Rank → Marks needed"]] as const).map(([k, l]) => (
          <button key={k} type="button" onClick={() => { setMode(k); setShown(false); }}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${mode === k ? "bg-ink text-paper dark:bg-paper dark:text-ink" : ""}`}>{l}</button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 rounded-2xl border border-ink/10 dark:border-paper/15 p-5 grid sm:grid-cols-2 gap-4">
        {mode === "marks" ? (
          <label className="text-sm font-semibold">Your NEET marks (out of 720)
            <input inputMode="numeric" value={marks} onChange={(e) => { setMarks(e.target.value.replace(/[^\d-]/g, "").slice(0, 4)); setShown(false); }} placeholder="e.g. 560" className="cp-in" />
          </label>
        ) : (
          <label className="text-sm font-semibold">Target All India Rank
            <input inputMode="numeric" value={target} onChange={(e) => { setTarget(e.target.value.replace(/[^\d,]/g, "").slice(0, 10)); setShown(false); }} placeholder="e.g. 20000" className="cp-in" />
          </label>
        )}
        <label className="text-sm font-semibold">Category
          <select value={cat} onChange={(e) => { setCat(e.target.value); save({ cat: e.target.value }); }} className="cp-in">
            {CATEGORIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </label>
        <button type="submit" className="sm:col-span-2 inline-flex justify-center items-center gap-2 bg-gold text-ink font-bold px-6 py-3 rounded-full hover:bg-gold-dark disabled:opacity-50"
          disabled={mode === "marks" ? !marksOk : !targetOk}>
          {mode === "marks" ? <><TrendingUp size={18} /> Predict my rank</> : <><Target size={18} /> Show marks needed</>}
        </button>
        {mode === "marks" && marks !== "" && !marksOk && <p className="sm:col-span-2 text-sm text-red-600">Enter marks between −180 and 720.</p>}
      </form>

      {shown && mode === "marks" && rank && (
        <div id="rp-result" className="mt-8 space-y-5">
          <div className="rounded-2xl bg-rise/10 border border-rise/25 p-6">
            <p className="font-display text-lg font-bold">Expected All India Rank for {m}/720</p>
            {rank.normal == null ? (
              <p className="mt-2">This is below the range NTA ranks are usually published for. Focus on crossing the qualifying mark ({qualifyMark(cat)}+ for your category) first.</p>
            ) : (
              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl bg-white dark:bg-ink-light p-4">
                  <p className="text-xs text-ink/60 dark:text-paper/60">If the paper is normal (like Re-NEET 2026)</p>
                  <p className="font-display text-2xl font-bold">AIR ~{fmtRank(rank.normal)}</p>
                </div>
                <div className="rounded-xl bg-white dark:bg-ink-light p-4">
                  <p className="text-xs text-ink/60 dark:text-paper/60">If the paper is tough (like NEET 2025)</p>
                  <p className="font-display text-2xl font-bold">AIR ~{fmtRank(rank.tough)}</p>
                </div>
              </div>
            )}
            <p className={`mt-4 text-sm font-semibold ${qualifies ? "text-rise-dark" : "text-red-600"}`}>
              {qualifies ? `✓ Above the usual qualifying mark for ${CATEGORIES.find((c) => c.code === cat)?.label} (about ${qualifyMark(cat)})` : `Below the usual qualifying mark for ${CATEGORIES.find((c) => c.code === cat)?.label} (about ${qualifyMark(cat)})`}
            </p>
            <p className="text-xs text-ink/60 dark:text-paper/60 mt-2">Estimate from official NEET results. Your real rank comes with the NTA result.</p>
          </div>

          {rank.normal != null && qualifies && (
            <div className="rounded-2xl bg-ink text-paper p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
              <div>
                <p className="font-display text-xl font-bold">Which colleges can AIR ~{fmtRank(rank.normal)} get?</p>
                <p className="text-paper/80 text-sm mt-1">MBBS & BDS under All India and your state quota, from last year's closing ranks.</p>
              </div>
              <Link to={`/neet-college-predictor?air=${rank.normal}`} onClick={() => track("rank_predictor_to_college")} className="inline-flex items-center gap-2 bg-gold text-ink font-semibold px-5 py-3 rounded-full shrink-0">See my colleges <ArrowRight size={16} /></Link>
            </div>
          )}

          <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" onClick={() => track("rank_predictor_share")}
            className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold px-5 py-2.5 rounded-full"><Share2 size={16} /> Share on WhatsApp</a>

          <div className="rounded-2xl bg-gold/15 border border-gold/40 p-6">
            <p className="font-display text-xl font-bold">{rank.normal != null && rank.normal < 25000 ? "Keep this rank: practise the chapters that matter most" : "Every 10 marks moves you thousands of ranks"}</p>
            <p className="text-sm text-ink/70 dark:text-paper/70 mt-1">YNeet shows which chapters cost you marks, with chapter tests and full NEET mocks. 30 days free.</p>
            <QuickSignup place="rank_predictor_result" />
          </div>
        </div>
      )}

      {shown && mode === "target" && need && (
        <div id="rp-result" className="mt-8 space-y-5">
          <div className="rounded-2xl bg-rise/10 border border-rise/25 p-6">
            <p className="font-display text-lg font-bold">Marks needed for AIR {fmtRank(t)}</p>
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-white dark:bg-ink-light p-4">
                <p className="text-xs text-ink/60 dark:text-paper/60">Normal paper (like Re-NEET 2026)</p>
                <p className="font-display text-2xl font-bold">{need.normal == null ? "—" : `${need.normal}+ / 720`}</p>
              </div>
              <div className="rounded-xl bg-white dark:bg-ink-light p-4">
                <p className="text-xs text-ink/60 dark:text-paper/60">Tough paper (like NEET 2025)</p>
                <p className="font-display text-2xl font-bold">{need.tough == null ? "—" : `${need.tough}+ / 720`}</p>
              </div>
            </div>
            <p className="text-xs text-ink/60 dark:text-paper/60 mt-3">Aim for the normal-paper number: it's the safer target.</p>
          </div>
          <div className="rounded-2xl bg-gold/15 border border-gold/40 p-6">
            <p className="font-display text-xl font-bold">Get a study plan for {need.normal ?? "your target"} marks</p>
            <p className="text-sm text-ink/70 dark:text-paper/70 mt-1">YNeet's chapter-priority plan, daily tests and full mocks track how close you are to your target. 30 days free.</p>
            <QuickSignup place="rank_predictor_target" />
          </div>
        </div>
      )}

      <h2 className="font-display text-2xl font-bold mt-12">NEET marks vs rank</h2>
      <p className="text-ink/70 dark:text-paper/70 mt-2 text-sm">Expected All India Rank for each score, from the last two NEET results.</p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 dark:border-paper/15">
        <table className="w-full text-sm">
          <thead className="bg-ink/[0.04] dark:bg-paper/5 text-left">
            <tr><th className="p-3">Marks</th><th className="p-3">Rank (normal paper)</th><th className="p-3">Rank (tough paper)</th></tr>
          </thead>
          <tbody>
            {TABLE_MARKS.map((mk) => {
              const r = estimateRank(mk);
              return (
                <tr key={mk} className="border-t border-ink/10 dark:border-paper/10">
                  <td className="p-3 font-semibold">{mk}</td>
                  <td className="p-3">{fmtRank(r.normal)}</td>
                  <td className="p-3">{fmtRank(r.tough)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-sm mt-4">Already have your answer key? Use the <Link to="/neet-score-calculator" className="text-rise-dark font-semibold underline">NEET score calculator</Link> to work out your marks first, or see <Link to="/neet-cutoff" className="text-rise-dark font-semibold underline">state-wise NEET cutoffs</Link>.</p>

      <h2 className="font-display text-2xl font-bold mt-12">Frequently asked questions</h2>
      <div className="mt-4 space-y-3">
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
