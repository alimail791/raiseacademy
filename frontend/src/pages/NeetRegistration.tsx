import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, XCircle, AlertTriangle, ImagePlus } from "lucide-react";
import RegistrationAlert from "../components/RegistrationAlert";

// NEET registration guide: status, eligibility checker, saved checklist, fees,
// step-by-step form help. Facts are from the NEET UG 2026 information bulletin;
// update EXAM_YEAR / LAST_CHECKED / the 2026 dates when NTA publishes 2027.
const LAST_CHECKED = "9 November 2026";
const EXAM_YEAR = 2027;
const CHECK_KEY = "neet_reg_checklist";

const LAST_YEAR = [
  ["Notification & registration opened", "8 February 2026"],
  ["Last date to apply", "8 March 2026"],
  ["Correction window", "10–12 March 2026"],
  ["Exam", "3 May 2026"],
];

const FEES = [
  ["General", "₹1,700"],
  ["General-EWS / OBC-NCL", "₹1,600"],
  ["SC / ST / PwBD / Third gender", "₹1,000"],
  ["Exam centre outside India (all)", "₹9,500"],
];

const CHECKLIST: { id: string; label: string; note?: string; resizer?: boolean }[] = [
  { id: "contact", label: "Your own mobile number and email ID", note: "All NTA messages and your password reset come here — don't use a coaching centre's number." },
  { id: "passport", label: "Passport-size photo (JPG, 10–200 KB)", note: "White background, recent, face about 80% of the photo.", resizer: true },
  { id: "postcard", label: "Postcard-size photo 4×6 inch (JPG, 10–200 KB)", note: "Same photo, with your name and date printed at the bottom.", resizer: true },
  { id: "signature", label: "Signature (JPG)", note: "Black pen on white paper, running handwriting, not capitals.", resizer: true },
  { id: "thumb", label: "Left- and right-hand finger & thumb impressions (JPG)", note: "Blue ink on white paper, not smudged.", resizer: true },
  { id: "class10", label: "Class 10 certificate / marksheet", note: "Used as proof of date of birth. Your name and DOB in the form must match it." },
  { id: "class12", label: "Class 12 marksheet (or admit card if appearing)" },
  { id: "id", label: "Identity proof (Aadhaar or other ID asked in the bulletin)", note: "Name and DOB should match your Class 10 certificate." },
  { id: "category", label: "Category certificate (SC/ST/OBC-NCL/EWS), if you claim a category", note: "OBC-NCL and EWS certificates must be valid for the current year." },
  { id: "pwbd", label: "PwBD certificate, if applicable" },
  { id: "city", label: "4 exam city choices decided", note: "Pick cities you can reach easily on exam morning." },
  { id: "pay", label: "UPI / debit card / net banking ready for the fee" },
];

const STEPS = [
  ["Register", "On neet.nta.nic.in, click New Registration. Enter your name, date of birth, mobile and email exactly as in your Class 10 certificate. Note down your application number and password."],
  ["Fill the application form", "Personal details, parents' details, category, Class 10 and 12 details, exam medium (language) and 4 exam city choices. Read every field twice — some fields can't be changed later."],
  ["Upload photos, signature & documents", "Upload in JPG at the exact size limits. Use our free resizer if the portal rejects your image."],
  ["Pay the fee", "Pay online by UPI, card or net banking. Wait for the payment success message — don't press back or pay twice."],
  ["Download the confirmation page", "Download and print the confirmation page and keep the payment receipt. You'll need your application number for the admit card and result."],
  ["Use the correction window if needed", "NTA opens a short correction window after the last date. Fix mistakes then — it's usually only 2–3 days."],
];

const MISTAKES = [
  "Name or date of birth not matching the Class 10 certificate",
  "Photo with a coloured background, cap, or face too small",
  "Signature in CAPITAL letters or with a blue pen",
  "Using someone else's mobile number or email",
  "Paying twice because the page was slow — check your bank first",
  "Waiting for the last day, when the website is slowest",
];

