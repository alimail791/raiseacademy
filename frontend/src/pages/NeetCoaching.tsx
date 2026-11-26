import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { SITE_ORIGIN } from "../seo";

// NEET coaching directory: institutes that made a free YNeet tools page
// (pages/QotdWidget.tsx → "No website?") and ticked "list my institute".
//   /neet-coaching          cities
//   /neet-coaching/<city>   institutes in one city
// Pages with only a few institutes stay noindex until they're worth a search
// result (MIN_TO_INDEX), so thin pages don't hurt the site's SEO.

const MIN_TO_INDEX = 3;
const KIND: Record<string, string> = { coaching: "Coaching centre", school: "School", teacher: "Tutor" };

function setMeta(title: string, description: string, path: string, index: boolean) {
  document.title = title;
  const set = (sel: string, attr: string, val: string, make: () => HTMLElement) => {
    let el = document.head.querySelector(sel) as HTMLElement | null;
    if (!el) { el = make(); document.head.appendChild(el); }
    el.setAttribute(attr, val);
  };
  const meta = (k: string) => () => { const e = document.createElement("meta"); e.setAttribute("name", k); return e; };
  set('meta[name="description"]', "content", description, meta("description"));
  set('meta[name="robots"]', "content", index ? "index, follow" : "noindex, follow", meta("robots"));
  set('link[rel="canonical"]', "href", `${SITE_ORIGIN}${path}`, () => { const l = document.createElement("link"); l.setAttribute("rel", "canonical"); return l; });
}

const GetListed = () => (
  <div className="mt-12 rounded-2xl border border-gold/50 bg-gold/10 p-5">
    <p className="font-bold text-lg">Run a NEET coaching centre or school?</p>
    <p className="mt-1 text-ink/70 dark:text-paper/70">Get listed here free, plus your own NEET tools page, a notice-board poster and a daily WhatsApp status image for your students.</p>
    <Link to="/neet-question-widget#no-website" className="inline-block mt-3 bg-gold text-ink font-bold px-5 py-3 rounded-full hover:bg-gold-dark">Get listed free</Link>
  </div>
);

type City = { slug: string; city: string; count: number };

export const NeetCoachingIndex = () => {
  const [cities, setCities] = useState<City[] | null>(null);
  useEffect(() => {
    api.get("/widgets/directory").then((r) => setCities(r.data.cities || [])).catch(() => setCities([]));
  }, []);
  useEffect(() => {
    if (!cities) return;
    const total = cities.reduce((n, c) => n + c.count, 0);
    setMeta("NEET Coaching Centres by City — Free NEET Tools from Local Institutes | YNeet",
      "Find NEET coaching centres and schools near you, city by city. Each offers free NEET tools for students: daily NEET question, college predictor, cutoffs and chapter weightage.",
      "/neet-coaching", total >= 10);
  }, [cities]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <p className="text-gold-deep dark:text-gold font-semibold uppercase tracking-widest text-sm">Directory</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">NEET coaching centres by city</h1>
      <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg max-w-3xl">Coaching centres and schools that give their NEET students free YNeet tools. Pick your city.</p>
      {cities === null && <p className="mt-8 text-ink/70">Loading…</p>}
      {cities && !cities.length && <p className="mt-8 text-ink/70">No institutes listed yet.</p>}
      {cities && cities.length > 0 && (
        <ul className="mt-8 grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {cities.map((c) => (
            <li key={c.slug}>
              <Link to={`/neet-coaching/${c.slug}`} className="block rounded-xl border border-ink/10 dark:border-paper/15 p-4 hover:border-gold">
                <b>NEET coaching in {c.city}</b><br /><span className="text-sm text-ink/60 dark:text-paper/60">{c.count} institute{c.count === 1 ? "" : "s"}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <GetListed />
    </div>
  );
};

type Inst = { name: string; slug: string; city: string; kind: string; website: string };

export const NeetCoachingCity = () => {
  const { city = "" } = useParams();
  const [d, setD] = useState<{ city: string; institutes: Inst[] } | null | undefined>(undefined);
  useEffect(() => {
    setD(undefined);
    api.get(`/widgets/directory/${encodeURIComponent(city)}`).then((r) => setD(r.data)).catch(() => setD(null));
  }, [city]);
  useEffect(() => {
    if (d === undefined) return;
    if (!d) { setMeta("NEET coaching — YNeet", "NEET coaching directory by YNeet.", `/neet-coaching/${city}`, false); return; }
    setMeta(`NEET Coaching in ${d.city} — ${d.institutes.length} Institute${d.institutes.length === 1 ? "" : "s"} with Free NEET Tools | YNeet`,
      `NEET coaching centres and schools in ${d.city} that give students free NEET tools: daily NEET question, college predictor, MBBS cutoffs and chapter weightage.`,
      `/neet-coaching/${city}`, d.institutes.length >= MIN_TO_INDEX);
  }, [d, city]);

  if (d === undefined) return <div className="max-w-5xl mx-auto px-4 py-12 text-ink/70">Loading…</div>;
  if (d === null) return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl font-bold">No institutes listed here yet</h1>
      <p className="mt-3 text-ink/70 dark:text-paper/70"><Link to="/neet-coaching" className="underline font-semibold">See all cities</Link>.</p>
      <GetListed />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <Link to="/neet-coaching" className="text-sm underline text-ink/70 dark:text-paper/70">All cities</Link>
      <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">NEET coaching in {d.city}</h1>
      <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg max-w-3xl">
        {d.institutes.length} coaching centre{d.institutes.length === 1 ? "" : "s"} and school{d.institutes.length === 1 ? "" : "s"} in {d.city} that give NEET students free tools: a daily NEET question, a college predictor, MBBS cutoffs and chapter-wise weightage.
      </p>
      <ul className="mt-8 grid sm:grid-cols-2 gap-4">
        {d.institutes.map((x) => (
          <li key={x.slug} className="rounded-2xl border border-ink/10 dark:border-paper/15 p-5">
            <p className="text-xs uppercase tracking-wider text-ink/60 dark:text-paper/60">{KIND[x.kind] || "Institute"}</p>
            <h2 className="font-display text-xl font-bold mt-1">{x.name}</h2>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <Link to={`/i/${x.slug}`} className="bg-gold text-ink font-semibold px-4 py-2 rounded-full">Free NEET tools</Link>
              {x.website && <a href={x.website} target="_blank" rel="nofollow noopener" className="border border-ink/20 dark:border-paper/25 font-semibold px-4 py-2 rounded-full">{/classcoach\.in\//.test(x.website) ? "Profile & join class ↗" : "Website ↗"}</a>}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-ink/60 dark:text-paper/60">Institutes list themselves here. YNeet doesn't rank or endorse them.</p>
      <p className="mt-4 text-sm"><a href={`https://www.classcoach.in/tutors/${city}?utm_source=yneet&utm_medium=directory`} target="_blank" rel="noopener" className="underline font-semibold">Tutors in {d.city} for other subjects and classes (ClassCoach) ↗</a></p>
      <GetListed />
      <p className="mt-4 text-sm"><Link to="/advertise#packages" className="underline font-semibold">Want the top spot in {d.city}? Get featured →</Link></p>
    </div>
  );
};
