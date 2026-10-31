import { useEffect, useState } from "react";
import axios from "axios";
import { YNEET_API } from "../practice/practiceData";

// The NEET Question of the Day box that other websites (coaching centres, schools,
// blogs) show in an <iframe>. No site header or footer: just the question.
// Every link opens www.yneet.in in a new tab and carries the host site in its UTM tags.

type Q = { number: number; subject: string; chapter: string; slug: string; question: string; options: string[]; answer: number; explanation: string };
const LETTERS = ["A", "B", "C", "D"];

function hostSite() {
  try { return document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : "direct"; } catch { return "direct"; }
}

const QotdEmbed = () => {
  const [q, setQ] = useState<Q | null>(null);
  const [failed, setFailed] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [site, setSite] = useState("direct");

  useEffect(() => {
    setSite(hostSite());
    if (!YNEET_API) { setFailed(true); return; }
    axios.get(`${YNEET_API}/public/qotd`).then((r) => setQ(r.data.today)).catch(() => setFailed(true));
  }, []);

  const utm = `utm_source=${encodeURIComponent(site)}&utm_medium=widget&utm_campaign=qotd_embed`;
  const link = (path: string) => `https://www.yneet.in${path}${path.includes("?") ? "&" : "?"}${utm}`;
  const shown = picked !== null;

  return (
    <div className="font-body text-ink bg-white min-h-screen p-3">
      <div className="rounded-2xl border border-ink/15 overflow-hidden bg-white">
        <div className="bg-ink text-paper px-4 py-3 flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gold">NEET Question of the Day</span>
          {q && <span className="text-xs text-paper/70">#{q.number} · {q.subject}</span>}
        </div>
        <div className="p-4">
          {failed && <p className="text-sm text-ink/60">Today's question couldn't load. <a href={link("/neet-question-of-the-day")} target="_blank" rel="noopener" className="underline font-semibold">Open it on YNeet</a>.</p>}
          {!q && !failed && <p className="text-sm text-ink/50">Loading today's question…</p>}
          {q && (
            <>
              <p className="font-semibold leading-snug whitespace-pre-line">{q.question}</p>
              <div className="mt-3 space-y-2">
                {q.options.map((o, k) => {
                  const right = shown && q.answer === k + 1;
                  const wrong = shown && picked === k + 1 && !right;
                  return (
                    <button key={k} disabled={shown} onClick={() => setPicked(k + 1)}
                      className={`w-full text-left text-sm flex gap-2 px-3 py-2.5 rounded-xl border min-h-[44px] ${right ? "border-rise bg-rise/10 font-semibold" : wrong ? "border-red-400 bg-red-50" : "border-ink/15 hover:border-gold"}`}>
                      <b>{LETTERS[k]}.</b> <span className="whitespace-pre-line">{o}</span>
                    </button>
                  );
                })}
              </div>
              {shown && (
                <div className="mt-3 text-sm">
                  <p className={`font-bold ${picked === q.answer ? "text-rise-dark" : "text-red-600"}`}>
                    {picked === q.answer ? "Correct!" : `Not quite. The answer is ${LETTERS[q.answer - 1]}.`}
                  </p>
                  {q.explanation && <p className="mt-1 text-ink/75 line-clamp-4">{q.explanation}</p>}
                  <a href={link(`/neet-practice/${q.slug}`)} target="_blank" rel="noopener" className="inline-block mt-2 font-semibold text-rise-dark underline">
                    More free PYQs on {q.chapter}
                  </a>
                </div>
              )}
            </>
          )}
        </div>
        <div className="border-t border-ink/10 px-4 py-2.5 flex items-center justify-between gap-2 text-xs">
          <span className="text-ink/55">New question every day</span>
          <a href={link("/neet-question-of-the-day")} target="_blank" rel="noopener" className="font-bold text-ink hover:text-gold-dark">by YNeet ↗</a>
        </div>
      </div>
    </div>
  );
};

export default QotdEmbed;
