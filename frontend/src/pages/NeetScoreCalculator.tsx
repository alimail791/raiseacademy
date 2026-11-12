import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calculator, CheckCircle2, ClipboardPaste, Share2, Sparkles } from "lucide-react";
import {
  NEET_SECTIONS, TOTAL_QS, PUBLISHED_KEYS, parseKeyText, parseResponses, scoreResponses, scoreCounts,
  estimateRank, fmtRank, QUALIFY_GENERAL, QUALIFY_RESERVED, type AnswerKey, type ScoreResult,
} from "../score/scoring";

// NEET answer-key score calculator → expected rank → College Predictor.
// Works fully in the browser. Official keys go into PUBLISHED_KEYS (score/scoring.ts)
// on the day NTA releases them; until then students can paste a key or use quick mode.
const STORE = "neet_score_calc_v1";
const OPT = ["1", "2", "3", "4"];

const FAQS = [
  ["How is the NEET score calculated?", "Each correct answer gets +4, each wrong answer −1 and each unattempted question 0. There are 180 questions, so the maximum is 720. If NTA drops a question, everyone gets +4 for it."],
  ["Where do I get my responses?", "After the exam, NTA shows your recorded responses (OMR) on neet.nta.nic.in along with the provisional answer key. Copy your answers in order, or tap them in one by one here."],
  ["How accurate is the expected rank?", "It's an estimate from the last two NEET results: Re-NEET 2026 (a normal paper) and NEET 2025 (a tough paper, topper 686). Your real rank depends on how hard the 2027 paper is and how many students take it."],
  ["Is my data saved?", "Your answers stay in this browser only, so you don't lose them if you close the page. Nothing is sent to our server."],
];

const track = (event: string, params: Record<string, unknown> = {}) => {
  try { (window as any).gtag?.("event", event, params); } catch { /* analytics only */ }
};

function demoKey(): AnswerKey {
  const answers = Array.from({ length: TOTAL_QS }, (_, i) => [((i * 7 + 3) % 4) + 1]);
  return { id: "demo", label: "Demo key (not a real NEET paper)", status: "practice", sections: NEET_SECTIONS, answers };
}

