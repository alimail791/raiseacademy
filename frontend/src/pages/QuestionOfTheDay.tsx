import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight, Check, X, Copy, Download, Share2 } from "lucide-react";
import { YNEET_API } from "../practice/practiceData";
import { SITE } from "../utils/siteInfo";

// NEET Question of the Day: one question per date (the same for everyone), so the
// WhatsApp Channel post, this page and every share match. The "Share kit" at the
// bottom gives the ready-to-paste channel posts and the square post image.

type Q = {
  date: string; number: number; subject: string; chapter: string; slug: string;
  question: string; options: string[]; answer: number; explanation: string; pyqYear: number | null;
};

const LETTERS = ["A", "B", "C", "D"];
const PAGE = "https://www.yneet.in/neet-question-of-the-day";
const nice = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
const track = (e: string, p: Record<string, unknown> = {}) => { try { (window as any).gtag?.("event", e, p); } catch { /* analytics only */ } };

function questionPost(q: Q) {
  return `🧠 *NEET Question of the Day #${q.number}* · ${q.subject}\n\n${q.question}\n\n${q.options.map((o, i) => `${LETTERS[i]}. ${o}`).join("\n")}\n\nVote in the poll 👇 Answer tomorrow, 7 AM.\nSolve it now: ${PAGE}`;
}
function answerPost(q: Q) {
  const why = (q.explanation || "").split(/(?<=\.)\s/).slice(0, 2).join(" ");
  return `✅ *Yesterday's answer (#${q.number}): ${LETTERS[q.answer - 1]}. ${q.options[q.answer - 1]}*\n\n${why}\n\nFree NEET PYQs on ${q.chapter}, no login:\nhttps://www.yneet.in/neet-practice/${q.slug}`;
}

// Square 1080×1080 post image, same look as the channel prototype.
async function postImage(q: Q): Promise<Blob | null> {
  const c = document.createElement("canvas");
  c.width = 1080; c.height = 1080;
  const g = c.getContext("2d");
  if (!g) return null;
  const font = (w: number, px: number) => `${w} ${px}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  const wrap = (text: string, x: number, y: number, maxW: number, lh: number, maxLines: number) => {
    const words = text.replace(/\s+/g, " ").split(" ");
    let line = "", lines = 0;
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (g.measureText(t).width > maxW && line) {
        if (lines === maxLines - 1) { g.fillText(line + " …", x, y); return y + lh; }
        g.fillText(line, x, y); y += lh; lines++; line = w;
      } else line = t;
    }
    if (line) { g.fillText(line, x, y); y += lh; }
    return y;
  };
  g.fillStyle = "#14213D"; g.fillRect(0, 0, 1080, 1080);
  g.fillStyle = "#F2A93B"; g.font = font(800, 48); g.fillText("YNeet", 80, 120);
  g.textAlign = "right"; g.font = font(700, 30); g.fillText(`#${q.number} · ${q.subject}`, 1000, 116); g.textAlign = "left";
  g.fillStyle = "#9FB0CC"; g.font = font(700, 30); g.fillText("NEET QUESTION OF THE DAY", 80, 210);
  g.fillStyle = "#FBFAF7"; g.font = font(800, 54);
  let y = wrap(q.question, 80, 300, 920, 66, 5) + 20;
  g.font = font(600, 34);
  q.options.forEach((o, i) => {
    g.fillStyle = "#22345C"; g.beginPath(); g.roundRect(80, y - 48, 920, 76, 18); g.fill();
    g.fillStyle = "#FBFAF7"; wrap(`${LETTERS[i]}. ${o}`, 110, y, 860, 40, 1); y += 96;
  });
  g.fillStyle = "#C9D2E3"; g.font = font(600, 30); g.fillText("Answer tomorrow, 7 AM", 80, 1010);
  g.textAlign = "right"; g.fillStyle = "#F2A93B"; g.font = font(700, 30); g.fillText("yneet.in/neet-question-of-the-day", 1000, 1010);
  return new Promise((r) => c.toBlob((b) => r(b), "image/png"));
}

function Question({ q, reveal }: { q: Q; reveal?: boolean }) {
  const [picked, setPicked] = useState<number | null>(null);
  const shown = reveal || picked !== null;
  return (
    <div className="rounded-2xl border border-ink/10 dark:border-paper/15 overflow-hidden">
      <div className="bg-ink text-paper px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gold">#{q.number} · {q.subject} · {q.chapter}{q.pyqYear ? ` · NEET ${q.pyqYear}` : ""}</p>
        <p className="mt-2 font-display text-xl font-bold leading-snug whitespace-pre-line">{q.question}</p>
      </div>
      <div className="p-5 space-y-2">
        {q.options.map((o, k) => {
          const right = shown && q.answer === k + 1;
          const wrong = shown && picked === k + 1 && !right;
          return (
            <button key={k} disabled={shown} onClick={() => { setPicked(k + 1); track("qotd_answer", { correct: q.answer === k + 1 }); }}
              className={`w-full text-left flex gap-3 px-4 py-3 rounded-xl border min-h-[48px] ${right ? "border-rise bg-rise/10 font-semibold" : wrong ? "border-red-400 bg-red-50 dark:bg-red-900/20" : "border-ink/15 dark:border-paper/15 hover:border-gold"}`}>
              <b>{LETTERS[k]}.</b> <span className="whitespace-pre-line">{o}</span>
              {right && <Check size={18} className="ml-auto text-rise-dark shrink-0" />}
              {wrong && <X size={18} className="ml-auto text-red-500 shrink-0" />}
            </button>
          );
        })}
        {shown && (
          <div className="pt-2 text-sm">
            {picked !== null && <p className={`font-bold ${picked === q.answer ? "text-rise-dark" : "text-red-600"}`}>{picked === q.answer ? "Correct!" : `Not quite. The answer is ${LETTERS[q.answer - 1]}.`}</p>}
            {q.explanation && <p className="mt-1 text-ink/75 dark:text-paper/75 whitespace-pre-line">{q.explanation}</p>}
            <Link to={`/neet-practice/${q.slug}`} className="inline-block mt-2 font-semibold text-rise-dark underline">More free PYQs on {q.chapter}</Link>
          </div>
        )}
      </div>
    </div>
  );
}

