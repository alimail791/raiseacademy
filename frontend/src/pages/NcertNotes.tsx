import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowRight, BookOpen, AlertTriangle } from "lucide-react";
import { SITE_ORIGIN } from "../seo";
import { NCERT_NOTES, ncertMeta, type NcertNote } from "../ncert/notes";
import { useInitialPracticeData, YNEET_API, type PracticeChapterSummary } from "../practice/practiceData";
import NotFound from "./NotFound";

const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

function setMeta(n: NcertNote) {
  const m = ncertMeta(n);
  const url = `${SITE_ORIGIN}/ncert-notes/${n.slug}`;
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
  set('meta[property="og:url"]', "content", url, meta("og:url", true));
  set('link[rel="canonical"]', "href", url, () => { const l = document.createElement("link"); l.setAttribute("rel", "canonical"); return l; });
}

// The matching free PYQ chapter page, if the bank has one under the same name.
function usePracticeLink(n?: NcertNote) {
  const initial = useInitialPracticeData();
  const [chapters, setChapters] = useState<PracticeChapterSummary[]>(initial.chapters || []);
  useEffect(() => {
    if (chapters.length || !YNEET_API) return;
    axios.get(`${YNEET_API}/public/practice`).then((r) => setChapters(r.data.chapters || [])).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!n) return null;
  const want = `${slugify(n.subject)}/${slugify(n.chapter)}`;
  const hit = chapters.find((c) => c.slug === want) || chapters.find((c) => c.subject === n.subject && slugify(c.chapter) === slugify(n.chapter));
  return hit ? { href: `/neet-practice/${hit.slug}`, total: hit.total } : null;
}

export const NcertIndex = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
    <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm">Free · No login</p>
    <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">NCERT Biology Notes for NEET</h1>
    <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg">
      Short, chapter-wise NCERT notes: the points NEET asks most, a quick table and the common traps. Read one in 10 minutes, then test yourself on the chapter's previous year questions.
    </p>
    {[11, 12].map((cls) => (
      <section key={cls} className="mt-10">
        <h2 className="font-display text-2xl font-bold">Class {cls} Biology</h2>
        <ul className="mt-4 grid sm:grid-cols-2 gap-3">
          {NCERT_NOTES.filter((n) => n.cls === cls).map((n) => (
            <li key={n.slug}>
              <Link to={`/ncert-notes/${n.slug}`} className="flex items-start gap-3 p-4 rounded-xl border border-ink/10 dark:border-paper/15 hover:border-gold h-full">
                <BookOpen className="text-gold-dark shrink-0 mt-0.5" size={20} />
                <span className="font-semibold">{n.chapter}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    ))}
    <p className="mt-10 text-sm text-ink/60 dark:text-paper/60">More chapters are being added. Meanwhile, every chapter has free <Link to="/neet-practice" className="underline font-semibold">NEET PYQs with answers</Link>.</p>
  </div>
);

export const NcertChapter = () => {
  const { slug = "" } = useParams();
  const n = NCERT_NOTES.find((x) => x.slug === slug);
  const practice = usePracticeLink(n);
  useEffect(() => { if (n) setMeta(n); }, [n]);
  if (!n) return <NotFound />;

  const same = NCERT_NOTES.filter((x) => x.slug !== n.slug);
  const practiceHref = practice?.href || "/neet-practice";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 flex flex-wrap gap-10">
      <article className="min-w-0" style={{ flex: "999 1 560px" }}>
        <nav className="text-sm text-ink/55 dark:text-paper/55">
          <Link to="/ncert-notes" className="hover:underline">NCERT notes</Link> › <span>Class {n.cls} {n.subject}</span>
        </nav>
        <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight mt-3">{n.chapter}: NCERT Notes for NEET</h1>
        <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg">{n.intro}</p>

        {n.sections.map((sec) => (
          <section key={sec.heading} className="mt-8">
            <h2 className="font-display text-2xl font-bold">{sec.heading}</h2>
            <ul className="mt-3 space-y-2.5 list-disc pl-5 marker:text-gold-dark">
              {sec.points.map((p) => <li key={p} className="leading-relaxed">{p}</li>)}
            </ul>
          </section>
        ))}

        {n.table && (
          <section className="mt-8">
            <h2 className="font-display text-2xl font-bold">{n.table.title}</h2>
            <div className="mt-3 overflow-x-auto rounded-2xl border border-ink/10 dark:border-paper/15">
              <table className="w-full min-w-[420px] text-sm">
                <thead><tr className="bg-ink/[0.04] dark:bg-paper/5">{n.table.head.map((h) => <th key={h} className="text-left p-3">{h}</th>)}</tr></thead>
                <tbody>
                  {n.table.rows.map((r) => (
                    <tr key={r.join("|")} className="border-t border-ink/10 dark:border-paper/10">{r.map((c, i) => <td key={i} className={`p-3 ${i === 0 ? "font-medium" : ""}`}>{c}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="mt-8 rounded-2xl bg-gold/15 border border-gold/40 p-5">
          <h2 className="font-display text-xl font-bold flex items-center gap-2"><AlertTriangle size={20} className="text-gold-dark" /> Common NEET traps</h2>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            {n.traps.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </section>

        <div className="mt-8 rounded-2xl bg-ink text-paper p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display text-xl font-bold">Now test yourself on {n.chapter}</p>
            <p className="text-paper/75 text-sm mt-1">Free NEET PYQs with answers{practice ? ` (${practice.total} in the bank)` : ""}. No login.</p>
          </div>
          <Link to={practiceHref} className="inline-flex items-center gap-2 bg-gold text-ink font-semibold px-5 py-3 rounded-full hover:bg-gold-dark">Practise PYQs <ArrowRight size={16} /></Link>
        </div>
        <p className="text-xs text-ink/50 dark:text-paper/50 mt-4">Based on the NCERT Class {n.cls} {n.subject} textbook. Always read the NCERT chapter itself too: NEET questions follow its exact lines.</p>
      </article>

      <aside className="flex flex-col gap-4" style={{ flex: "1 1 260px" }}>
        <div className="rounded-2xl border border-ink/10 dark:border-paper/15 p-5">
          <p className="font-bold">More NCERT notes</p>
          <ul className="mt-3 space-y-2 text-sm">
            {same.map((x) => <li key={x.slug}><Link to={`/ncert-notes/${x.slug}`} className="text-rise-dark hover:underline">{x.chapter}</Link></li>)}
          </ul>
        </div>
        <div className="rounded-2xl bg-rise-line text-paper p-5">
          <p className="font-bold">Revise with flashcards</p>
          <p className="text-sm text-paper/80 mt-1">Every chapter has flashcards, formula sheets and a mistake notebook inside YNeet. Free for 30 days.</p>
          <Link to="/register" className="mt-3 inline-block bg-gold text-ink font-semibold px-4 py-2 rounded-full text-sm">Start free</Link>
        </div>
      </aside>
    </div>
  );
};
