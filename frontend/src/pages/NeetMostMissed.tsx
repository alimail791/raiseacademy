// Most-missed NEET chapters (/neet-most-missed-chapters): YNeet's own data —
// accuracy per chapter and the most-missed questions, from real student
// answers in YNeet mock tests and chapter practice. Unique numbers no other
// NEET site has, written answer-first so AI search tools can quote them.
// Prerendered at build time from GET /public/missed-stats; totals only.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight } from "lucide-react";
import { useInitialPracticeData, YNEET_API, SUBJECTS, type MissedStats, type MissedChapter } from "../practice/practiceData";
import { SITE_ORIGIN } from "../seo";
import UpdatedOn from "../components/UpdatedOn";

const n = (x: number) => x.toLocaleString("en-IN");

const ChapterTable = ({ rows, showSubject }: { rows: MissedChapter[]; showSubject?: boolean }) => (
  <div className="mt-3 overflow-x-auto">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="text-left border-b border-ink/15 dark:border-paper/20">
          <th className="py-2 pr-2">#</th><th className="py-2 pr-2">Chapter</th>
          {showSubject && <th className="py-2 pr-2">Subject</th>}
          <th className="py-2 pr-2 text-right">Answered correctly</th><th className="py-2 pr-2 text-right">Answers</th>
          <th className="py-2 text-right">NEET weightage</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((c, i) => (
          <tr key={c.slug} className="border-b border-ink/5 dark:border-paper/10">
            <td className="py-2 pr-2 text-ink/50 dark:text-paper/50">{i + 1}</td>
            <td className="py-2 pr-2"><Link to={`/neet-practice/${c.slug}`} className="text-rise-dark font-semibold hover:underline">{c.chapter}</Link></td>
            {showSubject && <td className="py-2 pr-2">{c.subject}</td>}
            <td className="py-2 pr-2 text-right font-semibold">{c.accuracy}%</td>
            <td className="py-2 pr-2 text-right">{n(c.answers)}</td>
            <td className="py-2 text-right">{c.expectedQs != null ? `~${c.expectedQs} Qs` : "–"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const NeetMostMissed = () => {
  const initial = useInitialPracticeData();
  const [data, setData] = useState<MissedStats | null | undefined>(initial.missed ?? undefined);

  useEffect(() => {
    if (!YNEET_API) { setData((d) => d ?? null); return; }
    axios.get(`${YNEET_API}/public/missed-stats`).then((r) => setData(r.data)).catch(() => setData((d) => d ?? null));
  }, []);

  // Not enough data yet → keep the thin page out of Google (the build does the
  // same in the HTML). After the app's own page-meta update, hence the timeout.
  useEffect(() => {
    if (data === undefined || data?.ready) return;
    const t = setTimeout(() => document.head.querySelector('meta[name="robots"]')?.setAttribute("content", "noindex, follow"), 0);
    return () => clearTimeout(t);
  }, [data]);

  const hardest = data?.hardestChapters?.[0];
  const easiest = data && [...(data.hardestChapters || [])].sort((a, b) => b.accuracy - a.accuracy)[0];
  const faqs = data?.ready && hardest ? [
    {
      q: "Which NEET chapter do students get wrong most?",
      a: `In YNeet's data, ${hardest.chapter} (${hardest.subject}) has the lowest accuracy: only ${hardest.accuracy}% of ${n(hardest.answers)} answers were correct.`,
    },
    ...SUBJECTS.filter((s) => data.bySubject?.[s]?.length).map((s) => {
      const top = data.bySubject[s].slice(0, 3);
      return {
        q: `What are the hardest NEET ${s} chapters?`,
        a: `By student accuracy on YNeet, the hardest ${s} chapters are ${top.map((c) => `${c.chapter} (${c.accuracy}% correct)`).join(", ")}.`,
      };
    }),
    {
      q: "Where does this data come from?",
      a: `From ${n(data.totals.answers)} answers by ${n(data.totals.students)} NEET students (Class 11, 12 and droppers) in YNeet mock tests and chapter practice. Only totals are used; no student's personal data is shown. Updated regularly.`,
    },
  ] : [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm">Free · YNeet student data</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">Most-Missed NEET Chapters: Where Students Lose Marks</h1>
      <UpdatedOn />

      {data === undefined && <p className="mt-10 text-ink/50">Loading the numbers…</p>}

      {data !== undefined && !data?.ready && (
        <div className="mt-6 max-w-3xl space-y-3 text-ink/80 dark:text-paper/80">
          <p className="text-lg">We're still collecting enough answers to rank NEET chapters fairly. Each chapter needs at least {data?.minChapterAnswers ?? 30} answers before it's listed, so the numbers mean something.</p>
          <p>Meanwhile, see the <Link to="/neet-chapter-wise-weightage" className="text-rise-dark font-semibold underline">NEET chapter-wise weightage</Link> or practise <Link to="/neet-practice" className="text-rise-dark font-semibold underline">chapter-wise PYQs free</Link>.</p>
        </div>
      )}

      {data?.ready && hardest && (
        <>
          <p className="text-ink/80 dark:text-paper/80 mt-4 text-lg max-w-3xl">
            Across <b>{n(data.totals.answers)}</b> answers by <b>{n(data.totals.students)}</b> NEET students on YNeet, the most-missed chapter is <b>{hardest.chapter}</b> ({hardest.subject}): only <b>{hardest.accuracy}%</b> of answers were correct.
            {easiest && easiest.slug !== hardest.slug && <> The best-scored chapter is {easiest.chapter} at {easiest.accuracy}%.</>}
            {data.totals.accuracy != null && <> Overall, students answered {data.totals.accuracy}% of questions correctly.</>}
          </p>

          <section className="mt-8 grid sm:grid-cols-3 gap-3">
            {SUBJECTS.map((s) => {
              const a = data.subjectAccuracy?.[s];
              return a ? (
                <div key={s} className="p-4 rounded-2xl bg-gold/15 border border-gold/40">
                  <p className="text-sm text-ink/60 dark:text-paper/60">{s} accuracy</p>
                  <p className="font-display text-3xl font-bold">{a.accuracy}%</p>
                  <p className="text-xs text-ink/50 dark:text-paper/50">{n(a.answers)} answers</p>
                </div>
              ) : null;
            })}
          </section>

          <section className="mt-10">
            <h2 className="font-display text-2xl font-bold">Top {data.hardestChapters.length} most-missed NEET chapters</h2>
            <p className="text-sm text-ink/60 dark:text-paper/60 mt-1">Lowest accuracy first. Weightage = expected questions in a NEET paper.</p>
            <ChapterTable rows={data.hardestChapters} showSubject />
          </section>

          {SUBJECTS.map((s) => data.bySubject?.[s]?.length ? (
            <section key={s} className="mt-10">
              <h2 className="font-display text-2xl font-bold">Hardest NEET {s} chapters</h2>
              <ChapterTable rows={data.bySubject[s]} />
            </section>
          ) : null)}

          {data.missedQuestions.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-2xl font-bold">Most-missed NEET questions</h2>
              <p className="text-sm text-ink/60 dark:text-paper/60 mt-1">Tap a question to try it, with the answer and explanation.</p>
              <ol className="mt-3 space-y-3">
                {data.missedQuestions.map((q) => (
                  <li key={q.slug} className="p-4 rounded-xl border border-ink/10 dark:border-paper/15">
                    <Link to={`/neet-question/${q.slug}`} className="font-semibold text-rise-dark hover:underline">{q.question}{q.question.length >= 160 ? "…" : ""}</Link>
                    <p className="text-sm text-ink/60 dark:text-paper/60 mt-1">
                      {q.subject} · <Link to={`/neet-practice/${q.chapterSlug}`} className="hover:underline">{q.chapter}</Link>
                      {q.pyqYear && <> · NEET {q.pyqYear}</>} · <b>{q.accuracy}%</b> correct of {n(q.answers)} answers
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className="mt-12 space-y-3 text-ink/80 dark:text-paper/80 max-w-3xl">
            <h2 className="font-display text-2xl font-bold text-ink dark:text-paper">How these numbers are worked out</h2>
            <p>We count every answered question in submitted YNeet mock tests and every chapter-practice answer from Class 11, Class 12 and dropper students. Skipped questions don't count. A chapter is ranked only after at least {data.minChapterAnswers} answers, and a question only after 10. Only totals are used: no names or personal data. The page refreshes as students keep practising.</p>
            <h2 className="font-display text-2xl font-bold text-ink dark:text-paper pt-2">How to use it</h2>
            <p>A chapter that is both high-weightage and low-accuracy is where most students lose marks, so it's where extra practice pays off most. Start with those, revise the concept from NCERT, then practise its previous year questions until your accuracy beats the average here.</p>
          </section>

          {faqs.length > 0 && (
            <section className="mt-10 max-w-3xl">
              <h2 className="font-display text-2xl font-bold">FAQs</h2>
              <div className="mt-3 space-y-4">
                {faqs.map((f) => (
                  <div key={f.q}>
                    <h3 className="font-semibold">{f.q}</h3>
                    <p className="text-ink/80 dark:text-paper/80 mt-1">{f.a}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify([
                {
                  "@context": "https://schema.org",
                  "@type": "Dataset",
                  name: "Most-missed NEET chapters and questions (YNeet student data)",
                  description: `Accuracy per NEET chapter and the most-missed questions, from ${data.totals.answers} answers by ${data.totals.students} NEET students in YNeet mock tests and practice.`,
                  url: `${SITE_ORIGIN}/neet-most-missed-chapters`,
                  dateModified: data.updatedAt,
                  creator: { "@type": "Organization", name: "YNeet by Raise Academy", url: `${SITE_ORIGIN}/` },
                  isAccessibleForFree: true,
                  keywords: ["NEET", "hardest chapters", "chapter-wise accuracy", "NEET Physics", "NEET Chemistry", "NEET Biology"],
                },
                {
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
                },
              ]).replace(/</g, "\\u003c"),
            }}
          />
        </>
      )}

      <div className="mt-10 p-6 rounded-2xl bg-ink text-paper">
        <p className="font-display font-bold text-xl">See your own weak chapters</p>
        <p className="text-sm text-paper/75 mt-2">YNeet's Chapter Priority map compares your accuracy with these averages and tells you what to study next. Free for 30 days.</p>
        <Link to="/register" className="mt-4 inline-flex items-center gap-2 bg-gold text-ink font-semibold px-6 py-3 rounded-full hover:bg-gold-dark">Start free for 30 days <ArrowRight size={16} /></Link>
      </div>
    </div>
  );
};

export default NeetMostMissed;
