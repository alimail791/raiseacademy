// Tamil / Hindi / Telugu / Kannada versions of the NEET cutoff and chapter-wise
// weightage pages: /<lang>/neet-cutoff, /<lang>/neet-cutoff/<state>,
// /<lang>/neet-chapter-wise-weightage. Same data and layout as the English
// pages; all text comes from i18n/regional.ts.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowRight } from "lucide-react";
import { SITE_ORIGIN } from "../seo";
import { useInitialPracticeData, YNEET_API, SUBJECTS, type CutoffState, type PracticeChapterSummary } from "../practice/practiceData";
import { useCutoffs } from "./NeetCutoff";
import NotFound from "./NotFound";
import {
  STR, LANGS, LANG_NAME, CUTOFF_STATES, langsForState, stateName, fmtNum,
  regionalCutoffMeta, regionalCutoffIndexMeta, regionalWeightageMeta, type Lang,
} from "../i18n/regional";

const TOTAL: Record<string, number> = { Physics: 45, Chemistry: 45, Biology: 90 };

function setMeta(lang: Lang, title: string, description: string, path: string) {
  document.title = title;
  document.documentElement.lang = lang;
  const set = (sel: string, attr: string, val: string, make: () => HTMLElement) => {
    let el = document.head.querySelector(sel) as HTMLElement | null;
    if (!el) { el = make(); document.head.appendChild(el); }
    el.setAttribute(attr, val);
  };
  const meta = (k: string, prop = false) => () => { const e = document.createElement("meta"); e.setAttribute(prop ? "property" : "name", k); return e; };
  set('meta[name="description"]', "content", description, meta("description"));
  set('meta[name="robots"]', "content", "index, follow", meta("robots"));
  set('meta[property="og:title"]', "content", title, meta("og:title", true));
  set('meta[property="og:url"]', "content", `${SITE_ORIGIN}${path}`, meta("og:url", true));
  set('link[rel="canonical"]', "href", `${SITE_ORIGIN}${path}`, () => { const l = document.createElement("link"); l.setAttribute("rel", "canonical"); return l; });
}
// Put the page language back when leaving a regional page.
function useLang(lang: Lang) {
  useEffect(() => () => { document.documentElement.lang = "en"; }, []);
  return STR[lang];
}

// "Read in English · हिन्दी · …" — the other versions of this page.
function LangBar({ lang, enPath, langs }: { lang: Lang; enPath: string; langs: Lang[] }) {
  return (
    <nav className="flex flex-wrap gap-2 text-sm mb-4" aria-label="Language">
      <Link to={enPath} className="px-3 py-1 rounded-full border border-ink/15 dark:border-paper/20 hover:border-gold">{STR[lang].readEnglish}</Link>
      {langs.filter((l) => l !== lang).map((l) => (
        <Link key={l} to={`/${l}${enPath}`} lang={l} className="px-3 py-1 rounded-full border border-ink/15 dark:border-paper/20 hover:border-gold">{LANG_NAME[l]}</Link>
      ))}
    </nav>
  );
}

function Cta({ title, body, btn, to }: { title: string; body: string; btn: string; to: string }) {
  return (
    <div className="my-8 rounded-2xl bg-ink text-paper p-6">
      <p className="font-display font-bold text-xl">{title}</p>
      <p className="text-sm text-paper/75 mt-2">{body}</p>
      <Link to={to} className="mt-4 inline-flex items-center gap-2 bg-gold text-ink font-semibold px-6 py-3 rounded-full hover:bg-gold-dark">{btn} <ArrowRight size={16} /></Link>
    </div>
  );
}

const forLang = (lang: Lang, states: CutoffState[]) =>
  CUTOFF_STATES[lang].map((slug) => states.find((s) => s.slug === slug)).filter(Boolean) as CutoffState[];

