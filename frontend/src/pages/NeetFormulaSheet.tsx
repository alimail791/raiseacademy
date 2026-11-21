import { Link } from "react-router-dom";
import { ArrowRight, Printer } from "lucide-react";
import { PHYSICS, CHEMISTRY, type FormulaSheet } from "../formulas/formulaData";
import { track } from "../components/SignupNudge";

// /neet-physics-formula-sheet and /neet-chemistry-formula-sheet: every key
// formula chapter by chapter, as plain text in the HTML (prerendered) so Google
// and AI search can read it. Data lives in formulas/formulaData.ts.

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function Sheet({ sheet }: { sheet: FormulaSheet }) {
  const other = sheet.subject === "Physics" ? CHEMISTRY : PHYSICS;
  const count = sheet.chapters.reduce((n, c) => n + c.rows.length, 0);
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <p className="text-gold-deep dark:text-gold font-semibold uppercase tracking-widest text-sm">Free · Class 11 & 12 · {count}+ formulas</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2 leading-tight">{sheet.title} — Chapter-wise for NEET 2027</h1>
      <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg">{sheet.intro}</p>

      <div className="mt-5 flex flex-wrap gap-3 print:hidden">
        <button type="button" onClick={() => { track("formula_sheet_print", { subject: sheet.subject }); window.print(); }}
          className="inline-flex items-center gap-2 border border-ink/20 dark:border-paper/25 font-semibold px-4 py-2.5 rounded-full">
          <Printer size={16} /> Print / save as PDF
        </button>
        <Link to={other.path} className="inline-flex items-center gap-2 border border-ink/20 dark:border-paper/25 font-semibold px-4 py-2.5 rounded-full">
          {other.title} <ArrowRight size={16} />
        </Link>
      </div>

      <nav className="mt-8 rounded-2xl border border-ink/10 dark:border-paper/15 p-5 print:hidden" aria-label="Chapters">
        <p className="font-display font-bold text-lg">Chapters</p>
        <ol className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm list-decimal list-inside">
          {sheet.chapters.map((c) => (
            <li key={c.name}><a href={`#${slug(c.name)}`} className="text-rise-dark dark:text-gold hover:underline">{c.name}</a> <span className="text-ink/50 dark:text-paper/50">· Class {c.cls}</span></li>
          ))}
        </ol>
      </nav>

      {sheet.chapters.map((c, i) => (
        <section key={c.name} id={slug(c.name)} className="mt-10 scroll-mt-24 break-inside-avoid-page">
          <h2 className="font-display text-2xl font-bold">{i + 1}. {c.name} formulas</h2>
          <p className="text-sm text-ink/60 dark:text-paper/60">Class {c.cls} · NEET {sheet.subject}</p>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-ink/10 dark:border-paper/15">
            <table className="w-full text-sm">
              <tbody>
                {c.rows.map(([what, f, note]) => (
                  <tr key={what} className="border-t first:border-t-0 border-ink/10 dark:border-paper/10 align-top">
                    <th scope="row" className="p-3 text-left font-semibold w-[34%]">{what}</th>
                    <td className="p-3">
                      <span className="font-mono text-[0.95em] leading-relaxed">{f}</span>
                      {note && <span className="block mt-1 text-ink/60 dark:text-paper/60">{note}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <h2 className="font-display text-2xl font-bold mt-12">How to use this formula sheet</h2>
      <ul className="mt-3 space-y-2 list-disc list-inside text-ink/80 dark:text-paper/80">
        {sheet.tips.map((t) => <li key={t}>{t}</li>)}
      </ul>
      <p className="mt-4 text-sm">Practise each chapter with free <Link to="/neet-practice" className="text-rise-dark font-semibold underline">chapter-wise NEET PYQs</Link>, and see how many questions each chapter gets in the <Link to="/neet-chapter-wise-weightage" className="text-rise-dark font-semibold underline">NEET chapter-wise weightage</Link>.</p>

      <div className="web-only mt-10 rounded-3xl bg-rise-line text-paper p-7 sm:p-9 print:hidden">
        <p className="font-display text-2xl font-bold">Formulas stick when you use them</p>
        <p className="text-paper/80 mt-2">YNeet gives you timed chapter tests and full NEET mocks with a mistake notebook, so you see which formulas you still get wrong. 30 days free, no card.</p>
        <Link to={`/register?from=formula_${sheet.subject.toLowerCase()}`} className="mt-5 inline-flex items-center gap-2 bg-gold text-ink font-bold px-6 py-3 rounded-full">Start 30 days free <ArrowRight size={16} /></Link>
      </div>

      <h2 className="font-display text-2xl font-bold mt-12">Frequently asked questions</h2>
      <div className="mt-4 space-y-3">
        {sheet.faqs.map(([q, a]) => (
          <details key={q} className="rounded-2xl border border-ink/10 dark:border-paper/15 p-4">
            <summary className="cursor-pointer font-semibold">{q}</summary>
            <p className="mt-2 text-ink/75 dark:text-paper/75">{a}</p>
          </details>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "FAQPage",
          mainEntity: sheet.faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
        }).replace(/</g, "\\u003c"),
      }} />
    </div>
  );
}

export const NeetPhysicsFormulas = () => <Sheet sheet={PHYSICS} />;
export const NeetChemistryFormulas = () => <Sheet sheet={CHEMISTRY} />;
