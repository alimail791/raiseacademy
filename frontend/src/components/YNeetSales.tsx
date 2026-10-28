import { Link } from "react-router-dom";
import {
  ArrowRight, BookOpen, ClipboardCheck, TrendingUp, Users, Check, X, Minus, Mail, MessageCircle, Gauge, Puzzle,
} from "lucide-react";
import { gamesLink } from "../utils/siteInfo";

// Shared selling sections for /neet-trial, /courses and /neet-parents.
// Every feature listed here exists in the YNeet app today — keep it that way.

const GROUPS = [
  {
    icon: BookOpen, title: "Practise",
    items: ["Chapter-wise practice with recommended questions", "NEET PYQs, year by year", "Daily quiz", "Flashcards and formula sheets for Physics, Chemistry and Biology"],
  },
  {
    icon: ClipboardCheck, title: "Test",
    items: ["1,200+ NEET tests: full 720-mark mocks and chapter tests", "Instant analysis by subject and chapter", "Leaderboard rank"],
  },
  {
    icon: TrendingUp, title: "Improve",
    items: ["Mistake notebook: every wrong answer saved to revise", "AI “explain differently” on any question", "AI study planner up to your NEET date", "Shorts: one concept in 3–5 minutes"],
  },
  {
    icon: Users, title: "Parents & support",
    items: ["Weekly progress report for parents", "Doubt support on WhatsApp", "Pay only for the months you need", "30 days free, no card"],
  },
];

