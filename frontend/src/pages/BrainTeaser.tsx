import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight } from "lucide-react";
import { YNEET_API } from "../practice/practiceData";

// Public Brain Teaser of the week (Class 6–8 science). Anyone can pick an
// answer; to lock it and see if they were right, they sign up free (Class 6–8
// is free on YNeet). Last week's teaser shows with its answer, for trust.

type T = {
  id: number; title: string; clues: string[]; options: string[]; topic?: string;
  revealed: boolean; revealAt: string; answer?: number; explanation?: string; players?: number; correctPct?: number;
};

const LETTERS = ["A", "B", "C", "D"];
const track = (e: string, p: Record<string, unknown> = {}) => { try { (window as any).gtag?.("event", e, p); } catch { /* analytics only */ } };

const BrainTeaser = () => {
  const [data, setData] = useState<{ current: T | null; previous: T | null } | null>(null);
  const [error, setError] = useState(false);
  const [pick, setPick] = useState<number | null>(null);

  useEffect(() => {
    axios.get(`${YNEET_API}/public/teaser`).then((r) => setData({ current: r.data.current, previous: r.data.previous })).catch(() => setError(true));
  }, []);

  const t = data?.current;
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <p className="text-gold-deep dark:text-gold font-semibold uppercase tracking-widest text-sm">Every Wednesday · Class 6–8 Science</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">Brain Teaser of the week</h1>
      <p className="mt-3 text-ink/70">Read the clues, pick an answer. The answer comes out the next day at 7 PM.</p>

      {error && <p className="mt-8 text-ink/70">Couldn't load this week's teaser. Please try again later.</p>}
      {!data && !error && <p className="mt-8 text-ink/70">Loading…</p>}
      {data && !t && <p className="mt-8 text-ink/70">The first Brain Teaser arrives on Wednesday.</p>}

      {t && (
        <div className="mt-8 rounded-3xl bg-gold/20 p-6 sm:p-8">
          <h2 className="font-display text-2xl font-bold">{t.title}</h2>
          <ol className="mt-4 list-decimal pl-6 space-y-2 text-lg font-medium">
            {t.clues.map((c, i) => <li key={i}>{c}</li>)}
          </ol>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {t.options.map((o, i) => (
              <button key={i} onClick={() => { setPick(i); track("teaser_pick", { id: t.id }); }}
                className={`min-h-[56px] rounded-2xl border-2 px-4 text-left font-semibold ${pick === i ? "border-ink bg-white" : "border-transparent bg-white/70 hover:bg-white"}`}>
                {LETTERS[i]}. {o}
              </button>
            ))}
          </div>
          {pick !== null && !t.revealed && (
            <div className="mt-6 rounded-2xl bg-white p-5">
              <p className="font-semibold">You picked {LETTERS[pick]}. {t.options[pick]}.</p>
              <p className="mt-1 text-ink/70 text-sm">Create a free account to lock your answer and find out if you're right. Free for Class 6–8, no payment.</p>
              <Link to="/register?junior=1" onClick={() => track("teaser_signup_click", { id: t.id })}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink text-paper font-semibold px-5 py-3 hover:bg-ink/90">
                Lock my answer, free <ArrowRight size={16} />
              </Link>
              <p className="mt-3 text-sm text-ink/70">Already have an account? <Link to="/login" className="underline">Log in</Link></p>
            </div>
          )}
        </div>
      )}

      {data?.previous && data.previous.revealed && data.previous.answer !== undefined && (
        <div className="mt-10">
          <h2 className="font-display text-xl font-bold">Last week's teaser</h2>
          <div className="mt-3 rounded-2xl border border-ink/10 bg-white p-5">
            <p className="font-semibold">{data.previous.title}</p>
            <ol className="mt-2 list-decimal pl-6 text-ink/75 space-y-1">{data.previous.clues.map((c, i) => <li key={i}>{c}</li>)}</ol>
            <p className="mt-3 font-semibold text-rise-dark">Answer: {data.previous.options[data.previous.answer]}</p>
            {data.previous.explanation && <p className="mt-1 text-sm text-ink/70">{data.previous.explanation}</p>}
            {!!data.previous.players && <p className="mt-2 text-xs text-ink/70">{data.previous.correctPct}% of {data.previous.players} students got it right.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default BrainTeaser;
