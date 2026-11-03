import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight } from "lucide-react";
import { YNEET_API } from "../practice/practiceData";

// 60-Second Sprint on the website: anyone can play YESTERDAY's NEET Sprint
// (5 quick questions, 60 seconds, no login). Today's ranked Sprint is in the
// YNeet app, so the result screen invites visitors to sign up and compete.

type Q = { id: string; subject: string; chapter: string; text: string; options: string[]; answer: number; explanation: string };
type Data = { day: string; stats: { players: number; avg: number; perfect: number }; questions: Q[] };

const LIMIT = 60000;
const track = (e: string, p: Record<string, unknown> = {}) => { try { (window as any).gtag?.("event", e, p); } catch { /* analytics only */ } };

const NeetSprint = () => {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [picks, setPicks] = useState<number[]>([]);
  const [start, setStart] = useState(0);
  const [now, setNow] = useState(0);
  const [took, setTook] = useState(0);
  const timer = useRef<number | null>(null);
  const picksRef = useRef<number[]>([]);

  useEffect(() => {
    axios.get(`${YNEET_API}/public/sprint/yesterday`).then((r) => setData(r.data)).catch(() => setError(true));
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, []);

  const finish = (final: number[], t0 = start) => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    picksRef.current = final;
    setPicks(final);
    setTook(Math.min(Date.now() - t0, LIMIT));
    setPhase("done");
    track("web_sprint_finish", { score: final.filter((p, i) => data && p === data.questions[i].answer).length });
  };

  const begin = () => {
    const t0 = Date.now();
    picksRef.current = [];
    setStart(t0); setNow(t0); setPicks([]); setPhase("play");
    track("web_sprint_start");
    timer.current = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t - t0 >= LIMIT) finish(picksRef.current, t0);
    }, 250);
  };

  const pick = (k: number) => {
    if (phase !== "play") return;
    const next = [...picksRef.current, k];
    picksRef.current = next;
    if (data && next.length >= data.questions.length) finish(next);
    else setPicks(next);
  };

  const left = Math.max(0, LIMIT - (now - start));
  const score = data ? picks.filter((p, i) => p === data.questions[i].answer).length : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm">Free · No login</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">NEET 60-Second Sprint</h1>

      {error && <p className="mt-8 text-ink/70">Couldn't load the Sprint. Please try again later.</p>}
      {!data && !error && <p className="mt-8 text-ink/50">Loading…</p>}

      {data && phase === "intro" && (
        <div className="mt-6 space-y-5">
          <p className="text-ink/70 text-lg leading-relaxed">5 quick NEET questions. 60 seconds. Tap an answer and the next one appears, with no going back. This is yesterday's Sprint from the YNeet app.</p>
          {data.stats.players > 0 && (
            <p className="rounded-2xl bg-gold/15 px-5 py-4 text-ink/80">
              <b>{data.stats.players}</b> YNeet students played it. Average score: <b>{data.stats.avg}/5</b>{data.stats.perfect > 0 ? `, and ${data.stats.perfect} got 5/5` : ""}. Can you beat that?
            </p>
          )}
          <button onClick={begin} className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-[#3b2fc9] text-white font-bold text-lg px-8 py-4 rounded-full hover:opacity-95">
            Start, the clock begins <ArrowRight size={18} />
          </button>
        </div>
      )}

      {data && phase === "play" && (() => {
        const i = Math.min(picks.length, data.questions.length - 1);
        const q = data.questions[i];
        return (
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink/60">Question {i + 1} of 5 · {q.subject}</span>
              <span className={`min-w-[64px] text-center rounded-full px-4 py-2 font-bold text-lg ${left <= 10000 ? "bg-gold text-ink" : "bg-[#3b2fc9] text-white"}`}>{Math.ceil(left / 1000)}s</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-ink/10 overflow-hidden"><div className="h-2 bg-gold transition-all" style={{ width: `${(left / LIMIT) * 100}%` }} /></div>
            <p className="mt-6 text-xl font-semibold leading-snug min-h-[84px]">{q.text}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {q.options.map((o, k) => (
                <button key={k} onClick={() => pick(k)} className="min-h-[68px] rounded-2xl border-2 border-ink/15 bg-white px-3 font-semibold hover:border-[#3b2fc9]">{o}</button>
              ))}
            </div>
          </div>
        );
      })()}

      {data && phase === "done" && (
        <div className="mt-6 space-y-6">
          <div className="rounded-3xl bg-[#3b2fc9] text-white p-7 text-center">
            <p className="text-indigo-200 font-semibold">{picks.length < 5 ? "Time's up!" : "Sprint complete"}</p>
            <p className="font-display text-6xl font-bold mt-1">{score}/5</p>
            <p className="text-indigo-100 mt-1">{picks.length < 5 ? `You answered ${picks.length} of 5 in time.` : `Finished in ${Math.round(took / 1000)} seconds.`}</p>
            {data.stats.players > 0 && <p className="text-indigo-100 text-sm mt-2">YNeet students averaged {data.stats.avg}/5 on this Sprint.</p>}
          </div>

          <div className="rounded-2xl bg-ink text-paper p-6">
            <p className="font-semibold text-lg">Want a rank? Today's Sprint is waiting in YNeet.</p>
            <p className="text-paper/70 text-sm mt-1">A new ranked Sprint every day, a streak, today's top 10 and a reminder at 7 PM. Plus NEET mock tests and chapter practice, 30 days free.</p>
            <Link to="/register" onClick={() => track("web_sprint_signup_click", { score })}
              className="mt-4 inline-flex items-center gap-2 bg-gold text-ink font-semibold px-6 py-3 rounded-full hover:bg-gold-dark">
              Start free and play today's Sprint <ArrowRight size={16} />
            </Link>
          </div>

          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold">Answers</h2>
            {data.questions.map((q, i) => {
              const mine = picks[i];
              const ok = mine === q.answer;
              return (
                <div key={q.id} className="rounded-2xl border border-ink/10 bg-white p-5">
                  <p className="text-xs text-ink/50">{q.subject} · {q.chapter}</p>
                  <p className="font-semibold mt-1">{i + 1}. {q.text}</p>
                  <p className={`mt-2 text-sm font-semibold ${ok ? "text-rise-dark" : "text-red-700"}`}>
                    {mine === undefined ? "Not answered" : ok ? `✓ ${q.options[mine]}` : `✗ You chose ${q.options[mine]}`}
                    {!ok && <span className="text-rise-dark"> · Correct: {q.options[q.answer]}</span>}
                  </p>
                  {q.explanation && <p className="mt-1 text-sm text-ink/70 whitespace-pre-line">{q.explanation}</p>}
                </div>
              );
            })}
          </div>
          <button onClick={begin} className="font-semibold text-rise-dark underline">Play again</button>
        </div>
      )}
    </div>
  );
};

export default NeetSprint;
