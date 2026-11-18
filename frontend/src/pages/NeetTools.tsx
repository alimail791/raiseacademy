import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { gamesLink, CHROME_EXTENSION_URL } from "../utils/siteInfo";

// /neet-tools: one public page that lists every free YNeet page, with a line on
// what each one does. Gives visitors (and Google) a single place to find all the
// free tools, so the home page can stay short. Everything here is free, no login.

type Tool = { name: string; to?: string; href?: string; desc: string };
type Group = { title: string; intro: string; tools: Tool[] };

const GROUPS: Group[] = [
  {
    title: "Check where you stand",
    intro: "Quick, free self-checks. No login needed.",
    tools: [
      { name: "NEET Readiness Test", to: "/neet-readiness", desc: "15 NEET-level questions with NEET marking. Get your score out of 100 and your weak chapters." },
      { name: "NEET College Predictor", to: "/neet-college-predictor", desc: "Enter your rank and category to see MBBS and BDS colleges under All India and state quota." },
      { name: "NEET Score Calculator", to: "/neet-score-calculator", desc: "Match your answers with the answer key (+4/−1) and get your expected rank." },
      { name: "60-Second Sprint", to: "/neet-sprint", desc: "5 quick Physics, Chemistry and Biology questions against the clock." },
    ],
  },
  {
    title: "Practise with real NEET questions",
    intro: "Previous year questions with answers and explanations.",
    tools: [
      { name: "Chapter-wise NEET PYQs", to: "/neet-practice", desc: "Previous year NEET questions sorted by chapter, for Physics, Chemistry and Biology." },
      { name: "NEET question papers by year", to: "/neet-question-papers", desc: "Full NEET papers year by year, with the answer to every question." },
      { name: "NEET Question of the Day", to: "/neet-question-of-the-day", desc: "One NEET-level question every day, with the answer and explanation." },
      { name: "NEET new tab for Chrome", href: CHROME_EXTENSION_URL, desc: "Free Chrome extension: every new tab shows the NEET countdown and today's NEET question." },
      { name: "Daily NEET puzzles", href: gamesLink("tools_page"), desc: "5 puzzles a day from NCERT: BioWord, Pinpoint NEET, Pathway Zip and more." },
      { name: "Class 6–10 Science MCQs", to: "/class-9-questions", desc: "Science questions for Class 6 to 10, for an early NEET foundation." },
      { name: "Brain Teaser (Class 6–8)", to: "/brain-teaser", desc: "A new science riddle every Wednesday from the NCERT syllabus." },
    ],
  },
  {
    title: "Study and revise",
    intro: "Notes, maps and data to plan what to study next.",
    tools: [
      { name: "NEET chapter-wise weightage", to: "/neet-chapter-wise-weightage", desc: "How many questions each chapter gets in NEET, so you know where to focus." },
      { name: "Most-missed NEET chapters", to: "/neet-most-missed-chapters", desc: "The chapters YNeet students get wrong most often." },
      { name: "NCERT Biology notes", to: "/ncert-notes", desc: "Short NCERT Biology notes, chapter by chapter." },
      { name: "NEET concept maps", to: "/neet-concept-maps", desc: "Whole NCERT chapters on one page for quick revision." },
      { name: "NEET PYQ books (PDF)", to: "/neet-pyq-books", desc: "Chapter-wise previous year questions as PDFs, with solutions." },
      { name: "Daily quiz Shorts", to: "/neet-quiz-shorts", desc: "Three short NEET quiz videos every day: Physics, Chemistry and Biology." },
      { name: "Ask YNeet", to: "/ask-yneet", desc: "Real NEET doubts answered step by step by YNeet teachers." },
    ],
  },
  {
    title: "NEET 2027 exam help",
    intro: "Dates, forms and cutoffs for the exam itself.",
    tools: [
      { name: "NEET cutoff by state", to: "/neet-cutoff", desc: "Last year's government MBBS cutoffs, state by state." },
      { name: "NEET 2027 exam date", to: "/neet-2027-exam-date", desc: "What is confirmed for NEET 2027, and the exam pattern." },
      { name: "NEET registration guide", to: "/neet-registration", desc: "Step-by-step help with the NEET application form, fees and documents." },
      { name: "Photo & signature resizer", to: "/neet-photo-resizer", desc: "Resize your photo, signature and thumb impression to the exact NEET size." },
    ],
  },
  {
    title: "For parents and coaching centres",
    intro: "",
    tools: [
      { name: "NEET guide for parents", to: "/neet-parents", desc: "How YNeet's weekly parent report works, and how to support your child." },
      { name: "YNeet for coaching institutes", to: "/institutes", desc: "Student logins, tests and reports for your institute." },
      { name: "Free NEET widgets for your website", to: "/neet-question-widget", desc: "Add a daily NEET question, college predictor or cutoff box to your site." },
    ],
  },
];

function ToolCard({ t }: { t: Tool }) {
  const inner = (
    <>
      <span className="font-semibold text-rise-dark dark:text-gold group-hover:underline">{t.name}</span>
      <span className="block text-sm text-ink/70 dark:text-paper/70 mt-1">{t.desc}</span>
    </>
  );
  const cls = "group block rounded-2xl border border-ink/10 dark:border-paper/15 bg-white dark:bg-ink-light p-4 hover:border-gold";
  return t.to ? <Link to={t.to} className={cls}>{inner}</Link> : <a href={t.href} target="_blank" rel="noopener" className={cls}>{inner}</a>;
}

const NeetTools = () => (
  <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
    <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight">Free NEET Tools, Practice and Study Material</h1>
    <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg max-w-3xl">
      Every free YNeet page in one place: a readiness test, college predictor, score calculator, previous year papers, chapter-wise weightage, NCERT notes and NEET 2027 exam help. All free, no login needed.
    </p>

    {GROUPS.map((g) => (
      <section key={g.title} className="mt-10">
        <h2 className="font-display text-2xl font-bold">{g.title}</h2>
        {g.intro && <p className="text-ink/65 dark:text-paper/65 mt-1">{g.intro}</p>}
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          {g.tools.map((t) => <ToolCard key={t.name} t={t} />)}
        </div>
      </section>
    ))}

    <div className="web-only mt-12 rounded-3xl bg-rise-line text-paper p-7 sm:p-9">
      <p className="font-display text-2xl font-bold">Want to save your progress?</p>
      <p className="text-paper/80 mt-2">The free pages are open to everyone. With a free YNeet account you also get timed chapter tests, full mocks with rank, a mistake notebook and your weak chapters after every test. 30 days free, no card.</p>
      <Link to="/register?from=tools_page" className="mt-5 inline-flex items-center gap-2 bg-gold text-ink font-bold px-6 py-3 rounded-full">Start 30 days free <ArrowRight size={16} /></Link>
    </div>
  </div>
);

export default NeetTools;
