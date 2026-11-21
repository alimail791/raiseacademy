import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import UpdatedOn from "../components/UpdatedOn";

// NEET 2027 event pages (admit card, answer key, result, counselling) and the
// CBSE 2027 board exam page. Built before each event so Google already trusts
// them when searches jump. Facts only from official notices or what happened
// in 2026; anything not announced says so. When NTA/MCC/CBSE publish, update
// the `status` and `rows` of that page and LAST_CHECKED.
export const LAST_CHECKED = "21 November 2026";

type Row = [string, string];
type EventPage = {
  h1: string;
  intro: string;
  status: { label: string; value: string; note: string };
  rowsTitle: string;
  rows: Row[];
  rowsNote?: string;
  sections: { title: string; points: string[] }[];
  tools: { label: string; to: string }[];
  faqs: Row[];
  cta: { title: string; text: string; to: string; button: string };
};

const NOT_ANNOUNCED = "NTA has not announced the NEET 2027 exam date or information bulletin yet.";

export const EVENT_PAGES: Record<string, EventPage> = {
  "admit-card": {
    h1: "NEET 2027 Admit Card: Release Date, How to Download and What to Carry",
    intro: "When the NEET UG 2027 admit card is expected, how to download it from neet.nta.nic.in, and what to check and carry on exam day.",
    status: { label: "NEET 2027 admit card", value: "Not released yet", note: NOT_ANNOUNCED },
    rowsTitle: "What happened in NEET 2026 (for reference)",
    rows: [
      ["City intimation slip", "12 April 2026 (not an admit card)"],
      ["Admit card", "26 April 2026, 7 days before the exam"],
      ["Exam", "3 May 2026 (later cancelled)"],
      ["Re-exam admit card", "14 June 2026"],
      ["Re-exam", "21 June 2026"],
    ],
    rowsNote: "NTA usually releases the exam city slip first and the admit card about a week before the exam.",
    sections: [
      { title: "How to download the admit card", points: [
        "Go to neet.nta.nic.in, the only official NEET website.",
        "Open the NEET UG admit card link.",
        "Log in with your application number and password (or date of birth) and the security pin.",
        "Download the PDF and print it on A4 paper. Keep a copy on your phone too.",
      ] },
      { title: "Check these details at once", points: [
        "Your name, photo, signature, date of birth and category.",
        "Exam centre address and reporting time. Visit the centre a day before if you can.",
        "If anything is wrong, contact NTA straight away using the helpline on the NTA website.",
      ] },
      { title: "What to carry (as in recent years)", points: [
        "The printed admit card with the self-declaration filled in.",
        "The same passport-size photo you uploaded in the form.",
        "An original, valid photo ID such as Aadhaar.",
        "Follow the dress code and the list printed on your own admit card. NTA can change the rules each year.",
      ] },
    ],
    tools: [
      { label: "NEET photo & signature resizer", to: "/neet-photo-resizer" },
      { label: "NEET 2027 exam date & pattern", to: "/neet-2027-exam-date" },
      { label: "NEET registration guide", to: "/neet-registration" },
    ],
    faqs: [
      ["When will the NEET 2027 admit card come?", "Not announced. In 2026 the admit card came 7 days before the exam, and the city slip about 3 weeks before. NEET 2027 dates are not out yet."],
      ["Is the city intimation slip my admit card?", "No. The city slip only tells you the city of your centre. You need the admit card to enter the exam hall."],
      ["I forgot my application number. What now?", "Use the 'Forgot application number' option on neet.nta.nic.in. You need the email or mobile number you registered with."],
    ],
    cta: { title: "Practise in exam conditions before your admit card arrives", text: "Full NEET mocks with a timer, +4/−1 marking and your All India Rank. 30 days free.", to: "/register?from=admit_card", button: "Start free" },
  },
  "answer-key": {
    h1: "NEET 2027 Answer Key: Release Date, How to Challenge and Calculate Your Score",
    intro: "When NTA's provisional NEET UG 2027 answer key is expected, how to raise an objection, and how to work out your marks.",
    status: { label: "NEET 2027 answer key", value: "Not released yet", note: NOT_ANNOUNCED },
    rowsTitle: "What happened in NEET 2026 (for reference)",
    rows: [
      ["Provisional key (3 May exam)", "6 May 2026"],
      ["Provisional key (re-exam)", "25 June 2026"],
      ["Objection window (re-exam)", "Until 28 June 2026"],
      ["Final key and result", "Result on 16 July 2026"],
    ],
    rowsNote: "NTA publishes a provisional key, takes objections for a few days, then uses the final key for the result.",
    sections: [
      { title: "How to check your answers", points: [
        "Download the provisional answer key from neet.nta.nic.in when NTA releases it.",
        "Match your responses to it, question by question.",
        "Each correct answer is +4, each wrong answer −1, a skipped question 0.",
      ] },
      { title: "How to challenge an answer", points: [
        "Log in on neet.nta.nic.in during the objection window.",
        "Pick the question, choose the answer you think is right and upload proof (a book page or reference).",
        "Pay the fee for each question you challenge. In 2026 it was ₹200 per question.",
        "If your objection is accepted, the final key changes for everyone.",
      ] },
    ],
    tools: [
      { label: "NEET score calculator", to: "/neet-score-calculator" },
      { label: "NEET rank predictor", to: "/neet-rank-predictor" },
      { label: "NEET college predictor", to: "/neet-college-predictor" },
    ],
    faqs: [
      ["Are coaching answer keys official?", "No. Only NTA's answer key counts for your result. Coaching keys come out earlier but can be wrong."],
      ["Is my fee returned if my challenge is accepted?", "In past years NTA has said the fee is refunded only if the challenge is accepted. Check the notice for 2027."],
      ["Can I see my own responses?", "In recent years NTA has shown candidates their recorded responses along with the provisional key. Check the 2027 notice."],
    ],
    cta: { title: "Calculate your NEET score in 1 minute", text: "Enter your answers, get your marks out of 720, your expected rank and the colleges it can get you. Free.", to: "/neet-score-calculator", button: "Open score calculator" },
  },
  result: {
    h1: "NEET 2027 Result: Date, Scorecard, Qualifying Percentile and What Next",
    intro: "When the NEET UG 2027 result is expected, what the scorecard shows, the qualifying percentile and your next steps.",
    status: { label: "NEET 2027 result", value: "Not declared", note: NOT_ANNOUNCED },
    rowsTitle: "What happened in NEET 2026 (for reference)",
    rows: [
      ["Exam (cancelled)", "3 May 2026"],
      ["Re-exam", "21 June 2026"],
      ["Result", "16 July 2026"],
      ["MCC counselling round 1 registration", "From 5 August 2026"],
    ],
    sections: [
      { title: "What your scorecard shows", points: [
        "Marks in Physics, Chemistry and Biology, and your total out of 720.",
        "Your percentile and your All India Rank (AIR).",
        "Whether you have qualified, and your category.",
      ] },
      { title: "Qualifying percentile (as in recent years)", points: [
        "General: 50th percentile.",
        "General PwD: 45th percentile.",
        "SC, ST and OBC (including PwD): 40th percentile.",
        "Qualifying only makes you eligible for counselling. Your rank decides the college.",
      ] },
      { title: "After the result", points: [
        "Check which colleges your rank can get with the college predictor.",
        "Register for MCC counselling (15% All India Quota) and your state's counselling (85% state quota). They are separate.",
        "Keep your documents ready: scorecard, Class 10 and 12 marksheets, ID, category and domicile certificates.",
      ] },
    ],
    tools: [
      { label: "NEET college predictor", to: "/neet-college-predictor" },
      { label: "NEET rank predictor", to: "/neet-rank-predictor" },
      { label: "NEET cutoff by state", to: "/neet-cutoff" },
      { label: "Compare colleges", to: "/neet-compare-colleges" },
    ],
    faqs: [
      ["Where is the NEET result declared?", "On neet.nta.nic.in. Log in with your application number and password to download the scorecard."],
      ["Is qualifying the same as getting a seat?", "No. Qualifying lets you join counselling. Seats go by rank, category and quota."],
      ["Does NTA send the scorecard by post?", "No. You download it online. Save the PDF and a printout for counselling."],
    ],
    cta: { title: "See which MBBS colleges your rank can get", text: "Your marks or rank → government and private colleges, quota-wise, from official cutoff data. Free.", to: "/neet-college-predictor", button: "Open college predictor" },
  },
  counselling: {
    h1: "NEET Counselling 2027: MCC and State Quota Schedule, Rounds and Documents",
    intro: "How NEET UG counselling works for MBBS and BDS: MCC's All India Quota, state quota, rounds, and what to keep ready.",
    status: { label: "NEET counselling 2027", value: "Not announced", note: "MCC publishes the schedule after the NEET result. The NEET 2027 result date is not out yet." },
    rowsTitle: "What happened in NEET counselling 2026 (for reference)",
    rows: [
      ["Round 1 registration (MCC)", "From 5 August 2026"],
      ["Round 1 seat allotment result", "21 August 2026 (after two revisions)"],
      ["Rounds", "Round 1, Round 2, Round 3 and an online stray vacancy round"],
    ],
    rowsNote: "MCC changed its round 1 dates twice in 2026. Always check mcc.nic.in for the latest dates.",
    sections: [
      { title: "Who runs which seats", points: [
        "MCC (mcc.nic.in): 15% All India Quota seats in government colleges, plus deemed universities, central universities, AIIMS and JIPMER.",
        "Your state: 85% state quota seats in government colleges, and private college seats in that state.",
        "You can take part in both. Register for each one separately.",
      ] },
      { title: "How a round works", points: [
        "Register and pay the fee.",
        "Fill and lock your choices of colleges and courses, in order of preference.",
        "See your seat allotment result.",
        "Report to the college with your documents before the deadline, or choose to upgrade in the next round where allowed.",
      ] },
      { title: "Documents to keep ready", points: [
        "NEET admit card and scorecard.",
        "Class 10 and Class 12 marksheets and certificates.",
        "Photo ID, passport-size photos, and category, PwD or domicile certificates if they apply.",
      ] },
    ],
    tools: [
      { label: "NEET cutoff by state", to: "/neet-cutoff" },
      { label: "NEET college predictor", to: "/neet-college-predictor" },
      { label: "Compare colleges", to: "/neet-compare-colleges" },
      { label: "NEET rank predictor", to: "/neet-rank-predictor" },
    ],
    faqs: [
      ["Should I register for both MCC and state counselling?", "Most students do, so they don't miss any seat they can get. Read each one's rules on resigning and upgrading."],
      ["What is a stray vacancy round?", "A last round to fill seats that are still empty after the main rounds."],
      ["Where do I see last year's closing ranks?", "On YNeet's NEET cutoff pages, state by state and college by college."],
    ],
    cta: { title: "Plan your choice list with last year's closing ranks", text: "See the colleges your rank can get under All India Quota and your state quota. Free, no login.", to: "/neet-college-predictor", button: "Open college predictor" },
  },
  "cbse-boards": {
    h1: "CBSE Board Exam 2027: Class 10 and Class 12 Dates, and How They Fit With NEET",
    intro: "CBSE's 2027 date sheet for Class 10 and 12, and how Class 12 students can prepare for the boards and NEET at the same time.",
    status: { label: "CBSE 2027 date sheet", value: "Released", note: "CBSE released the Class 10 and 12 date sheet on 6 November 2026 at cbse.gov.in." },
    rowsTitle: "CBSE board exams 2027",
    rows: [
      ["Exams begin", "16 February 2027"],
      ["Class 10", "16 February – 9 March 2027"],
      ["Class 12", "16 February – 9 April 2027"],
      ["Start time", "10:30 AM"],
    ],
    rowsNote: "Download the subject-wise date sheet from cbse.gov.in. Your school will share practical exam dates.",
    sections: [
      { title: "Class 12 (PCB): boards and NEET together", points: [
        "NEET follows the NCERT syllabus, so your board preparation also counts for NEET.",
        "To be eligible for NEET you need Physics, Chemistry, Biology and English in Class 12. In recent years the minimum was 50% in PCB for General, 45% for General PwD and 40% for SC, ST and OBC.",
        "After the boards end, there are usually a few weeks to switch fully to NEET MCQs and mock tests.",
        "Practise MCQs chapter by chapter during board revision, so the switch is easier.",
      ] },
      { title: "Class 10: build the base for NEET", points: [
        "Class 10 Science (light, electricity, life processes, chemical reactions) is the base for Class 11 NEET topics.",
        "Practising MCQs now makes NEET Foundation in Class 11 much easier.",
      ] },
    ],
    tools: [
      { label: "Class 10 Science MCQs", to: "/class-10-questions" },
      { label: "Class 9 Science MCQs", to: "/class-9-questions" },
      { label: "NCERT Biology notes", to: "/ncert-notes" },
      { label: "Chapter-wise NEET PYQs", to: "/neet-practice" },
    ],
    faqs: [
      ["When do CBSE 2027 board exams start?", "On 16 February 2027 for both Class 10 and Class 12, as per CBSE's date sheet released on 6 November 2026."],
      ["When do Class 12 exams end?", "On 9 April 2027, as per the date sheet."],
      ["Do board marks count in NEET?", "No, NEET rank depends only on your NEET score. But you must meet the Class 12 eligibility marks to be admitted."],
    ],
    cta: { title: "Revise board chapters with NEET-style MCQs", text: "Chapter tests on the NCERT syllabus with your score and weak topics. 30 days free.", to: "/register?from=cbse_boards", button: "Start free" },
  },
};

