import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight, Check, Clock, Share2, Download, Target, X, RotateCcw } from "lucide-react";
import { YNEET_API } from "../practice/practiceData";
import { gamesLink, SITE } from "../utils/siteInfo";

// Free "NEET Readiness Score" quiz — 15 questions, no login. Built to be shared:
// the result screen makes a score card for WhatsApp/Instagram status, and every
// weak chapter links to its free PYQ page. Registration (30 days free) is the
// next step, never a paywall in front of the result.

type Q = {
  id: string; subject: "Physics" | "Chemistry" | "Biology"; chapter: string; slug: string;
  question: string; options: string[]; answer: number; explanation: string; pyqYear: number | null;
};

const LETTERS = ["A", "B", "C", "D"];
const SUBJECTS = ["Physics", "Chemistry", "Biology"] as const;
const PAGE_URL = "www.yneet.in/neet-readiness";

const track = (event: string, params: Record<string, unknown> = {}) => {
  try { (window as any).gtag?.("event", event, params); } catch { /* analytics only */ }
};

// NEET marking: +4 right, −1 wrong, 0 skipped. Score = share of the maximum, out of 100.
function scoreOf(qs: Q[], ans: Record<string, number>) {
  let right = 0, wrong = 0;
  const bySubject: Record<string, { right: number; total: number }> = {};
  for (const q of qs) {
    const s = (bySubject[q.subject] ||= { right: 0, total: 0 });
    s.total++;
    if (ans[q.id] === undefined) continue;
    if (ans[q.id] === q.answer) { right++; s.right++; } else wrong++;
  }
  const score = qs.length ? Math.max(0, Math.round(((4 * right - wrong) / (4 * qs.length)) * 100)) : 0;
  return { right, wrong, skipped: qs.length - right - wrong, score, bySubject };
}

function band(score: number) {
  if (score >= 75) return { label: "Exam-ready", note: "Strong base. Full-length mocks will sharpen your speed and accuracy now." };
  if (score >= 50) return { label: "On track", note: "Good foundation. Fix the weak chapters below and your score climbs fast." };
  if (score >= 25) return { label: "Building up", note: "The basics are there. Daily chapter practice on your weak chapters will move this quickly." };
  return { label: "Just starting", note: "Everyone starts somewhere. Begin with NCERT-level chapter practice, one chapter a day." };
}

