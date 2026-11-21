import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Check, X } from "lucide-react";
import { landingByPath, type DemoQ, type LandingPage } from "../landing/landingPages";
import { QuickSignup, track } from "../components/SignupNudge";
import NotFound from "./NotFound";

// Landing pages for questions students ask AI assistants and Google
// (data: landing/landingPages.ts). Order: direct answer → live demo with real
// NEET PYQs → real app screenshots → features → sign-up → FAQs → links.

const LETTERS = ["A", "B", "C", "D"];

function DemoQuestion({ q, n, place }: { q: DemoQ; n: number; place: string }) {
  const [picked, setPicked] = useState<number | null>(null);
  const shown = picked !== null;
  return (
    <div className="rounded-2xl border border-ink/10 dark:border-paper/15 bg-white dark:bg-ink-light p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-gold-deep dark:text-gold">Q{n} · {q.subject} · {q.chapter} · NEET {q.year}</p>
      <p className="mt-2 font-semibold leading-snug">{q.q}</p>
      <div className="mt-3 space-y-2">
        {q.options.map((o, k) => {
          const right = shown && q.answer === k;
          const wrong = shown && picked === k && !right;
          return (
            <button key={k} type="button" disabled={shown} onClick={() => { setPicked(k); track("landing_demo_answer", { place, correct: k === q.answer }); }}
              className={`w-full text-left flex gap-3 px-4 py-2.5 rounded-xl border min-h-[44px] text-sm ${right ? "border-rise bg-rise/10 font-semibold" : wrong ? "border-red-400 bg-red-50 dark:bg-red-900/20" : "border-ink/15 dark:border-paper/15 hover:border-gold"}`}>
              <b>{LETTERS[k]}.</b> {o}
              {right && <Check size={18} className="ml-auto text-rise-dark shrink-0" />}
              {wrong && <X size={18} className="ml-auto text-red-500 shrink-0" />}
            </button>
          );
        })}
      </div>
      <details open={shown} className="mt-3 text-sm">
        <summary className="cursor-pointer font-semibold text-rise-dark">Answer and explanation</summary>
        <p className="mt-2"><b>Answer: {LETTERS[q.answer]}. {q.options[q.answer]}</b></p>
        <p className="mt-1 text-ink/75 dark:text-paper/75">{q.explanation}</p>
      </details>
    </div>
  );
}

