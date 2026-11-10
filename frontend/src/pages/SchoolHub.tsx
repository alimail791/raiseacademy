// Class 6–10 Science MCQ hub (/class-<n>-questions): every chapter of the class
// with links to its one-question pages. Built as real HTML at deploy time by
// scripts/prerender.mjs; falls back to the YNeet API in the browser.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight } from "lucide-react";
import { SITE_ORIGIN } from "../seo";
import { useInitialPracticeData, YNEET_API, SUBJECTS, SCHOOL_CLASSES, schoolHubMeta, schoolSubject, shorten, type SchoolHubData } from "../practice/practiceData";
import NotFound from "./NotFound";

function setMeta(d: SchoolHubData) {
  const total = d.classes.find((c) => c.classNum === d.classNum)?.total || d.links.length;
  const m = schoolHubMeta(d.classNum, total);
  const url = `${SITE_ORIGIN}/class-${d.classNum}-questions`;
  document.title = m.title;
  const set = (sel: string, attr: string, val: string, make: () => HTMLElement) => {
    let el = document.head.querySelector(sel) as HTMLElement | null;
    if (!el) { el = make(); document.head.appendChild(el); }
    el.setAttribute(attr, val);
  };
  const meta = (k: string, prop = false) => () => { const e = document.createElement("meta"); e.setAttribute(prop ? "property" : "name", k); return e; };
  set('meta[name="description"]', "content", m.description, meta("description"));
  set('meta[name="robots"]', "content", "index, follow", meta("robots"));
  set('meta[property="og:title"]', "content", m.title, meta("og:title", true));
  set('meta[property="og:description"]', "content", m.description, meta("og:description", true));
  set('meta[property="og:url"]', "content", url, meta("og:url", true));
  set('link[rel="canonical"]', "href", url, () => { const l = document.createElement("link"); l.setAttribute("rel", "canonical"); return l; });
}

const SchoolHub = ({ classNum }: { classNum: number }) => {
  const initial = useInitialPracticeData();
  const pre = initial.school && initial.school.classNum === classNum ? initial.school : undefined;
  const [d, setD] = useState<SchoolHubData | null | undefined>(pre);

  useEffect(() => {
    if (pre) { setD(pre); return; }
    if (!YNEET_API) { setD(null); return; }
    let alive = true;
    setD(undefined);
    axios.get(`${YNEET_API}/public/school-questions?class=${classNum}`)
      .then((r) => alive && setD({ classNum, classes: r.data.classes, chapters: r.data.class.chapters, links: r.data.links }))
      .catch(() => alive && setD(null));
    return () => { alive = false; };
  }, [classNum]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (d) setMeta(d); }, [d]);

  if (d === null) return <NotFound />;
  if (d === undefined) return <div className="max-w-3xl mx-auto px-4 py-20 text-ink/50">Loading questions…</div>;

  const total = d.classes.find((c) => c.classNum === classNum)?.total || d.links.length;
  const free = classNum <= 8;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <nav className="flex flex-wrap gap-2 text-sm">
        {SCHOOL_CLASSES.filter((n) => d.classes.some((c) => c.classNum === n)).map((n) => (
          <Link key={n} to={`/class-${n}-questions`}
            className={`px-3 py-1 rounded-full border ${n === classNum ? "bg-ink text-paper border-ink" : "border-ink/15 dark:border-paper/20 hover:border-gold"}`}>
            Class {n}
          </Link>
        ))}
      </nav>
      <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight mt-5">Class {classNum} Science MCQ Questions with Answers</h1>
      <p className="text-ink/70 dark:text-paper/70 mt-3">
        {total} free Class {classNum} Science multiple-choice questions, chapter-wise, each with the answer and a short explanation. No login needed.
      </p>

      {SUBJECTS.map((subject) => {
        const chs = d.chapters.filter((c) => c.subject === subject);
        if (!chs.length) return null;
        return (
          <section key={subject} className="mt-10">
            <h2 className="font-display text-2xl font-bold">{schoolSubject(subject)}</h2>
            {chs.map((c) => (
              <div key={c.slug} id={c.slug} className="mt-6 scroll-mt-24">
                <h3 className="font-semibold text-lg">{c.chapter} <span className="text-sm font-normal text-ink/50 dark:text-paper/50">({c.count} questions)</span></h3>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {d.links.filter((l) => l.chapterSlug === c.slug).map((l) => (
                    <li key={l.slug}>
                      <Link to={`/class-${classNum}-questions/${l.slug}`} className="text-rise-dark hover:underline">{shorten(l.question, 120)}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        );
      })}

      <div className="my-10 rounded-2xl bg-ink text-paper p-6">
        <p className="font-display font-bold text-xl">{free ? `Free Class ${classNum} tests, puzzles and quizzes` : `Class ${classNum} Science tests + NEET Foundation`}</p>
        <p className="text-sm text-paper/75 mt-2">
          {free
            ? "YNeet is free for Class 6–8: chapter tests on your school syllabus, daily puzzles and a weekly Brain Teaser."
            : `Timed chapter tests on your Class ${classNum} syllabus, your score and weak topics, and an early start on NEET.`}
        </p>
        <Link to="/register" className="mt-4 inline-flex items-center gap-2 bg-gold text-ink font-semibold px-6 py-3 rounded-full hover:bg-gold-dark">
          {free ? "Start free" : "Start free for 30 days"} <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
};

export default SchoolHub;