const NeetEventPage = ({ id }: { id: keyof typeof EVENT_PAGES }) => {
  const p = EVENT_PAGES[id];
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <p className="text-sm text-ink/70 dark:text-paper/70">Last checked: {LAST_CHECKED}</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight mt-2">{p.h1}</h1>
      <UpdatedOn />
      <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg">{p.intro}</p>

      <div className="mt-8 rounded-2xl bg-ink text-paper p-5">
        <p className="text-sm text-paper/70">{p.status.label}</p>
        <p className="font-display text-2xl font-bold mt-1">{p.status.value}</p>
        <p className="text-sm text-paper/75 mt-1">{p.status.note}</p>
      </div>

      <h2 className="font-display text-2xl font-bold mt-10">{p.rowsTitle}</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 dark:border-paper/15">
        <table className="w-full text-sm">
          <tbody>
            {p.rows.map(([k, v]) => (
              <tr key={k} className="border-t first:border-t-0 border-ink/10 dark:border-paper/10"><td className="p-3 font-semibold">{k}</td><td className="p-3">{v}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      {p.rowsNote && <p className="text-sm text-ink/70 dark:text-paper/70 mt-3">{p.rowsNote}</p>}

      {p.sections.map((s) => (
        <section key={s.title}>
          <h2 className="font-display text-2xl font-bold mt-10">{s.title}</h2>
          <ul className="mt-4 space-y-2 list-disc pl-5 text-ink/80 dark:text-paper/80">
            {s.points.map((x) => <li key={x}>{x}</li>)}
          </ul>
        </section>
      ))}

      <div className="my-10 rounded-2xl bg-rise-line text-paper p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display text-xl font-bold">{p.cta.title}</p>
          <p className="text-paper/80 text-sm mt-1">{p.cta.text}</p>
        </div>
        <Link to={p.cta.to} className="inline-flex items-center gap-2 bg-gold text-ink font-semibold px-5 py-3 rounded-full">{p.cta.button} <ArrowRight size={16} /></Link>
      </div>

      <h2 className="font-display text-2xl font-bold">Free tools for this step</h2>
      <ul className="mt-4 space-y-2">
        {p.tools.map((t) => <li key={t.to}><Link to={t.to} className="font-semibold text-rise-dark underline">{t.label}</Link></li>)}
      </ul>

      <h2 className="font-display text-2xl font-bold mt-10">Frequently asked questions</h2>
      <div className="mt-4 space-y-3">
        {p.faqs.map(([q, a]) => (
          <details key={q} className="rounded-2xl border border-ink/10 dark:border-paper/15 p-4">
            <summary className="cursor-pointer font-semibold">{q}</summary>
            <p className="mt-2 text-ink/75 dark:text-paper/75">{a}</p>
          </details>
        ))}
      </div>

      <h2 className="font-display text-2xl font-bold mt-10">NEET 2027 step by step</h2>
      <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-sm">
        {NEET_STEPS.map((s) => (
          <li key={s.to}><Link to={s.to} className="block rounded-xl border border-ink/10 dark:border-paper/15 p-3 font-semibold hover:border-gold">{s.label}</Link></li>
        ))}
      </ul>
    </div>
  );
};

// Linked from every event page and the exam date page, in exam order.
export const NEET_STEPS = [
  { label: "1. Exam date & pattern", to: "/neet-2027-exam-date" },
  { label: "2. Registration & documents", to: "/neet-registration" },
  { label: "3. Admit card", to: "/neet-2027-admit-card" },
  { label: "4. Answer key & score", to: "/neet-2027-answer-key" },
  { label: "5. Result", to: "/neet-2027-result" },
  { label: "6. Counselling", to: "/neet-counselling-2027" },
];

export const NeetAdmitCard = () => <NeetEventPage id="admit-card" />;
export const NeetAnswerKey = () => <NeetEventPage id="answer-key" />;
export const NeetResult = () => <NeetEventPage id="result" />;
export const NeetCounselling = () => <NeetEventPage id="counselling" />;
export const CbseBoards = () => <NeetEventPage id="cbse-boards" />;
