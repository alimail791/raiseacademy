import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// NEET 2027 exam date & pattern. Facts only from NTA notices; everything not yet
// announced says so. Update LAST_CHECKED and the facts whenever NTA publishes.
const LAST_CHECKED = "29 October 2026";

const PATTERN = [
  ["Physics", "45", "180"],
  ["Chemistry", "45", "180"],
  ["Biology (Botany + Zoology)", "90", "360"],
  ["Total", "180", "720"],
];

const FAQS = [
  ["When is NEET 2027?", "NTA has not officially announced the NEET UG 2027 date yet. Recent NEET exams were held on the first Sunday of May (4 May 2025, 3 May 2026), so early May 2027 is likely. We will update this page when the official notice is out."],
  ["Will NEET 2027 be computer-based (CBT)?", "Not confirmed. A move to computer-based testing has been discussed, but no final decision has been announced. NEET 2026 was a pen-and-paper (OMR) exam."],
  ["Is there an attempt limit for NEET 2027?", "No attempt limit has been announced. Proposals have been discussed, but nothing is confirmed."],
  ["Is there negative marking in NEET?", "Yes. Each correct answer gets +4, each wrong answer −1, and an unanswered question 0. Marking more than one option counts as wrong."],
  ["How many questions are there in NEET?", "In NEET 2026 there were 180 compulsory questions: 45 Physics, 45 Chemistry and 90 Biology, for 720 marks in 3 hours."],
];

const NeetExamDate = () => (
  <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
    <p className="text-sm text-ink/55 dark:text-paper/55">Last checked: {LAST_CHECKED}</p>
    <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight mt-2">NEET 2027 Exam Date, Pattern and Marking Scheme</h1>
    <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg">What is confirmed for NEET UG 2027, what is not yet, and the exam pattern from the latest NEET.</p>

    <div className="mt-8 grid sm:grid-cols-3 gap-4">
      <div className="rounded-2xl bg-ink text-paper p-5">
        <p className="text-sm text-paper/70">Exam date</p>
        <p className="font-display text-2xl font-bold mt-1">Not announced yet</p>
        <p className="text-sm text-paper/70 mt-1">Likely early May 2027</p>
      </div>
      <div className="rounded-2xl border border-ink/10 dark:border-paper/15 p-5">
        <p className="text-sm text-ink/60 dark:text-paper/60">Registration</p>
        <p className="font-display text-2xl font-bold mt-1">Not announced yet</p>
        <p className="text-sm text-ink/60 dark:text-paper/60 mt-1">Official site: neet.nta.nic.in</p>
      </div>
      <div className="rounded-2xl border border-ink/10 dark:border-paper/15 p-5">
        <p className="text-sm text-ink/60 dark:text-paper/60">Mode</p>
        <p className="font-display text-2xl font-bold mt-1">To be confirmed</p>
        <p className="text-sm text-ink/60 dark:text-paper/60 mt-1">NEET 2026 was pen and paper</p>
      </div>
    </div>
    <p className="text-sm text-ink/60 dark:text-paper/60 mt-3">You may see exact dates on other websites. Until NTA publishes the NEET 2027 information bulletin, treat them as unofficial.</p>

    <h2 className="font-display text-2xl font-bold mt-10">NEET exam pattern (as in NEET 2026)</h2>
    <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 dark:border-paper/15">
      <table className="w-full min-w-[420px] text-sm">
        <thead><tr className="bg-ink/[0.04] dark:bg-paper/5"><th className="text-left p-3">Subject</th><th className="text-left p-3">Questions</th><th className="text-left p-3">Marks</th></tr></thead>
        <tbody>
          {PATTERN.map(([s, q, m]) => (
            <tr key={s} className={`border-t border-ink/10 dark:border-paper/10 ${s === "Total" ? "font-bold" : ""}`}><td className="p-3">{s}</td><td className="p-3">{q}</td><td className="p-3">{m}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
    <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-sm">
      <li className="rounded-xl bg-rise/10 p-3"><b>+4</b> for each correct answer</li>
      <li className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3"><b>−1</b> for each wrong answer</li>
      <li className="rounded-xl bg-ink/[0.04] dark:bg-paper/5 p-3"><b>0</b> for a question you skip</li>
      <li className="rounded-xl bg-ink/[0.04] dark:bg-paper/5 p-3"><b>3 hours</b> (180 minutes), all questions compulsory</li>
    </ul>

    <div className="my-10 rounded-2xl bg-rise-line text-paper p-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="font-display text-xl font-bold">How ready are you for NEET 2027?</p>
        <p className="text-paper/80 text-sm mt-1">15 questions, 5 minutes, NEET marking. Free, no login.</p>
      </div>
      <Link to="/neet-readiness" className="inline-flex items-center gap-2 bg-gold text-ink font-semibold px-5 py-3 rounded-full">Check my score <ArrowRight size={16} /></Link>
    </div>

    <h2 className="font-display text-2xl font-bold">Free ways to prepare</h2>
    <ul className="mt-4 space-y-2">
      <li><Link to="/neet-question-papers" className="font-semibold text-rise-dark underline">NEET previous year question papers with answers</Link></li>
      <li><Link to="/neet-practice" className="font-semibold text-rise-dark underline">Chapter-wise NEET PYQs</Link></li>
      <li><Link to="/neet-question-of-the-day" className="font-semibold text-rise-dark underline">NEET Question of the Day</Link></li>
    </ul>

    <h2 className="font-display text-2xl font-bold mt-10">Frequently asked questions</h2>
    <div className="mt-4 space-y-3">
      {FAQS.map(([q, a]) => (
        <details key={q} className="rounded-2xl border border-ink/10 dark:border-paper/15 p-4">
          <summary className="cursor-pointer font-semibold">{q}</summary>
          <p className="mt-2 text-ink/75 dark:text-paper/75">{a}</p>
        </details>
      ))}
    </div>

    <div className="mt-10 rounded-2xl bg-gold/15 border border-gold/40 p-6">
      <p className="font-display text-xl font-bold">Start NEET 2027 prep free for 30 days</p>
      <p className="text-sm text-ink/70 dark:text-paper/70 mt-1">1,200+ NEET tests, full mocks with rank, a mistake notebook and weekly parent reports. No card.</p>
      <Link to="/register" className="mt-4 inline-flex items-center gap-2 bg-gold text-ink font-semibold px-6 py-3 rounded-full hover:bg-gold-dark">Start free <ArrowRight size={16} /></Link>
    </div>
  </div>
);

export default NeetExamDate;