const FAQS = [
  ["When will NEET 2027 registration start?", `NTA hasn't announced it yet. For NEET 2026, registration opened on 8 February 2026 and closed on 8 March 2026, so early February ${EXAM_YEAR} is likely. Sign up for WhatsApp alerts above and we'll tell you the day it opens.`],
  ["What is the NEET application fee?", "For NEET 2026 it was ₹1,700 for General, ₹1,600 for General-EWS/OBC-NCL, ₹1,000 for SC/ST/PwBD/Third gender, and ₹9,500 for exam centres outside India, plus bank charges and GST if any."],
  ["What is the age limit for NEET?", `You must be at least 17 years old on 31 December of the admission year. For NEET ${EXAM_YEAR}, that means born on or before 31 December ${EXAM_YEAR - 17}. There is no upper age limit.`],
  ["Can Class 12 students apply before results?", "Yes. Students appearing in the Class 12 board exam in the same year can apply."],
  ["What marks do I need in Class 12?", "For admission: at least 50% in Physics, Chemistry and Biology together for General, 45% for General-PwBD, and 40% for SC/ST/OBC. English must be a subject too."],
  ["Is there a limit on attempts?", "No attempt limit has been announced. You can take NEET as many times as you are eligible."],
];

export default function NeetRegistration() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [dob, setDob] = useState("");
  const [study, setStudy] = useState("appearing");
  const [pcbe, setPcbe] = useState("yes");
  const [cat, setCat] = useState("General");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem(CHECK_KEY) || "{}")); } catch { /* storage blocked */ }
  }, []);
  const toggle = (id: string) => setDone((d) => {
    const n = { ...d, [id]: !d[id] };
    try { localStorage.setItem(CHECK_KEY, JSON.stringify(n)); } catch { /* storage blocked */ }
    return n;
  });
  const doneCount = CHECKLIST.filter((c) => done[c.id]).length;

  const cutoffDob = `${EXAM_YEAR - 17}-12-31`;
  const minPct = cat === "General" || cat === "General-EWS" ? 50 : cat === "General-PwBD" ? 45 : 40;
  const ageOk = !!dob && dob <= cutoffDob;
  const studyOk = study === "passed" || study === "appearing";
  const subjOk = pcbe === "yes";
  const eligible = ageOk && studyOk && subjOk;
  const fmtCut = `31 December ${EXAM_YEAR - 17}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <p className="text-sm text-ink/55 dark:text-paper/55">Last checked: {LAST_CHECKED}</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight mt-2">NEET {EXAM_YEAR} Registration: Step-by-Step Guide & Checklist</h1>
      <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg">Check your eligibility, get every document ready, and fill the NEET form without mistakes.</p>

      {/* Status */}
      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-ink text-paper p-5">
          <p className="text-sm text-paper/70">NEET {EXAM_YEAR} registration</p>
          <p className="font-display text-2xl font-bold mt-1">Not open yet</p>
          <p className="text-sm text-paper/70 mt-1">Likely early February {EXAM_YEAR}. Official site: neet.nta.nic.in</p>
        </div>
        <div className="rounded-2xl border border-ink/10 dark:border-paper/15 p-5">
          <p className="text-sm text-ink/60 dark:text-paper/60 mb-2">Last year (NEET 2026)</p>
          {LAST_YEAR.map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm py-0.5"><span className="text-ink/70 dark:text-paper/70">{k}</span><b>{v}</b></div>
          ))}
        </div>
      </div>

      <div className="mt-6"><RegistrationAlert source="registration-guide" /></div>

      {/* Eligibility */}
      <h2 className="font-display text-2xl font-bold mt-12">Am I eligible for NEET {EXAM_YEAR}?</h2>
      <div className="mt-4 rounded-2xl border border-ink/10 dark:border-paper/15 p-5">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm font-semibold">Date of birth
            <input type="date" className="cp-in" value={dob} onChange={(e) => { setDob(e.target.value); setChecked(false); }} />
          </label>
          <label className="text-sm font-semibold">Class 12 status
            <select className="cp-in" value={study} onChange={(e) => { setStudy(e.target.value); setChecked(false); }}>
              <option value="appearing">Appearing in Class 12 in {EXAM_YEAR}</option>
              <option value="passed">Already passed Class 12</option>
              <option value="below">In Class 11 or below</option>
            </select>
          </label>
          <label className="text-sm font-semibold">Physics, Chemistry, Biology & English in Class 12?
            <select className="cp-in" value={pcbe} onChange={(e) => { setPcbe(e.target.value); setChecked(false); }}>
              <option value="yes">Yes, all four</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="text-sm font-semibold">Category
            <select className="cp-in" value={cat} onChange={(e) => { setCat(e.target.value); setChecked(false); }}>
              <option>General</option><option>General-EWS</option><option>OBC-NCL</option><option>SC</option><option>ST</option><option>General-PwBD</option><option>Reserved-PwBD</option>
            </select>
          </label>
        </div>
        <button onClick={() => setChecked(true)} disabled={!dob} className="mt-4 bg-gold text-ink font-semibold px-6 py-3 rounded-full disabled:opacity-50">Check eligibility</button>

        {checked && (
          <div className={`mt-4 rounded-xl p-4 ${eligible ? "bg-rise/10" : "bg-red-50 dark:bg-red-900/20"}`}>
            <p className="font-display text-lg font-bold flex items-center gap-2">
              {eligible ? <><CheckCircle2 className="text-rise" /> You can apply for NEET {EXAM_YEAR}</> : <><XCircle className="text-red-600" /> Not eligible for NEET {EXAM_YEAR} yet</>}
            </p>
            <ul className="mt-2 text-sm space-y-1">
              <li>{ageOk ? "✅" : "❌"} Age: must be born on or before {fmtCut} (17 by 31 Dec {EXAM_YEAR}).</li>
              <li>{studyOk ? "✅" : "❌"} Class 12: passed, or appearing in {EXAM_YEAR}.</li>
              <li>{subjOk ? "✅" : "❌"} Subjects: Physics, Chemistry, Biology/Biotechnology and English.</li>
              <li>ℹ️ For admission you'll need at least <b>{minPct}%</b> in PCB together ({cat}).</li>
            </ul>
            {!eligible && study === "below" && (
              <p className="text-sm mt-3">Start early — <Link to="/neet-trial" className="underline font-semibold">YNeet gives Class 9–11 students 30 days free</Link>.</p>
            )}
          </div>
        )}
      </div>

      {/* Checklist */}
      <div className="flex items-end justify-between mt-12 gap-3 flex-wrap">
        <h2 className="font-display text-2xl font-bold">Document checklist</h2>
        <span className="text-sm font-semibold">{doneCount}/{CHECKLIST.length} ready</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-ink/10 dark:bg-paper/10 overflow-hidden"><div className="h-full bg-rise" style={{ width: `${(doneCount / CHECKLIST.length) * 100}%` }} /></div>
      <p className="text-xs text-ink/55 dark:text-paper/55 mt-2">Your ticks are saved on this device.</p>
      <div className="mt-4 space-y-2">
        {CHECKLIST.map((c) => (
          <label key={c.id} className={`flex gap-3 items-start rounded-xl border p-3 cursor-pointer ${done[c.id] ? "border-rise/40 bg-rise/5" : "border-ink/10 dark:border-paper/15"}`}>
            <input type="checkbox" className="mt-1" checked={!!done[c.id]} onChange={() => toggle(c.id)} />
            <span className="flex-1">
              <span className={`font-semibold ${done[c.id] ? "line-through text-ink/50 dark:text-paper/50" : ""}`}>{c.label}</span>
              {c.note && <span className="block text-sm text-ink/65 dark:text-paper/65 mt-0.5">{c.note}</span>}
              {c.resizer && !done[c.id] && (
                <Link to="/neet-photo-resizer" className="inline-flex items-center gap-1 text-sm font-semibold text-rise-dark mt-1"><ImagePlus size={14} /> Resize it free</Link>
              )}
            </span>
          </label>
        ))}
      </div>

      <div className="my-10 rounded-2xl bg-rise-line text-paper p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display text-xl font-bold">Photo rejected by the NEET form?</p>
          <p className="text-paper/80 text-sm mt-1">Resize your photo, postcard photo, signature and thumb impressions to the right KB. Free, stays on your phone.</p>
        </div>
        <Link to="/neet-photo-resizer" className="inline-flex items-center gap-2 bg-gold text-ink font-semibold px-5 py-3 rounded-full">Open the resizer <ArrowRight size={16} /></Link>
      </div>

      {/* Fees */}
      <h2 className="font-display text-2xl font-bold">Application fee (NEET 2026)</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 dark:border-paper/15">
        <table className="w-full min-w-[360px] text-sm">
          <thead><tr className="bg-ink/[0.04] dark:bg-paper/5"><th className="text-left p-3">Category</th><th className="text-left p-3">Fee</th></tr></thead>
          <tbody>{FEES.map(([c, f]) => <tr key={c} className="border-t border-ink/10 dark:border-paper/10"><td className="p-3">{c}</td><td className="p-3 font-semibold">{f}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="text-sm text-ink/60 dark:text-paper/60 mt-2">Plus bank processing charges and GST, if any. NEET {EXAM_YEAR} fees will be confirmed in the information bulletin.</p>

      {/* Steps */}
      <h2 className="font-display text-2xl font-bold mt-12">How to fill the NEET form, step by step</h2>
      <ol className="mt-4 space-y-3">
        {STEPS.map(([t, d], i) => (
          <li key={t} className="flex gap-4 rounded-2xl border border-ink/10 dark:border-paper/15 p-4">
            <span className="shrink-0 w-8 h-8 rounded-full bg-ink text-paper font-bold flex items-center justify-center">{i + 1}</span>
            <div><p className="font-semibold">{t}</p><p className="text-sm text-ink/70 dark:text-paper/70 mt-1">{d}</p></div>
          </li>
        ))}
      </ol>

      <h2 className="font-display text-2xl font-bold mt-12">Mistakes that get forms rejected</h2>
      <ul className="mt-4 grid sm:grid-cols-2 gap-2">
        {MISTAKES.map((m) => <li key={m} className="flex gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-sm"><AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />{m}</li>)}
      </ul>

      <h2 className="font-display text-2xl font-bold mt-12">Frequently asked questions</h2>
      <div className="mt-4 space-y-3">
        {FAQS.map(([q, a]) => (
          <details key={q} className="rounded-2xl border border-ink/10 dark:border-paper/15 p-4">
            <summary className="cursor-pointer font-semibold">{q}</summary>
            <p className="mt-2 text-ink/75 dark:text-paper/75">{a}</p>
          </details>
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-gold/15 border border-gold/40 p-6">
        <p className="font-display text-xl font-bold">Form done? Now the preparation.</p>
        <p className="text-sm text-ink/70 dark:text-paper/70 mt-1">1,200+ NEET tests, full mocks with rank, a chapter-priority study plan and weekly parent reports. 30 days free, no card.</p>
        <div className="flex gap-3 flex-wrap mt-4">
          <Link to="/register" className="inline-flex items-center gap-2 bg-gold text-ink font-semibold px-6 py-3 rounded-full hover:bg-gold-dark">Start free <ArrowRight size={16} /></Link>
          <Link to="/neet-2027-exam-date" className="inline-flex items-center gap-2 border border-ink/20 dark:border-paper/25 font-semibold px-6 py-3 rounded-full">NEET {EXAM_YEAR} exam date</Link>
        </div>
      </div>
    </div>
  );
}