const QuestionOfTheDay = () => {
  const [data, setData] = useState<{ today: Q | null; yesterday: Q | null } | null>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (!YNEET_API) { setError(true); return; }
    axios.get(`${YNEET_API}/public/qotd`).then((r) => setData({ today: r.data.today, yesterday: r.data.yesterday })).catch(() => setError(true));
  }, []);

  const copy = async (label: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(""), 2000); track("qotd_copy", { label }); } catch { /* clipboard blocked */ }
  };
  const download = async () => {
    if (!data?.today) return;
    const b = await postImage(data.today);
    if (!b) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = `neet-qotd-${data.today.number}.png`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    track("qotd_image");
  };

  const t = data?.today;
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm">Free · New every day</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">NEET Question of the Day</h1>
      <p className="text-ink/70 dark:text-paper/70 mt-3">One NEET-level question every day, mostly from previous NEET papers, with the answer and explanation. Answer it, then come back tomorrow for the next one.</p>

      {error && <p className="mt-8 text-ink/60">Couldn't load today's question. Please try again in a minute, or practise <Link to="/neet-practice" className="underline font-semibold">chapter-wise PYQs</Link>.</p>}
      {!data && !error && <p className="mt-8 text-ink/50">Loading today's question…</p>}

      {t && (
        <section className="mt-8">
          <p className="text-sm font-semibold text-ink/60 dark:text-paper/60 mb-2">Today · {nice(t.date)}</p>
          <Question q={t} />
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={`https://wa.me/?text=${encodeURIComponent(`Can you solve today's NEET question? ${t.question.slice(0, 120)}… ${PAGE}`)}`} target="_blank" rel="noopener noreferrer"
              onClick={() => track("qotd_share")} className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold px-5 py-3 rounded-full">
              <Share2 size={18} /> Challenge a friend
            </a>
            {SITE.whatsappChannel && (
              <a href={SITE.whatsappChannel} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-ink/20 dark:border-paper/25 font-semibold px-5 py-3 rounded-full">
                Get it daily on WhatsApp
              </a>
            )}
          </div>
        </section>
      )}

      <div className="my-8 rounded-2xl bg-gold/15 border border-gold/40 p-6">
        <p className="font-display text-xl font-bold">Want 50 questions like this, timed?</p>
        <p className="text-sm text-ink/70 dark:text-paper/70 mt-1">Chapter tests, full NEET mocks with rank and a mistake notebook. Free for 30 days, no card.</p>
        <Link to="/register" className="mt-4 inline-flex items-center gap-2 bg-gold text-ink font-semibold px-6 py-3 rounded-full hover:bg-gold-dark">Start free for 30 days <ArrowRight size={16} /></Link>
      </div>

      {data?.yesterday && (
        <section>
          <h2 className="font-display text-2xl font-bold">Yesterday's question</h2>
          <p className="text-sm text-ink/60 dark:text-paper/60 mb-3">{nice(data.yesterday.date)} · answer shown</p>
          <Question q={data.yesterday} reveal />
        </section>
      )}

      {t && data?.yesterday && (
        <details className="mt-10 rounded-2xl border border-ink/10 dark:border-paper/15 p-5">
          <summary className="cursor-pointer font-display text-lg font-bold">Share kit: WhatsApp Channel posts</summary>
          <p className="text-sm text-ink/60 dark:text-paper/60 mt-2">Post at 7 AM: first yesterday's answer, then today's question with a poll (options A, B, C, D) and the image.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={() => copy("answer", answerPost(data.yesterday!))} className="inline-flex items-center gap-2 border border-ink/20 dark:border-paper/25 font-semibold px-4 py-2.5 rounded-full">
              <Copy size={16} /> {copied === "answer" ? "Copied!" : "1. Copy answer post"}
            </button>
            <button onClick={() => copy("question", questionPost(t))} className="inline-flex items-center gap-2 border border-ink/20 dark:border-paper/25 font-semibold px-4 py-2.5 rounded-full">
              <Copy size={16} /> {copied === "question" ? "Copied!" : "2. Copy question post"}
            </button>
            <button onClick={download} className="inline-flex items-center gap-2 border border-ink/20 dark:border-paper/25 font-semibold px-4 py-2.5 rounded-full">
              <Download size={16} /> 3. Download image
            </button>
          </div>
        </details>
      )}
    </div>
  );
};

export default QuestionOfTheDay;
