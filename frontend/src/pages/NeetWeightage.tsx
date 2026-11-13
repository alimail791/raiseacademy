// NEET chapter-wise weightage (/neet-chapter-wise-weightage): every chapter
// ranked by expected questions per paper, same numbers as the app's Chapter
// Priority map. Data comes with the chapter list (prerendered at build time).
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight } from "lucide-react";
import { RegionalLinks } from "./RegionalPages";
import { LANGS } from "../i18n/regional";
import { useInitialPracticeData, YNEET_API, SUBJECTS, type PracticeChapterSummary } from "../practice/practiceData";
import UpdatedOn from "../components/UpdatedOn";

const TOTAL: Record<string, number> = { Physics: 45, Chemistry: 45, Biology: 90 };

const NeetWeightage = () => {
  const initial = useInitialPracticeData();
  const [chapters, setChapters] = useState<PracticeChapterSummary[] | null>(initial.chapters || null);

  useEffect(() => {
    if (!YNEET_API) return;
    axios.get(`${YNEET_API}/public/practice`).then((r) => setChapters(r.data.chapters || [])).catch(() => setChapters((c) => c || []));
  }, []);

  const ranked = (subject: string) =>
    (chapters || []).filter((c) => c.subject === subject && c.weightage).sort((a, b) => b.weightage!.expectedQs - a.weightage!.expectedQs);
  const top = SUBJECTS.flatMap((s) => ranked(s).slice(0, 3));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <RegionalLinks path="/neet-chapter-wise-weightage" langs={LANGS} />
      <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm">Free · Updated from PYQs</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">NEET Chapter-wise Weightage (Physics, Chemistry, Biology)</h1>
      <UpdatedOn />
      <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg max-w-3xl">
        How many questions each NCERT chapter is worth in a NEET paper, ranked from most to least important. A NEET paper has 180 questions: 45 Physics, 45 Chemistry and 90 Biology (Botany + Zoology), 4 marks each.
      </p>

      {chapters === null && <p className="mt-10 text-ink/50">Loading chapters…</p>}

      {top.length > 0 && (
        <section className="mt-8 p-5 rounded-2xl bg-gold/15 border border-gold/40">
          <h2 className="font-display text-xl font-bold">Highest-weightage chapters</h2>
          <ul className="mt-3 grid sm:grid-cols-3 gap-2 text-sm">
            {top.map((c) => (
              <li key={c.slug}><Link to={`/neet-practice/${c.slug}`} className="font-semibold text-rise-dark hover:underline">{c.chapter}</Link> <span className="text-ink/60 dark:text-paper/60">· {c.subject} · ~{c.weightage!.expectedQs} Qs</span></li>
            ))}
          </ul>
        </section>
      )}

      {SUBJECTS.map((subject) => {
        const list = ranked(subject);
        if (!list.length) return null;
        return (
          <section key={subject} className="mt-10">
            <h2 className="font-display text-2xl font-bold">NEET {subject} chapter-wise weightage</h2>
            <p className="text-sm text-ink/60 dark:text-paper/60 mt-1">{TOTAL[subject]} questions · {TOTAL[subject] * 4} marks</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left border-b border-ink/15 dark:border-paper/20">
                    <th className="py-2 pr-2">#</th><th className="py-2 pr-2">Chapter</th><th className="py-2 pr-2">Class</th>
                    <th className="py-2 pr-2 text-right">Questions</th><th className="py-2 pr-2 text-right">Marks</th><th className="py-2">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.slug} className="border-b border-ink/5 dark:border-paper/10">
                      <td className="py-2 pr-2 text-ink/50 dark:text-paper/50">{c.weightage!.rank}</td>
                      <td className="py-2 pr-2"><Link to={`/neet-practice/${c.slug}`} className="text-rise-dark font-semibold hover:underline">{c.chapter}</Link></td>
                      <td className="py-2 pr-2">{c.weightage!.classLevel.replace(/th/g, "")}</td>
                      <td className="py-2 pr-2 text-right">~{c.weightage!.expectedQs}</td>
                      <td className="py-2 pr-2 text-right">~{c.weightage!.marks}</td>
                      <td className={`py-2 font-semibold ${c.weightage!.priority === "High" ? "text-rise-dark" : c.weightage!.priority === "Low" ? "text-ink/50 dark:text-paper/50" : ""}`}>{c.weightage!.priority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <section className="mt-12 space-y-3 text-ink/80 dark:text-paper/80 max-w-3xl">
        <h2 className="font-display text-2xl font-bold text-ink dark:text-paper">How this weightage is worked out</h2>
        <p>We start from the average number of questions each chapter gets in recent NEET papers, then blend in the share of each chapter in the previous year questions held in the YNeet question bank. Each subject is scaled so its chapters add up to the real paper: 45 Physics, 45 Chemistry and 90 Biology questions. Numbers are averages, so any one year can be a question or two higher or lower.</p>
        <h2 className="font-display text-2xl font-bold text-ink dark:text-paper pt-2">How to use it</h2>
        <p>Weightage tells you what NEET asks; our <Link to="/neet-most-missed-chapters" className="text-rise-dark font-semibold underline">most-missed NEET chapters</Link> page shows where students actually lose marks, from real YNeet answers.</p>
        <p>Finish the High-priority chapters first: together they carry most of the marks. Then cover Medium chapters, and revise Low chapters from NCERT before the exam rather than skipping them, as they are often the easiest marks. Tap any chapter to practise its previous year questions free.</p>
        <p>Inside YNeet, the <b>Chapter Priority map</b> goes one step further: it combines this weightage with your own accuracy to show which chapters are costing you the most marks, and builds a day-by-day plan up to exam day.</p>
      </section>

      <div className="mt-8 p-6 rounded-2xl bg-ink text-paper">
        <p className="font-display font-bold text-xl">Get your personal Chapter Priority map</p>
        <p className="text-sm text-paper/75 mt-2">Weightage + your accuracy = the chapters to study next. Free for 30 days.</p>
        <Link to="/register" className="mt-4 inline-flex items-center gap-2 bg-gold text-ink font-semibold px-6 py-3 rounded-full hover:bg-gold-dark">Start free for 30 days <ArrowRight size={16} /></Link>
        <p className="web-only text-sm mt-3 text-paper/75">Or see <Link to="/courses" className="text-gold font-semibold underline">how the online NEET course works</Link>, class by class.</p>
      </div>
    </div>
  );
};

export default NeetWeightage;