function Landing({ p }: { p: LandingPage }) {
  const wide = p.shots.filter((s) => !s.mobile);
  const phones = p.shots.filter((s) => s.mobile);
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <p className="text-gold-deep dark:text-gold font-semibold uppercase tracking-widest text-sm">{p.eyebrow}</p>
      <h1 className="font-display text-3xl sm:text-5xl font-bold mt-2 leading-tight max-w-3xl">{p.h1}</h1>
      <p className="text-ink/70 dark:text-paper/70 mt-4 text-lg max-w-3xl">{p.intro}</p>
      <div className="web-only mt-6 flex flex-wrap gap-3 items-center">
        <Link to={`/register?from=${p.place}`} onClick={() => track("landing_cta", { place: p.place, pos: "hero" })}
          className="inline-flex items-center gap-2 bg-gold text-ink font-bold px-6 py-3 rounded-full hover:bg-gold-dark">Start free for 30 days <ArrowRight size={18} /></Link>
        <a href="#demo" className="font-semibold underline">Try the demo first</a>
      </div>

      {/* Direct answer: what someone asking ChatGPT / Google wants first. */}
      <section className="mt-10 rounded-3xl border border-gold/50 bg-gold/10 p-6 sm:p-8">
        <h2 className="font-display text-2xl font-bold">{p.answer.q}</h2>
        <p className="mt-3 text-ink/85 dark:text-paper/85">{p.answer.a}</p>
        <ul className="mt-3 space-y-2">
          {p.answer.points.map((pt) => (
            <li key={pt} className="flex gap-2"><Check size={18} className="text-rise-dark shrink-0 mt-1" /><span>{pt}</span></li>
          ))}
        </ul>
      </section>

      <section id="demo" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-2xl sm:text-3xl font-bold">{p.demoTitle}</h2>
        <p className="text-ink/70 dark:text-paper/70 mt-2">Real NEET previous year questions from the YNeet question bank. Tap an option to check your answer.</p>
        <div className="mt-5 grid md:grid-cols-3 gap-4">
          {p.demo.map((q, i) => <DemoQuestion key={q.q} q={q} n={i + 1} place={p.place} />)}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl sm:text-3xl font-bold">Inside the YNeet app</h2>
        <p className="text-ink/70 dark:text-paper/70 mt-2">Real screens from the app, shown with a demo student.</p>
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          {wide.map((s) => (
            <figure key={s.src} className="m-0">
              <img src={`/screens/${s.src}.webp`} alt={s.alt} loading="lazy" width={1280} height={s.src === "yneet-analysis-chapters" ? 730 : s.src === "yneet-analysis-plan" ? 820 : 860}
                className="w-full h-auto rounded-2xl border border-ink/10 dark:border-paper/15 shadow-lg" />
              <figcaption className="mt-2 text-sm text-ink/70 dark:text-paper/70"><b className="text-ink dark:text-paper">{s.title}.</b> {s.caption}</figcaption>
            </figure>
          ))}
          {phones.map((s) => (
            <figure key={s.src} className="m-0 flex flex-col items-center">
              <img src={`/screens/${s.src}.webp`} alt={s.alt} loading="lazy" width={780} height={1300}
                className="w-56 h-auto rounded-[2rem] border-[6px] border-ink shadow-lg" />
              <figcaption className="mt-2 text-sm text-center text-ink/70 dark:text-paper/70"><b className="text-ink dark:text-paper">{s.title}.</b> {s.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl sm:text-3xl font-bold">What you get</h2>
        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          {p.features.map((f) => (
            <div key={f.h} className="rounded-2xl border border-ink/10 dark:border-paper/15 p-5">
              <h3 className="font-bold text-lg">{f.h}</h3>
              <p className="mt-1 text-ink/75 dark:text-paper/75">{f.p}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="web-only mt-12 rounded-3xl bg-rise-line text-paper p-7 sm:p-9">
        <p className="font-display text-2xl sm:text-3xl font-bold">{p.ctaTitle}</p>
        <p className="text-paper/80 mt-2">{p.ctaText}</p>
        <QuickSignup place={p.place} />
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl sm:text-3xl font-bold">Frequently asked questions</h2>
        <div className="mt-4 space-y-3">
          {p.faqs.map(([q, a]) => (
            <details key={q} className="rounded-2xl border border-ink/10 dark:border-paper/15 p-4">
              <summary className="cursor-pointer font-semibold">{q}</summary>
              <p className="mt-2 text-ink/75 dark:text-paper/75">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-bold">Free NEET pages to try next</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {p.related.filter((r, i, all) => all.findIndex((x) => x.to === r.to) === i).map((r) => (
            <Link key={r.to} to={r.to} className="text-sm px-4 py-2 rounded-full border border-ink/15 dark:border-paper/20 hover:border-gold">{r.label}</Link>
          ))}
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify([
          { "@context": "https://schema.org", "@type": "FAQPage",
            mainEntity: [[p.answer.q, `${p.answer.a} ${p.answer.points.join(" ")}`] as [string, string], ...p.faqs].map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
          { "@context": "https://schema.org", "@type": "EducationalOrganization", name: "YNeet", url: "https://www.yneet.in/", description: "NEET preparation platform with mock tests, previous year questions and chapter-wise analysis." },
        ]).replace(/</g, "\\u003c"),
      }} />
    </div>
  );
}

export default function YneetLanding() {
  const { pathname } = useLocation();
  const p = landingByPath(pathname);
  return p ? <Landing p={p} /> : <NotFound />;
}
