import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight } from "lucide-react";
import { YNEET_API } from "../practice/practiceData";

// Ask YNeet Friday: real student doubts, answered by YNeet teachers. Each Friday
// one is featured. No names are shown. The page invites visitors to sign up to
// ask their own doubts.

type D = { id: number; cls: string | null; subject: string; question: string; answer: string; featured_on: string };

const nice = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

const AskYneet = () => {
  const [list, setList] = useState<D[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    axios.get(`${YNEET_API}/public/doubts`).then((r) => setList(r.data.doubts)).catch(() => setError(true));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <p className="text-gold-deep dark:text-gold font-semibold uppercase tracking-widest text-sm">Every Friday</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">Ask YNeet: NEET doubts, answered</h1>
      <p className="mt-3 text-ink/70 leading-relaxed">Real doubts from YNeet students in Physics, Chemistry and Biology, answered by our teachers in simple steps. A new one every Friday.</p>

      <div className="mt-6 rounded-2xl bg-ink text-paper p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <p className="font-semibold text-lg">Got a doubt of your own?</p>
          <p className="text-paper/70 text-sm">Type it or send a photo in the YNeet app. A teacher answers, usually within 24 hours.</p>
        </div>
        <Link to="/register" onClick={() => { try { (window as any).gtag?.("event", "ask_signup_click"); } catch { /* analytics */ } }}
          className="inline-flex items-center gap-2 bg-gold text-ink font-semibold px-5 py-3 rounded-full hover:bg-gold-dark whitespace-nowrap">
          Start 30 days free <ArrowRight size={16} />
        </Link>
      </div>

      {error && <p className="mt-8 text-ink/70">Couldn't load the answers. Please try again later.</p>}
      {!list && !error && <p className="mt-8 text-ink/70">Loading…</p>}
      {list && list.length === 0 && <p className="mt-8 text-ink/70">The first Ask YNeet answer comes out this Friday.</p>}

      <div className="mt-8 space-y-5">
        {list?.map((d) => (
          <article key={d.id} className="rounded-2xl border border-ink/10 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold-deep dark:text-gold">
              {d.subject} · {nice(d.featured_on)}{d.cls ? ` · asked by a Class ${d.cls.replace(/th$/, "")} student` : ""}
            </p>
            <h2 className="mt-2 font-display text-xl font-bold">{d.question}</h2>
            <p className="mt-3 text-ink/80 leading-relaxed whitespace-pre-line">{d.answer}</p>
          </article>
        ))}
      </div>
    </div>
  );
};

export default AskYneet;