export const RegionalCutoffIndex = ({ lang }: { lang: Lang }) => {
  const s = useLang(lang);
  const states = useCutoffs();
  useEffect(() => { const m = regionalCutoffIndexMeta(lang); setMeta(lang, m.title, m.description, `/${lang}/neet-cutoff`); }, [lang]);
  const mine = states ? forLang(lang, states) : [];
  const others = states ? states.filter((x) => !CUTOFF_STATES[lang].includes(x.slug)) : [];

  return (
    <div lang={lang} className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <LangBar lang={lang} enPath="/neet-cutoff" langs={LANGS} />
      <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm">{s.idxEyebrow}</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2 leading-tight">{s.idxH1}</h1>
      <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg">{s.idxIntro}</p>
      {states === undefined && <p className="mt-8 text-ink/50">{s.loading}</p>}
      {states === null && <p className="mt-8 text-ink/60">{s.loadError}</p>}
      {mine.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="text-left border-b border-ink/15 dark:border-paper/20">{s.idxTh.map((h) => <th key={h} className="py-2 pr-3">{h}</th>)}</tr></thead>
            <tbody>
              {mine.map((c) => {
                const open = c.categorySummary.find((x) => x.category === "OPEN");
                return (
                  <tr key={c.slug} className="border-b border-ink/5 dark:border-paper/10">
                    <td className="py-2 pr-3"><Link to={`/${lang}/neet-cutoff/${c.slug}`} className="font-semibold text-rise-dark hover:underline">{s.idxLink(stateName(lang, c), c.year)}</Link></td>
                    <td className="py-2 pr-3">{c.colleges.length}</td>
                    <td className="py-2 pr-3">{fmtNum(open?.last)}</td>
                    <td className="py-2 text-ink/60 dark:text-paper/60">{s.unit[c.rankType]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {others.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-bold">{s.idxOthers}</h2>
          <ul className="mt-3 flex flex-wrap gap-2 text-sm" lang="en">
            {others.map((c) => <li key={c.slug}><Link to={`/neet-cutoff/${c.slug}`} className="inline-block px-3 py-1.5 rounded-full border border-ink/15 dark:border-paper/20 hover:border-gold">{c.code === "AIQ" ? "All India Quota" : c.name}</Link></li>)}
          </ul>
        </section>
      )}
      <Cta title={s.ctaTitle} body={s.ctaBody} btn={s.ctaBtn} to="/neet-college-predictor" />
    </div>
  );
};

export const RegionalCutoffState = ({ lang }: { lang: Lang }) => {
  const s = useLang(lang);
  const { state = "" } = useParams();
  const states = useCutoffs(state);
  const c = states?.find((x) => x.slug === state);
  const allowed = CUTOFF_STATES[lang].includes(state);

  useEffect(() => { if (c) { const m = regionalCutoffMeta(lang, c); setMeta(lang, m.title, m.description, `/${lang}/neet-cutoff/${c.slug}`); } }, [c, lang]);

  if (!allowed) return <NotFound />;
  if (states === undefined) return <div className="max-w-3xl mx-auto px-4 py-20 text-ink/50">{s.loading}</div>;
  if (!c) return <NotFound />;

  const name = stateName(lang, c);
  const v = (n?: number) => s.value(fmtNum(n), c.rankType);
  const open = c.categorySummary.find((x) => x.category === "OPEN");
  const top = c.colleges[0];
  const word = s.valueWord(c.rankType);
  const cat = (k: string) => (k === "OPEN" ? s.general : k);
  const siblings = states ? forLang(lang, states).filter((x) => x.slug !== c.slug) : [];

  return (
    <div lang={lang} className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <LangBar lang={lang} enPath={`/neet-cutoff/${c.slug}`} langs={langsForState(c.slug)} />
      <nav className="text-sm text-ink/55 dark:text-paper/55"><Link to={`/${lang}/neet-cutoff`} className="hover:underline">{s.crumb}</Link> › <span>{name}</span></nav>
      <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight mt-3">{s.h1(name, c.year)}</h1>
      <p className="text-ink/75 dark:text-paper/75 mt-3 leading-relaxed">
        {s.intro(name, c.year, c.round, c.colleges.length, s.unit[c.rankType])}
        {open && s.introOpen(v(open.last))}
        {open && top?.closing.OPEN !== undefined && s.introTop(top.college, v(top.closing.OPEN))}
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">{s.catH2}</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead><tr className="text-left border-b border-ink/15 dark:border-paper/20">
            <th className="py-2 pr-3">{s.th.category}</th><th className="py-2 pr-3">{s.th.toughest}</th><th className="py-2 pr-3">{s.th.last}</th><th className="py-2">{s.th.colleges}</th>
          </tr></thead>
          <tbody>
            {c.categorySummary.map((x) => (
              <tr key={x.category} className="border-b border-ink/5 dark:border-paper/10">
                <td className="py-2 pr-3 font-semibold">{cat(x.category)}</td><td className="py-2 pr-3">{fmtNum(x.toughest)}</td><td className="py-2 pr-3">{fmtNum(x.last)}</td><td className="py-2">{x.colleges}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink/55 dark:text-paper/55 mt-2">{c.rankType === "SCORE" ? s.noteScore : s.noteRank} {s.noteExcluded}</p>

      <h2 className="font-display text-2xl font-bold mt-10">{s.collegesH2(name, word, c.year)}</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead><tr className="text-left border-b border-ink/15 dark:border-paper/20">
            <th className="py-2 pr-3">{s.th.college}</th>
            {c.categories.map((k) => <th key={k} className="py-2 pr-3 text-right whitespace-nowrap">{cat(k)}</th>)}
          </tr></thead>
          <tbody lang="en">
            {c.colleges.map((col) => (
              <tr key={col.college} className="border-b border-ink/5 dark:border-paper/10">
                <td className="py-2 pr-3">{col.college}</td>
                {c.categories.map((k) => <td key={k} className="py-2 pr-3 text-right">{fmtNum(col.closing[k])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(c.privateMbbs || c.govtBds) && (
        <section className="mt-10 space-y-2 text-ink/80 dark:text-paper/80">
          <h2 className="font-display text-2xl font-bold text-ink dark:text-paper">{s.pvtH2}</h2>
          {c.privateMbbs && <p>{s.pvtLine(c.privateMbbs.colleges, v(c.privateMbbs.toughest), v(c.privateMbbs.last))}</p>}
          {c.govtBds && <p>{s.bdsLine(c.govtBds.colleges, v(c.govtBds.toughest), v(c.govtBds.last))}</p>}
        </section>
      )}

      <Cta title={s.ctaTitle} body={s.ctaBody} btn={s.ctaBtn} to="/neet-college-predictor" />

      <section className="space-y-3 text-ink/80 dark:text-paper/80 leading-relaxed">
        <h2 className="font-display text-2xl font-bold text-ink dark:text-paper">{s.howH2}</h2>
        <p>{s.how1(c.year, c.rankType)}</p>
        <p>{s.how2(c.code === "AIQ" || c.code === "DL")}</p>
      </section>

      {siblings.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-bold">{s.otherH2}</h2>
          <ul className="mt-3 flex flex-wrap gap-2 text-sm">
            {siblings.map((x) => <li key={x.slug}><Link to={`/${lang}/neet-cutoff/${x.slug}`} className="inline-block px-3 py-1.5 rounded-full border border-ink/15 dark:border-paper/20 hover:border-gold">{stateName(lang, x)}</Link></li>)}
            <li><Link to={`/${lang}/neet-cutoff`} className="inline-block px-3 py-1.5 rounded-full border border-ink/15 dark:border-paper/20 hover:border-gold">{s.crumb} →</Link></li>
          </ul>
        </section>
      )}
    </div>
  );
};

export const RegionalWeightage = ({ lang }: { lang: Lang }) => {
  const s = useLang(lang);
  const initial = useInitialPracticeData();
  const [chapters, setChapters] = useState<PracticeChapterSummary[] | null>(initial.chapters || null);
  useEffect(() => {
    const m = regionalWeightageMeta(lang); setMeta(lang, m.title, m.description, `/${lang}/neet-chapter-wise-weightage`);
    if (!YNEET_API) return;
    axios.get(`${YNEET_API}/public/practice`).then((r) => setChapters(r.data.chapters || [])).catch(() => setChapters((c) => c || []));
  }, [lang]);

  const ranked = (subject: string) => (chapters || []).filter((c) => c.subject === subject && c.weightage).sort((a, b) => b.weightage!.expectedQs - a.weightage!.expectedQs);
  const top = SUBJECTS.flatMap((x) => ranked(x).slice(0, 3));

  return (
    <div lang={lang} className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <LangBar lang={lang} enPath="/neet-chapter-wise-weightage" langs={LANGS} />
      <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm">{s.wEyebrow}</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2 leading-tight">{s.wH1}</h1>
      <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg max-w-3xl leading-relaxed">{s.wIntro}</p>
      {chapters === null && <p className="mt-10 text-ink/50">{s.loading}</p>}

      {top.length > 0 && (
        <section className="mt-8 p-5 rounded-2xl bg-gold/15 border border-gold/40">
          <h2 className="font-display text-xl font-bold">{s.wTop}</h2>
          <ul className="mt-3 grid sm:grid-cols-3 gap-2 text-sm">
            {top.map((c) => (
              <li key={c.slug}><Link to={`/neet-practice/${c.slug}`} lang="en" className="font-semibold text-rise-dark hover:underline">{c.chapter}</Link> <span className="text-ink/60 dark:text-paper/60">· {s.subject[c.subject]} · ~{c.weightage!.expectedQs} {s.wQs}</span></li>
            ))}
          </ul>
        </section>
      )}

      {SUBJECTS.map((subject) => {
        const list = ranked(subject);
        if (!list.length) return null;
        return (
          <section key={subject} className="mt-10">
            <h2 className="font-display text-2xl font-bold">{s.wSubjectH2(s.subject[subject])}</h2>
            <p className="text-sm text-ink/60 dark:text-paper/60 mt-1">{s.wSubjectSub(TOTAL[subject], TOTAL[subject] * 4)}</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead><tr className="text-left border-b border-ink/15 dark:border-paper/20">
                  {s.wTh.map((h, i) => <th key={h} className={`py-2 pr-2 ${i === 3 || i === 4 ? "text-right" : ""}`}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.slug} className="border-b border-ink/5 dark:border-paper/10">
                      <td className="py-2 pr-2 text-ink/50 dark:text-paper/50">{c.weightage!.rank}</td>
                      <td className="py-2 pr-2" lang="en"><Link to={`/neet-practice/${c.slug}`} className="text-rise-dark font-semibold hover:underline">{c.chapter}</Link></td>
                      <td className="py-2 pr-2">{c.weightage!.classLevel.replace(/th/g, "")}</td>
                      <td className="py-2 pr-2 text-right">~{c.weightage!.expectedQs}</td>
                      <td className="py-2 pr-2 text-right">~{c.weightage!.marks}</td>
                      <td className={`py-2 font-semibold ${c.weightage!.priority === "High" ? "text-rise-dark" : c.weightage!.priority === "Low" ? "text-ink/50 dark:text-paper/50" : ""}`}>{s.priority[c.weightage!.priority]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <section className="mt-12 space-y-3 text-ink/80 dark:text-paper/80 max-w-3xl leading-relaxed">
        <h2 className="font-display text-2xl font-bold text-ink dark:text-paper">{s.wHowH2}</h2>
        <p>{s.wHowP}</p>
        <h2 className="font-display text-2xl font-bold text-ink dark:text-paper pt-2">{s.wUseH2}</h2>
        <p>{s.wUseP1}</p>
        <p>{s.wUseP2}</p>
      </section>
      <Cta title={s.wCtaTitle} body={s.wCtaBody} btn={s.wCtaBtn} to="/register" />
    </div>
  );
};

// Small "read in …" links for the English pages.
export function RegionalLinks({ path, langs }: { path: string; langs: Lang[] }) {
  if (!langs.length) return null;
  return (
    <p className="flex flex-wrap gap-2 text-sm mb-4">
      {langs.map((l) => (
        <Link key={l} to={`/${l}${path}`} lang={l} className="px-3 py-1 rounded-full border border-ink/15 dark:border-paper/20 hover:border-gold">
          {LANG_NAME[l]}
        </Link>
      ))}
    </p>
  );
}