export default function NeetScoreCalculator() {
  const [mode, setMode] = useState<"key" | "quick">("key");
  const [keyId, setKeyId] = useState(PUBLISHED_KEYS[0]?.id || "paste");
  const [keyText, setKeyText] = useState("");
  const [demo, setDemo] = useState<AnswerKey | null>(null);
  const [resp, setResp] = useState<(number | null)[]>(() => new Array(TOTAL_QS).fill(null));
  const [respText, setRespText] = useState("");
  const [entry, setEntry] = useState<"tap" | "type">("tap");
  const [openSec, setOpenSec] = useState(0);
  const [counts, setCounts] = useState(() => NEET_SECTIONS.map((s) => ({ name: s.name, correct: "", wrong: "", total: s.to - s.from + 1 })));
  const [result, setResult] = useState<ScoreResult | null>(null);

  // Restore / save work in progress (this browser only).
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORE) || "null");
      if (s?.resp?.length === TOTAL_QS) setResp(s.resp);
      if (typeof s?.keyText === "string") setKeyText(s.keyText);
    } catch { /* storage blocked */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORE, JSON.stringify({ resp, keyText })); } catch { /* storage blocked */ }
  }, [resp, keyText]);

  const pasted = useMemo(() => (keyText.trim() ? parseKeyText(keyText) : null), [keyText]);
  const key: AnswerKey | null = demo
    ? demo
    : keyId === "paste"
      ? pasted && pasted.found >= 150 ? { id: "paste", label: "Pasted key", status: "provisional", sections: NEET_SECTIONS, answers: pasted.answers } : null
      : PUBLISHED_KEYS.find((k) => k.id === keyId) || null;

  const answered = resp.filter((x) => x != null).length;

  const setAnswer = (q: number, v: number | null) => setResp((r) => { const n = [...r]; n[q] = n[q] === v ? null : v; return n; });
  const onType = (t: string) => { setRespText(t); setResp(parseResponses(t)); };

  const loadDemo = () => {
    const k = demoKey();
    setDemo(k);
    // ~80% right, some wrong, some skipped — just to see the calculator work.
    setResp(k.answers.map((a, i) => (i % 9 === 0 ? null : i % 6 === 0 ? (((a as number[])[0] % 4) + 1) : (a as number[])[0])));
    setResult(null);
  };

  const calculate = () => {
    let r: ScoreResult;
    if (mode === "quick") {
      r = scoreCounts(counts.map((c) => ({ name: c.name, correct: Math.max(0, +c.correct || 0), wrong: Math.max(0, +c.wrong || 0), total: c.total })));
    } else {
      if (!key) return;
      r = scoreResponses(key, resp);
    }
    setResult(r);
    track("score_calc", { mode, score: r.score });
    setTimeout(() => document.getElementById("sc-result")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const quickError = counts.find((c) => (+c.correct || 0) + (+c.wrong || 0) > c.total);
  const rank = result ? estimateRank(result.score) : null;
  const shareText = result
    ? `My expected NEET score is ${result.score}/720 (expected AIR ~${fmtRank(rank?.normal ?? null)}). Calculate yours free: https://www.yneet.in/neet-score-calculator`
    : "";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight">NEET Score Calculator 2027</h1>
      <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg">Match your answers with the NEET answer key, get your score out of 720 subject by subject, your expected All India Rank and the colleges it can get you. Free, no login.</p>

      <div className="mt-6 inline-flex rounded-full border border-ink/15 dark:border-paper/20 p-1">
        {([["key", "Match with answer key"], ["quick", "Quick: I know my counts"]] as const).map(([m, l]) => (
          <button key={m} onClick={() => { setMode(m); setResult(null); }} className={`px-4 py-2 rounded-full text-sm font-semibold ${mode === m ? "bg-ink text-paper" : ""}`}>{l}</button>
        ))}
      </div>

      {mode === "key" ? (
        <>
          {/* Step 1: key */}
          <h2 className="font-display text-xl font-bold mt-8">1. Answer key</h2>
          <div className="mt-3 rounded-2xl border border-ink/10 dark:border-paper/15 p-5">
            {demo ? (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm"><b>Using the demo key</b> with sample answers filled in — not a real paper.</p>
                <button onClick={() => { setDemo(null); setResp(new Array(TOTAL_QS).fill(null)); setResult(null); }} className="text-sm underline">Clear demo</button>
              </div>
            ) : (
              <>
                <select className="cp-in !mt-0" value={keyId} onChange={(e) => { setKeyId(e.target.value); setResult(null); }}>
                  {PUBLISHED_KEYS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
                  <option value="paste">Paste the answer key myself</option>
                </select>
                {!PUBLISHED_KEYS.length && (
                  <p className="text-sm text-ink/65 dark:text-paper/65 mt-2">The official NEET 2027 answer key will be added here the day NTA releases it (expected May 2027). For now, paste a key or try the demo.</p>
                )}
                {keyId === "paste" && (
                  <>
                    <textarea value={keyText} onChange={(e) => { setKeyText(e.target.value); setResult(null); }} rows={4}
                      placeholder={"Paste from the NTA answer key PDF, e.g.\n1 3  2 1  3 4  4 2 ...\n(question number, then the correct option)"}
                      className="cp-in font-mono text-sm" />
                    {pasted && (
                      <p className={`text-sm mt-2 ${pasted.found >= 150 ? "text-rise-dark" : "text-red-600"}`}>
                        {pasted.found >= 150 ? `✅ Read answers for ${pasted.found} of ${TOTAL_QS} questions` : `Only ${pasted.found} answers found — paste the full key for your booklet code.`}
                        {pasted.found >= 150 && pasted.found < TOTAL_QS && " (missing ones count as dropped)"}
                      </p>
                    )}
                  </>
                )}
                <button onClick={loadDemo} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-rise-dark"><Sparkles size={14} /> Try it with a demo paper</button>
              </>
            )}
          </div>

          {/* Step 2: responses */}
          <div className="flex items-end justify-between mt-8 gap-3 flex-wrap">
            <h2 className="font-display text-xl font-bold">2. Your answers</h2>
            <span className="text-sm font-semibold">{answered}/{TOTAL_QS} answered</span>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => setEntry("tap")} className={`px-4 py-2 rounded-full text-sm font-semibold border ${entry === "tap" ? "bg-ink text-paper border-ink" : "border-ink/15 dark:border-paper/20"}`}>Tap answers</button>
            <button onClick={() => { setEntry("type"); setRespText(resp.map((x) => (x ? String(x) : "-")).join("")); }} className={`px-4 py-2 rounded-full text-sm font-semibold border inline-flex items-center gap-1 ${entry === "type" ? "bg-ink text-paper border-ink" : "border-ink/15 dark:border-paper/20"}`}><ClipboardPaste size={14} /> Type / paste</button>
          </div>

          {entry === "type" ? (
            <div className="mt-3">
              <textarea value={respText} onChange={(e) => onType(e.target.value)} rows={5} className="cp-in font-mono text-sm"
                placeholder="Your answers in order, Q1 to Q180. Use 1-4 (or A-D) and - for questions you skipped. Spaces are ignored. Example: 3 1 - 4 2 2 ..." />
              <p className="text-xs text-ink/60 dark:text-paper/60 mt-1">Tip: type in groups of 5 with a space, e.g. "31-42 2134- ...", so it's easy to check.</p>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {NEET_SECTIONS.map((s, si) => {
                const done = resp.slice(s.from - 1, s.to).filter((x) => x != null).length;
                return (
                  <div key={s.name} className="rounded-2xl border border-ink/10 dark:border-paper/15 overflow-hidden">
                    <button onClick={() => setOpenSec(openSec === si ? -1 : si)} className="w-full flex justify-between items-center p-4 font-semibold">
                      <span>{s.name} <span className="text-ink/50 dark:text-paper/50 font-normal">Q{s.from}–{s.to}</span></span>
                      <span className="text-sm">{done}/{s.to - s.from + 1} {openSec === si ? "▴" : "▾"}</span>
                    </button>
                    {openSec === si && (
                      <div className="px-3 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                        {Array.from({ length: s.to - s.from + 1 }, (_, i) => s.from - 1 + i).map((q) => (
                          <div key={q} className="flex items-center gap-2 py-1 border-b border-ink/5 dark:border-paper/5">
                            <span className="w-10 text-sm text-ink/60 dark:text-paper/60">Q{q + 1}</span>
                            {OPT.map((o, oi) => (
                              <button key={o} onClick={() => setAnswer(q, oi + 1)} aria-label={`Q${q + 1} option ${o}`}
                                className={`w-9 h-9 rounded-full text-sm font-semibold border ${resp[q] === oi + 1 ? "bg-ink text-paper border-ink" : "border-ink/20 dark:border-paper/25"}`}>{o}</button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <p className="text-xs text-ink/60 dark:text-paper/60">Tap an option again to clear it. Your answers are saved in this browser.</p>
            </div>
          )}
        </>
      ) : (
        <div className="mt-8 rounded-2xl border border-ink/10 dark:border-paper/15 p-5">
          <p className="text-sm text-ink/65 dark:text-paper/65 mb-3">Already compared with the key? Enter how many you got right and wrong in each section.</p>
          <div className="grid grid-cols-[1fr_5rem_5rem] gap-2 items-center text-sm">
            <span className="font-semibold">Section</span><span className="font-semibold">Correct</span><span className="font-semibold">Wrong</span>
            {counts.map((c, i) => (
              <div key={c.name} className="contents">
                <span>{c.name} <span className="text-ink/50 dark:text-paper/50">/ {c.total}</span></span>
                {(["correct", "wrong"] as const).map((f) => (
                  <input key={f} inputMode="numeric" className="cp-in !mt-0 !px-3" value={c[f]}
                    onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 2); setCounts((cs) => cs.map((x, j) => (j === i ? { ...x, [f]: v } : x))); setResult(null); }} />
                ))}
              </div>
            ))}
          </div>
          {quickError && <p className="text-sm text-red-600 mt-2">{quickError.name}: correct + wrong can't be more than {quickError.total}.</p>}
        </div>
      )}

      <button onClick={calculate} disabled={mode === "key" ? !key || answered === 0 : !!quickError}
        className="mt-6 inline-flex items-center gap-2 bg-gold text-ink font-semibold px-7 py-3.5 rounded-full disabled:opacity-50">
        <Calculator size={18} /> Calculate my score
      </button>
      {mode === "key" && !key && <p className="text-sm text-ink/60 dark:text-paper/60 mt-2">Add an answer key first (step 1).</p>}

      {/* Result */}
      {result && rank && (
        <div id="sc-result" className="mt-10 space-y-4">
          <div className="rounded-2xl bg-ink text-paper p-6">
            <p className="text-paper/70 text-sm">Your expected NEET score</p>
            <p className="font-display text-5xl font-bold mt-1">{result.score}<span className="text-2xl text-paper/60"> / {result.max}</span></p>
            <p className="text-paper/70 text-sm mt-2">{result.correct} correct · {result.wrong} wrong · {result.skipped} skipped</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-ink/10 dark:border-paper/15">
            <table className="w-full text-sm">
              <thead><tr className="bg-ink/[0.04] dark:bg-paper/5"><th className="text-left p-2 sm:p-3">Section</th><th className="p-2 sm:p-3">Right</th><th className="p-2 sm:p-3">Wrong</th><th className="p-2 sm:p-3">Skip</th><th className="p-2 sm:p-3 text-right">Marks</th></tr></thead>
              <tbody>
                {result.sections.map((s) => (
                  <tr key={s.name} className="border-t border-ink/10 dark:border-paper/10 text-center">
                    <td className="p-2 sm:p-3 text-left font-semibold">{s.name}</td><td className="p-2 sm:p-3">{s.correct + s.bonus}</td><td className="p-2 sm:p-3">{s.wrong}</td><td className="p-2 sm:p-3">{s.skipped}</td><td className="p-2 sm:p-3 text-right font-bold whitespace-nowrap">{s.marks}<span className="text-ink/45 dark:text-paper/45 font-normal">/{s.total * 4}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.wrong > 0 && <p className="text-sm text-ink/65 dark:text-paper/65">Negative marking cost you <b>{result.wrong} marks</b>. Skipping those you weren't sure of would have scored {result.score + result.wrong}.</p>}

          <div className="rounded-2xl border border-ink/10 dark:border-paper/15 p-5">
            <p className="font-display text-lg font-bold">Expected All India Rank</p>
            {rank.normal == null ? (
              <p className="mt-2 text-sm">This score is below the usual qualifying marks (about {QUALIFY_GENERAL} for General, {QUALIFY_RESERVED} for SC/ST/OBC in NEET 2025).</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <div className="rounded-xl bg-rise/10 p-4">
                  <p className="text-sm text-ink/65 dark:text-paper/65">If the paper is like 2026</p>
                  <p className="font-display text-2xl font-bold">AIR ~{fmtRank(rank.normal)}</p>
                </div>
                <div className="rounded-xl bg-ink/[0.04] dark:bg-paper/5 p-4">
                  <p className="text-sm text-ink/65 dark:text-paper/65">If it's tough like 2025</p>
                  <p className="font-display text-2xl font-bold">AIR ~{fmtRank(rank.tough)}</p>
                </div>
              </div>
            )}
            <p className="text-xs text-ink/55 dark:text-paper/55 mt-3">Estimate from official Re-NEET 2026 and NEET 2025 results. Your real rank comes with the NTA result.</p>
          </div>

          {rank.normal != null && (
            <div className="rounded-2xl bg-rise-line text-paper p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-display text-xl font-bold">Which colleges can AIR ~{fmtRank(rank.normal)} get?</p>
                <p className="text-paper/80 text-sm mt-1">MBBS & BDS under All India and your state quota, from last year's closing ranks.</p>
              </div>
              <Link to={`/neet-college-predictor?air=${rank.normal}`} onClick={() => track("score_calc_to_predictor")} className="inline-flex items-center gap-2 bg-gold text-ink font-semibold px-5 py-3 rounded-full">See my colleges <ArrowRight size={16} /></Link>
            </div>
          )}

          <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" onClick={() => track("score_calc_share")}
            className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold px-5 py-2.5 rounded-full"><Share2 size={16} /> Share on WhatsApp</a>

          <div className="rounded-2xl bg-gold/15 border border-gold/40 p-6">
            <p className="font-display text-xl font-bold">{rank.normal != null && rank.normal < 25000 ? "Great score — lock it in with counselling help" : "Want a better score next time?"}</p>
            <p className="text-sm text-ink/70 dark:text-paper/70 mt-1">YNeet's chapter-priority plan shows exactly which chapters cost you marks, with 1,200+ tests and full mocks. 30 days free.</p>
            <Link to="/register" className="mt-4 inline-flex items-center gap-2 bg-gold text-ink font-semibold px-6 py-3 rounded-full hover:bg-gold-dark">Start free <ArrowRight size={16} /></Link>
            <p className="web-only text-sm text-ink/70 dark:text-paper/70 mt-3">Repeating NEET? Compare <Link to="/courses" className="text-rise-dark font-semibold underline">YNeet's NEET coaching plans for droppers</Link>.</p>
          </div>
        </div>
      )}

      <h2 className="font-display text-2xl font-bold mt-12">NEET marking scheme</h2>
      <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-sm">
        <li className="rounded-xl bg-rise/10 p-3 flex gap-2"><CheckCircle2 size={16} className="text-rise mt-0.5" /><span><b>+4</b> for each correct answer</span></li>
        <li className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3"><b>−1</b> for each wrong answer</li>
        <li className="rounded-xl bg-ink/[0.04] dark:bg-paper/5 p-3"><b>0</b> for a question you skip</li>
        <li className="rounded-xl bg-ink/[0.04] dark:bg-paper/5 p-3"><b>+4 to everyone</b> if NTA drops a question</li>
      </ul>

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
