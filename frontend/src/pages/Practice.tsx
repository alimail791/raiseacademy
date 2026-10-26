import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight, BookOpen } from "lucide-react";
import { useInitialPracticeData, YNEET_API, SUBJECTS, type PracticeChapterSummary } from "../practice/practiceData";

const Practice = () => {
  const initial = useInitialPracticeData();
  const [chapters, setChapters] = useState<PracticeChapterSummary[] | null>(initial.chapters || null);

  useEffect(() => {
    if (!YNEET_API) return;
    axios.get(`${YNEET_API}/public/practice`).then((r) => setChapters(r.data.chapters || [])).catch(() => setChapters((c) => c || []));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm">Free · No login</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">NEET Chapter-wise PYQs & Practice Questions</h1>
      <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg max-w-3xl">
        Free NEET previous year questions for every Physics, Chemistry and Biology chapter, with answers and explanations. Pick a chapter and start practising — no sign-up needed.
      </p>
      <div className="mt-6 p-5 rounded-2xl bg-gold/15 border border-gold/40 flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold">Want timed chapter tests, full mocks, your score and weak topics? <span className="font-normal text-ink/70 dark:text-paper/70">Free for 30 days.</span></p>
        <Link to="/register" className="inline-flex items-center gap-2 bg-ink text-paper font-semibold px-5 py-2.5 rounded-full">Start free trial <ArrowRight size={16} /></Link>
      </div>

      {chapters === null && <p className="mt-10 text-ink/50">Loading chapters…</p>}
      {chapters !== null && chapters.length === 0 && <p className="mt-10 text-ink/50">Chapters are being prepared. Meanwhile, <Link to="/neet-trial" className="underline font-semibold">try YNeet free for 30 days</Link>.</p>}
      {SUBJECTS.map((s) => {
        const list = (chapters || []).filter((c) => c.subject === s);
        if (!list.length) return null;
        return (
          <section key={s} className="mt-10">
            <h2 className="font-display text-2xl font-bold">NEET {s} — {list.length} chapter{list.length === 1 ? "" : "s"}</h2>
            <ul className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map((c) => (
                <li key={c.slug}>
                  <Link to={`/neet-practice/${c.slug}`} className="flex items-start gap-3 p-4 rounded-xl border border-ink/10 dark:border-paper/15 hover:border-gold transition-colors h-full">
                    <BookOpen size={18} className="text-gold-dark mt-0.5 shrink-0" />
                    <span>
                      <span className="font-semibold block">{c.chapter}</span>
                      <span className="text-xs text-ink/55 dark:text-paper/55">{c.pyqCount > 0 ? `${c.pyqCount} PYQs` : `${c.total} questions`}{c.pyqYears ? ` · ${c.pyqYears[0]}–${c.pyqYears[1]}` : ""}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
};

export default Practice;