export function FeatureGroups({ heading = "Everything in one place" }: { heading?: string }) {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-center">{heading}</h2>
      <div className="mt-8 grid sm:grid-cols-2 gap-5">
        {GROUPS.map(({ icon: Icon, title, items }) => (
          <div key={title} className="rounded-2xl border border-ink/10 bg-white dark:bg-ink-light dark:border-paper/15 p-6">
            <p className="flex items-center gap-2 font-display font-bold text-lg">
              <span className="w-9 h-9 rounded-xl bg-gold/20 flex items-center justify-center"><Icon size={18} className="text-gold-dark" /></span>
              {title}
            </p>
            <ul className="mt-4 space-y-2">
              {items.map((t) => (
                <li key={t} className="flex gap-2 text-sm text-ink/80 dark:text-paper/80">
                  <Check size={16} className="text-rise-dark shrink-0 mt-0.5" /> {t}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

// Compared with kinds of NEET prep, not named brands: prices elsewhere change
// often, and naming competitors invites trademark complaints on Google Ads.
type Cell = string | boolean | null;
const COLS = ["Big online coaching apps", "Offline coaching", "Free YouTube", "YNeet"];
const ROWS: Array<[string, Cell, Cell, Cell, Cell]> = [
  ["Cost per year", "A few thousand to ₹1 lakh+", "Usually ₹1–2 lakh+", "Free", "₹3,199 (Class 11–12)"],
  ["Full access free for 30 days", false, false, null, true],
  ["Pay only for the months you need", false, false, null, true],
  ["NEET mock tests + PYQs", true, true, false, true],
  ["Score and weak chapters after every test", true, false, false, true],
  ["Mistake notebook to revise wrong answers", null, false, false, true],
  ["Weekly report for parents", null, null, false, true],
  ["Doubts answered on WhatsApp", null, true, false, true],
  ["Free for Class 6–8", false, false, true, true],
  ["Long video lectures", true, true, true, false],
];

function Mark({ v, ours }: { v: Cell; ours?: boolean }) {
  if (typeof v === "string") return <span className={ours ? "font-bold" : ""}>{v}</span>;
  if (v === true) return <Check size={18} className={`mx-auto ${ours ? "text-rise-dark" : "text-ink/50 dark:text-paper/50"}`} aria-label="Yes" />;
  if (v === false) return <X size={18} className="mx-auto text-ink/30 dark:text-paper/30" aria-label="No" />;
  return <Minus size={18} className="mx-auto text-ink/30 dark:text-paper/30" aria-label="Varies" />;
}

export function CompareTable() {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-center">How YNeet compares</h2>
      <p className="text-center text-ink/65 dark:text-paper/65 mt-2 max-w-2xl mx-auto">
        Already have classes or YouTube lectures? Keep them. YNeet is where you practise, test and fix your mistakes.
      </p>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 dark:border-paper/15">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-ink/[0.04] dark:bg-paper/5">
              <th className="text-left p-3 font-semibold w-[34%]"></th>
              {COLS.map((c, i) => (
                <th key={c} className={`p-3 font-semibold text-center ${i === 3 ? "bg-gold/25 text-ink dark:text-paper" : ""}`}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, ...cells]) => (
              <tr key={label} className="border-t border-ink/10 dark:border-paper/10">
                <td className="p-3 font-medium">{label}</td>
                {cells.map((v, i) => (
                  <td key={i} className={`p-3 text-center ${i === 3 ? "bg-gold/10" : ""}`}><Mark v={v} ours={i === 3} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink/50 dark:text-paper/50 mt-2">
        <Minus size={12} className="inline" /> = varies by app or centre. Costs elsewhere are typical ranges. YNeet: ₹399/month or ₹3,199/year for Class 11–12, ₹299 for Class 9–10, ₹499 for droppers.
      </p>
      <p className="text-center font-semibold mt-6">One year of YNeet costs less than one month of most coaching fees.</p>
      <div className="text-center mt-4">
        <Link to="/register" className="inline-flex items-center gap-2 bg-gold text-ink font-semibold px-6 py-3 rounded-full hover:bg-gold-dark">
          Start free for 30 days <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

// A sample of the real weekly report (backend utils/parentReport.js), with made-up numbers.
export function ParentReportSection({ standalone }: { standalone?: boolean }) {
  return (
    <section id="parents" className="max-w-5xl mx-auto px-4 sm:px-6 py-12 grid md:grid-cols-2 gap-8 items-center">
      <div>
        <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm">For parents</p>
        {standalone
          ? <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">Know every week how your child is doing for NEET</h1>
          : <h2 className="font-display text-2xl sm:text-3xl font-bold mt-2">Know every week how your child is doing</h2>}
        <p className="text-ink/70 dark:text-paper/70 mt-3">
          Every week YNeet sends parents a short report: days studied, tests taken, mock scores against the target, accuracy and the chapters that need more practice. No guessing, no asking.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex gap-2"><Mail size={16} className="text-rise-dark mt-0.5" /> Sent to the parent's email every week</li>
          <li className="flex gap-2"><MessageCircle size={16} className="text-rise-dark mt-0.5" /> Your child can share it to your WhatsApp in one tap</li>
          <li className="flex gap-2"><Check size={16} className="text-rise-dark mt-0.5" /> Free with every plan, and with the free 30-day trial</li>
        </ul>
        <Link to="/register" className="mt-6 inline-flex items-center gap-2 bg-ink text-paper dark:bg-gold dark:text-ink font-semibold px-6 py-3 rounded-full">
          Register your child free <ArrowRight size={16} />
        </Link>
        <p className="text-xs text-ink/55 dark:text-paper/55 mt-2">Add the parent's email in the student profile after registering.</p>
        {standalone && (
          <p className="text-sm mt-5">
            Run a coaching centre or school? <Link to="/institutes" className="text-rise-dark font-semibold underline">See YNeet for institutes →</Link>
          </p>
        )}
      </div>
      <div className="rounded-2xl bg-[#e7f7ec] dark:bg-[#12372a] p-4 shadow-sm">
        <div className="rounded-xl bg-white dark:bg-[#1f2c33] p-4 text-[13px] leading-relaxed font-mono whitespace-pre-line text-ink dark:text-paper">
{`📊 YNeet weekly report – Priya
20 Oct – 26 Oct

Good week: more tests and a better average.

📅 Days studied: 6/7  |  🔥 Streak: 11 days
📝 Tests taken: 5 (1 full NEET mock)
🎯 Average test score: 68% (▲ 6% vs last week)
🩺 Latest full mock: 512/720
🏁 Target: 620/720
✅ Accuracy: 74%
⚡ Daily quiz: 6 days, 80% correct

📌 Needs more practice: Rotational Motion, Equilibrium
⏳ 190 days to NEET`}
        </div>
        <p className="text-center text-xs text-ink/55 dark:text-paper/55 mt-2">Sample report. Names and numbers are examples.</p>
      </div>
    </section>
  );
}

export function FreeStartCards() {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h2 className="font-display text-2xl font-bold text-center">Not ready to register? Start here, free</h2>
      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        <Link to="/neet-readiness" className="rounded-2xl bg-rise-line text-paper p-6 hover:opacity-95">
          <Gauge className="text-gold" />
          <p className="font-display font-bold text-lg mt-2">NEET Readiness Test</p>
          <p className="text-sm text-paper/80 mt-1">15 questions, 5 minutes. Your score out of 100 and your weak chapters.</p>
        </Link>
        <Link to="/neet-practice" className="rounded-2xl border border-ink/10 dark:border-paper/15 p-6 hover:border-gold">
          <BookOpen className="text-gold-dark" />
          <p className="font-display font-bold text-lg mt-2">Chapter-wise PYQs</p>
          <p className="text-sm text-ink/65 dark:text-paper/65 mt-1">Free NEET previous year questions for every chapter, with answers.</p>
        </Link>
        <a href={gamesLink("start_free")} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-ink/10 dark:border-paper/15 p-6 hover:border-gold">
          <Puzzle className="text-gold-dark" />
          <p className="font-display font-bold text-lg mt-2">Daily NEET puzzles</p>
          <p className="text-sm text-ink/65 dark:text-paper/65 mt-1">5 quick games a day on play.yneet.in. Keep your streak going.</p>
        </a>
      </div>
    </section>
  );
}