// 1080×1350 score card for status / stories.
async function makeCard(score: number, label: string, subj: Record<string, { right: number; total: number }>): Promise<Blob | null> {
  const c = document.createElement("canvas");
  c.width = 1080; c.height = 1350;
  const g = c.getContext("2d");
  if (!g) return null;
  const grad = g.createLinearGradient(0, 0, 1080, 1350);
  grad.addColorStop(0, "#14213D"); grad.addColorStop(0.65, "#1F3059"); grad.addColorStop(1, "#0C8577");
  g.fillStyle = grad; g.fillRect(0, 0, 1080, 1350);
  const font = (w: number, px: number) => `${w} ${px}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  g.textAlign = "center";
  g.fillStyle = "#F2A93B"; g.font = font(800, 56); g.fillText("YNeet", 540, 130);
  g.fillStyle = "#FBFAF7"; g.font = font(700, 54); g.fillText("My NEET Readiness Score", 540, 250);
  // ring
  g.lineWidth = 34; g.lineCap = "round";
  g.strokeStyle = "rgba(251,250,247,0.15)"; g.beginPath(); g.arc(540, 560, 210, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = "#F2A93B"; g.beginPath(); g.arc(540, 560, 210, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * score) / 100); g.stroke();
  g.fillStyle = "#FBFAF7"; g.font = font(800, 170); g.fillText(String(score), 540, 610);
  g.font = font(600, 44); g.fillStyle = "rgba(251,250,247,0.7)"; g.fillText("out of 100", 540, 680);
  g.fillStyle = "#3FD0BD"; g.font = font(800, 58); g.fillText(label, 540, 870);
  // subject bars
  SUBJECTS.forEach((s, i) => {
    const y = 960 + i * 80, d = subj[s] || { right: 0, total: 0 };
    g.textAlign = "left"; g.fillStyle = "#FBFAF7"; g.font = font(600, 38); g.fillText(s, 150, y + 12);
    g.fillStyle = "rgba(251,250,247,0.15)"; g.fillRect(470, y - 14, 360, 28);
    g.fillStyle = "#F2A93B"; g.fillRect(470, y - 14, d.total ? (360 * d.right) / d.total : 0, 28);
    g.textAlign = "right"; g.fillStyle = "#FBFAF7"; g.fillText(`${d.right}/${d.total}`, 940, y + 12);
  });
  g.textAlign = "center"; g.fillStyle = "#FBFAF7"; g.font = font(700, 40);
  g.fillText(`Check yours free → ${PAGE_URL}`, 540, 1270);
  return new Promise((r) => c.toBlob((b) => r(b), "image/png"));
}

const NeetReadiness = () => {
  const [stage, setStage] = useState<"intro" | "quiz" | "result">("intro");
  const [qs, setQs] = useState<Q[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [i, setI] = useState(0);
  const [ans, setAns] = useState<Record<string, number>>({});
  const [started, setStarted] = useState(0);
  const [secs, setSecs] = useState(0);
  const [review, setReview] = useState(false);

  useEffect(() => {
    if (stage !== "quiz") return;
    const t = setInterval(() => setSecs(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(t);
  }, [stage, started]);

  const start = async () => {
    setLoading(true); setError("");
    try {
      const r = await axios.get(`${YNEET_API}/public/readiness`);
      const list: Q[] = r.data.questions || [];
      if (!list.length) throw new Error("empty");
      setQs(list); setAns({}); setI(0); setReview(false);
      setStarted(Date.now()); setSecs(0); setStage("quiz");
      track("readiness_start");
      window.scrollTo({ top: 0 });
    } catch {
      setError("Couldn't load the test right now. Please try again in a minute.");
    } finally { setLoading(false); }
  };

  const finish = () => {
    setStage("result");
    const s = scoreOf(qs, ans);
    track("readiness_complete", { score: s.score });
    try { (window as any).fbq?.("track", "Lead", { content_name: "NEET Readiness Score" }); } catch { /* analytics only */ }
    window.scrollTo({ top: 0 });
  };

  const result = useMemo(() => scoreOf(qs, ans), [qs, ans]);
  const b = band(result.score);
  const weak = qs.filter((q) => ans[q.id] !== q.answer);
  const shareText = `I scored ${result.score}/100 on the NEET Readiness Test (${b.label}). 15 questions, 5 minutes, free. Check yours: https://${PAGE_URL}`;

  const shareCard = async () => {
    track("readiness_share", { method: "card" });
    const blob = await makeCard(result.score, b.label, result.bySubject);
    if (!blob) return;
    const file = new File([blob], "neet-readiness-score.png", { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try { await nav.share({ files: [file], text: shareText }); return; } catch { /* cancelled */ }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  // ---------- Intro (this is what Google and ad visitors see first) ----------
  if (stage === "intro") {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <span className="inline-block text-xs font-bold uppercase tracking-wider bg-gold/20 text-ink dark:text-paper px-3 py-1 rounded-full">Free · No login · 5 minutes</span>
        <h1 className="font-display text-3xl sm:text-5xl font-bold leading-tight mt-4">What's your NEET Readiness Score?</h1>
        <p className="text-lg text-ink/70 dark:text-paper/70 mt-4">
          15 real NEET-level questions from Physics, Chemistry and Biology, marked the NEET way (+4 / −1). Get your score out of 100, see your weak chapters, and share your score card with friends.
        </p>
        <button onClick={start} disabled={loading}
          className="mt-8 inline-flex items-center gap-2 bg-gold text-ink font-bold text-lg px-8 py-4 rounded-full hover:bg-gold-dark disabled:opacity-60">
          {loading ? "Loading…" : <>Start the free test <ArrowRight size={20} /></>}
        </button>
        {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}

        <ul className="mt-10 grid sm:grid-cols-3 gap-4">
          {[
            ["15 questions", "4 Physics, 4 Chemistry, 7 Biology — the same balance as the NEET paper, many from previous years."],
            ["Instant score", "Your readiness out of 100, subject-wise results and the chapters to work on first."],
            ["Score card", "Download or share your score card on WhatsApp status and challenge your friends."],
          ].map(([t, d]) => (
            <li key={t} className="p-5 rounded-2xl border border-ink/10 dark:border-paper/15">
              <p className="font-display font-bold text-lg">{t}</p>
              <p className="text-sm text-ink/65 dark:text-paper/65 mt-1">{d}</p>
            </li>
          ))}
        </ul>

        <section className="mt-12 text-ink/75 dark:text-paper/75 space-y-3">
          <h2 className="font-display text-2xl font-bold text-ink dark:text-paper">How the score works</h2>
          <p>Each correct answer gets +4, each wrong answer −1 and a skipped question 0, just like NEET. Your score is the share of the maximum 60 marks, shown out of 100. Skip a question if you're unsure: guessing costs marks here too.</p>
          <p>This is a quick check, not a full mock. For a real picture, take full-length NEET mock tests with a timer. All of them are free for 30 days on YNeet.</p>
          <p>Want to practise first? Try the <Link to="/neet-practice" className="text-rise-dark font-semibold underline">free chapter-wise NEET PYQs</Link>.</p>
        </section>
      </div>
    );
  }

  // ---------- Quiz ----------
  if (stage === "quiz") {
    const q = qs[i];
    const picked = ans[q.id];
    const last = i === qs.length - 1;
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between text-sm text-ink/60 dark:text-paper/60">
          <span>Question {i + 1} of {qs.length} · <b className="text-ink dark:text-paper">{q.subject}</b></span>
          <span className="inline-flex items-center gap-1"><Clock size={14} /> {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}</span>
        </div>
        <div className="h-2 bg-ink/10 dark:bg-paper/10 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-gold transition-all" style={{ width: `${((i + 1) / qs.length) * 100}%` }} />
        </div>

        <div className="mt-6 p-5 rounded-2xl border border-ink/10 dark:border-paper/15">
          {q.pyqYear && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gold/20">NEET {q.pyqYear}</span>}
          <p className="mt-2 font-medium text-lg whitespace-pre-line">{q.question}</p>
          <ul className="mt-4 space-y-2">
            {q.options.map((o, k) => (
              <li key={k}>
                <button onClick={() => setAns((a) => ({ ...a, [q.id]: k + 1 }))}
                  className={`w-full text-left flex gap-3 px-4 py-3 rounded-xl border transition ${picked === k + 1 ? "border-gold bg-gold/15 font-semibold" : "border-ink/15 dark:border-paper/15 hover:border-gold/60"}`}>
                  <b>{LETTERS[k]}.</b> <span className="whitespace-pre-line">{o}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 flex items-center gap-3">
          {i > 0 && <button onClick={() => setI(i - 1)} className="px-5 py-3 rounded-full border border-ink/20 dark:border-paper/20 font-semibold">Back</button>}
          {picked === undefined && !last && <button onClick={() => setI(i + 1)} className="px-5 py-3 rounded-full text-ink/60 dark:text-paper/60 font-semibold">Skip</button>}
          <button onClick={() => (last ? finish() : setI(i + 1))}
            className="ml-auto inline-flex items-center gap-2 bg-ink text-paper dark:bg-gold dark:text-ink px-6 py-3 rounded-full font-bold">
            {last ? "See my score" : "Next"} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ---------- Result ----------
  const weakChapters = [...new Map(weak.map((q) => [q.slug, q])).values()];
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="rounded-3xl bg-rise-line text-paper p-7 sm:p-10 text-center">
        <p className="text-paper/70 font-semibold">Your NEET Readiness Score</p>
        <p className="font-display text-7xl sm:text-8xl font-bold mt-2">{result.score}<span className="text-3xl text-paper/60">/100</span></p>
        <p className="text-2xl font-bold text-gold mt-2">{b.label}</p>
        <p className="text-paper/80 mt-2 max-w-md mx-auto">{b.note}</p>
        <p className="text-sm text-paper/60 mt-3">{result.right} right · {result.wrong} wrong · {result.skipped} skipped · {Math.floor(secs / 60)} min {secs % 60} s</p>
        <div className="mt-6 grid grid-cols-3 gap-3 max-w-md mx-auto">
          {SUBJECTS.map((s) => {
            const d = result.bySubject[s] || { right: 0, total: 0 };
            return (
              <div key={s} className="rounded-xl bg-paper/10 p-3">
                <p className="text-xs text-paper/70">{s}</p>
                <p className="text-xl font-bold">{d.right}/{d.total}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"
            onClick={() => track("readiness_share", { method: "whatsapp" })}
            className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold px-5 py-3 rounded-full">
            <Share2 size={18} /> Challenge friends on WhatsApp
          </a>
          <button onClick={shareCard} className="inline-flex items-center gap-2 bg-paper text-ink font-bold px-5 py-3 rounded-full">
            <Download size={18} /> Score card for status
          </button>
        </div>
      </div>

      <div className="my-8 rounded-2xl bg-gold/15 border border-gold/40 p-6">
        <p className="font-display text-xl font-bold">Raise this score with 30 days of free practice</p>
        <p className="text-sm text-ink/70 dark:text-paper/70 mt-1">Timed chapter tests for your weak chapters, 1,200+ NEET tests, full mocks with rank, and a mistake notebook. Free for 30 days. No payment, no card.</p>
        <Link to="/register" onClick={() => track("readiness_register_click")}
          className="mt-4 inline-flex items-center gap-2 bg-gold text-ink font-semibold px-6 py-3 rounded-full hover:bg-gold-dark">
          Start free for 30 days <ArrowRight size={16} />
        </Link>
      </div>

      {weakChapters.length > 0 && (
        <section>
          <h2 className="font-display text-2xl font-bold flex items-center gap-2"><Target size={22} className="text-gold-dark" /> Chapters to work on</h2>
          <p className="text-sm text-ink/60 dark:text-paper/60 mt-1">You missed or skipped a question from each of these. Each has free PYQs with answers.</p>
          <ul className="mt-4 grid sm:grid-cols-2 gap-2">
            {weakChapters.map((q) => (
              <li key={q.slug}>
                <Link to={`/neet-practice/${q.slug}`} className="flex items-center justify-between gap-2 p-3 rounded-xl border border-ink/10 dark:border-paper/15 hover:border-gold">
                  <span><span className="text-xs text-ink/50 dark:text-paper/50">{q.subject}</span><br /><b>{q.chapter}</b></span>
                  <ArrowRight size={16} className="text-rise-dark shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <button onClick={() => setReview(!review)} className="font-display text-xl font-bold underline">
          {review ? "Hide" : "Show"} answers and explanations
        </button>
        {review && (
          <ol className="mt-4 space-y-4">
            {qs.map((q, n) => {
              const mine = ans[q.id];
              return (
                <li key={q.id} className="p-4 rounded-2xl border border-ink/10 dark:border-paper/15">
                  <p className="text-xs font-semibold text-ink/50 dark:text-paper/50">Q{n + 1} · {q.subject} · {q.chapter}</p>
                  <p className="mt-1 font-medium whitespace-pre-line">{q.question}</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {q.options.map((o, k) => {
                      const right = q.answer === k + 1, mineWrong = mine === k + 1 && !right;
                      return (
                        <li key={k} className={`flex gap-2 px-3 py-1.5 rounded-lg border ${right ? "border-rise bg-rise/10" : mineWrong ? "border-red-400 bg-red-50 dark:bg-red-900/20" : "border-ink/10 dark:border-paper/10"}`}>
                          <b>{LETTERS[k]}.</b> <span className="whitespace-pre-line">{o}</span>
                          {right && <Check size={15} className="ml-auto text-rise-dark shrink-0" />}
                          {mineWrong && <X size={15} className="ml-auto text-red-500 shrink-0" />}
                        </li>
                      );
                    })}
                  </ul>
                  {mine === undefined && <p className="text-xs mt-1 text-ink/50 dark:text-paper/50">Skipped</p>}
                  {q.explanation && <p className="mt-2 text-sm text-ink/70 dark:text-paper/70 whitespace-pre-line">{q.explanation}</p>}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
        <button onClick={start} className="inline-flex items-center gap-2 font-semibold text-rise-dark">
          <RotateCcw size={16} /> Take a new set of 15 questions
        </button>
        <a href={gamesLink("readiness")} target="_blank" rel="noopener noreferrer" onClick={() => track("readiness_games_click")}
          className="inline-flex items-center gap-2 font-semibold text-rise-dark">
          🧩 Keep a daily streak: play today's 5 NEET puzzles
        </a>
        {SITE.whatsappChannel && (
          <a href={SITE.whatsappChannel} target="_blank" rel="noopener noreferrer" onClick={() => track("readiness_channel_click")}
            className="inline-flex items-center gap-2 font-semibold text-rise-dark">
            📲 Get one NEET question daily on WhatsApp
          </a>
        )}
      </div>
    </div>
  );
};

export default NeetReadiness;
