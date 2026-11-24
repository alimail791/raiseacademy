import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import UpdatedOn from "../components/UpdatedOn";
import { NEET_STEPS } from "./NeetEvents";

// NEET 2027 guide pages: eligibility, syllabus, Tamil Nadu counselling and the
// official-updates log. Facts only from NTA / NMC / TN DME notices; anything not
// yet announced says so. When NTA or NMC publishes, update the facts here, the
// UPDATES list below, and LAST_CHECKED.
const LAST_CHECKED = "24 November 2026";

type QA = [string, string];

const th = "text-left p-3";
const td = "p-3 align-top";
const tr = "border-t border-ink/10 dark:border-paper/10";

const Table = ({ head, rows, boldLast = false }: { head: string[]; rows: ReactNode[][]; boldLast?: boolean }) => (
  <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 dark:border-paper/15">
    <table className="w-full min-w-[420px] text-sm">
      <thead><tr className="bg-ink/[0.04] dark:bg-paper/5">{head.map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={`${tr} ${boldLast && i === rows.length - 1 ? "font-bold" : ""}`}>
            {r.map((c, j) => <td key={j} className={td}>{c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const H2 = ({ children }: { children: ReactNode }) => <h2 className="font-display text-2xl font-bold mt-10">{children}</h2>;

const Answer = ({ children }: { children: ReactNode }) => (
  <div className="mt-6 rounded-2xl bg-ink text-paper p-5 text-base leading-relaxed">{children}</div>
);

const Faqs = ({ faqs }: { faqs: QA[] }) => (
  <>
    <H2>Frequently asked questions</H2>
    <div className="mt-4 space-y-3">
      {faqs.map(([q, a]) => (
        <details key={q} className="rounded-2xl border border-ink/10 dark:border-paper/15 p-4">
          <summary className="cursor-pointer font-semibold">{q}</summary>
          <p className="mt-2 text-ink/75 dark:text-paper/75">{a}</p>
        </details>
      ))}
    </div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
      }).replace(/</g, "\\u003c"),
    }} />
  </>
);

const Readiness = () => (
  <div className="my-10 rounded-2xl bg-rise-line text-paper p-6 flex flex-wrap items-center justify-between gap-4">
    <div>
      <p className="font-display text-xl font-bold">How ready are you for NEET 2027?</p>
      <p className="text-paper/80 text-sm mt-1">15 questions, 5 minutes, NEET marking. Free, no login.</p>
    </div>
    <Link to="/neet-readiness" className="inline-flex items-center gap-2 bg-gold text-ink font-semibold px-5 py-3 rounded-full">Check my score <ArrowRight size={16} /></Link>
  </div>
);

const Guides = () => (
  <>
    <H2>NEET 2027 guides</H2>
    <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-sm">
      {[...GUIDE_LINKS, ...NEET_STEPS.slice(1)].map((s) => (
        <li key={s.to}><Link to={s.to} className="block rounded-xl border border-ink/10 dark:border-paper/15 p-3 font-semibold hover:border-gold">{s.label}</Link></li>
      ))}
    </ul>
  </>
);

const StartFree = () => (
  <div className="mt-10 rounded-2xl bg-gold/15 border border-gold/40 p-6">
    <p className="font-display text-xl font-bold">Start NEET 2027 prep free for 30 days</p>
    <p className="text-sm text-ink/70 dark:text-paper/70 mt-1">1,200+ NEET tests, full mocks with rank, a mistake notebook and weekly parent reports. No card.</p>
    <Link to="/register" className="mt-4 inline-flex items-center gap-2 bg-gold text-ink font-semibold px-6 py-3 rounded-full hover:bg-gold-dark">Start free <ArrowRight size={16} /></Link>
  </div>
);

const Shell = ({ title, intro, children }: { title: string; intro: string; children: ReactNode }) => (
  <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
    <p className="text-sm text-ink/70 dark:text-paper/70">Last checked: {LAST_CHECKED}</p>
    <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight mt-2">{title}</h1>
    <UpdatedOn />
    <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg">{intro}</p>
    {children}
  </div>
);

const link = "font-semibold text-rise-dark underline";

export const GUIDE_LINKS = [
  { label: "NEET 2027 exam date & pattern", to: "/neet-2027-exam-date" },
  { label: "NEET 2027 eligibility", to: "/neet-2027-eligibility" },
  { label: "NEET 2027 syllabus", to: "/neet-2027-syllabus" },
  { label: "NEET 2027 latest updates", to: "/neet-2027-updates" },
  { label: "Tamil Nadu NEET counselling 2027", to: "/tamil-nadu-neet-counselling-2027" },
];

/* ───────────────────────── Eligibility ───────────────────────── */

const ELIG_FAQS: QA[] = [
  ["What is the minimum age for NEET 2027?", "You must be at least 17 years old on or before 31 December 2027, which means born on or before 31 December 2010."],
  ["Is there an upper age limit for NEET 2027?", "No. Under current rules there is no upper age limit. A parliamentary panel recommended age and attempt limits in October 2026, but nothing has been notified for 2027."],
  ["How many attempts are allowed for NEET 2027?", "There is no limit on the number of NEET attempts under current rules."],
  ["What percentage in 12th is required for NEET 2027?", "Aggregate in Physics, Chemistry and Biology/Biotechnology: 50% for General/EWS, 40% for SC/ST/OBC, 45% for General-PwD and 40% for SC/ST/OBC-PwD. You must also pass English."],
  ["Can Class 12 students appearing in 2027 apply for NEET 2027?", "Yes. Students appearing for Class 12 in 2027 can apply, but they must meet the minimum marks when results are declared, before admission."],
  ["Can PCM students write NEET 2027?", "Yes, if they studied Biology/Biotechnology as an additional subject, along with Physics, Chemistry and English, and meet the marks criteria."],
];

export const NeetEligibility = () => (
  <Shell title="NEET 2027 Eligibility Criteria: Age Limit, 12th Marks and Attempts" intro="Who can write NEET UG 2027: age, Class 12 subjects and marks, attempts, and the latest on proposed limits.">
    <Answer>
      To write NEET 2027 you must be <b>at least 17 by 31 December 2027</b>, have passed or be appearing in <b>Class 12 with Physics, Chemistry, Biology/Biotechnology and English</b>, and score at least <b>50% in PCB (General)</b> or <b>40% (SC/ST/OBC)</b>. There is currently <b>no upper age limit and no attempt limit</b>.
    </Answer>

    <H2>NEET 2027 eligibility at a glance</H2>
    <Table head={["Criterion", "Rule (current)"]} rows={[
      ["Minimum age", "17 years by 31 Dec 2027 (born on or before 31 Dec 2010)"],
      ["Upper age limit", "None"],
      ["Number of attempts", "No limit"],
      ["Qualification", "Passed or appearing in Class 12 or equivalent"],
      ["Compulsory subjects", "Physics, Chemistry, Biology/Biotechnology, English"],
      ["Nationality", "Indian citizens, NRIs, OCIs, PIOs and foreign nationals"],
    ]} />

    <H2>Minimum 12th marks (category-wise)</H2>
    <Table head={["Category", "Minimum aggregate in PCB"]} rows={[
      ["General / EWS", "50%"],
      ["OBC (non-creamy layer), SC, ST", "40%"],
      ["General-PwD", "45%"],
      ["OBC / SC / ST-PwD", "40%"],
    ]} />
    <p className="mt-3">You also need to pass English. If you are appearing in Class 12 in 2027, you can apply now, but you must reach these marks when results come out.</p>

    <div className="mt-6 rounded-2xl bg-gold/15 border border-gold/40 p-5">
      <p className="font-semibold">Latest on age and attempt limits</p>
      <p className="mt-1 text-sm">In October 2026 a parliamentary panel recommended bringing in age and attempt limits for NEET. This is <b>only a recommendation</b>. NTA has not notified any change for 2027. We will update this page if the official bulletin changes the rules. See <Link to="/neet-2027-updates" className={link}>NEET 2027 latest updates</Link>.</p>
    </div>

    <H2>Special cases</H2>
    <ul className="mt-4 space-y-2 list-disc pl-5">
      <li><b>Droppers / repeaters:</b> eligible. There is no attempt limit.</li>
      <li><b>PCM students:</b> eligible if they studied Biology/Biotechnology as an additional subject.</li>
      <li><b>Open school (NIOS) / private candidates:</b> check the 2027 information bulletin. These rules have changed in past years.</li>
      <li><b>Students over 25:</b> eligible under current rules.</li>
    </ul>
    <p className="mt-4">Eligible? Keep your documents ready with the <Link to="/neet-registration" className={link}>NEET registration guide</Link>, and check which colleges fit your expected rank with the <Link to="/neet-college-predictor" className={link}>NEET College Predictor</Link>.</p>

    <Readiness />
    <Guides />
    <Faqs faqs={ELIG_FAQS} />
    <p className="text-sm text-ink/70 dark:text-paper/70 mt-6">Always confirm in the NEET UG 2027 information bulletin on neet.nta.nic.in. YNeet is not affiliated with NTA or NMC.</p>
    <StartFree />
  </Shell>
);

/* ───────────────────────── Syllabus ───────────────────────── */

const PHYSICS = ["Physics and Measurement", "Kinematics", "Laws of Motion", "Work, Energy and Power", "Rotational Motion", "Gravitation", "Properties of Solids and Liquids", "Thermodynamics", "Kinetic Theory of Gases", "Oscillations and Waves", "Electrostatics", "Current Electricity", "Magnetic Effects of Current and Magnetism", "Electromagnetic Induction and Alternating Currents", "Electromagnetic Waves", "Optics", "Dual Nature of Matter and Radiation", "Atoms and Nuclei", "Electronic Devices", "Experimental Skills"];
const CHEM: [string, string[]][] = [
  ["Physical Chemistry", ["Some Basic Concepts in Chemistry", "Atomic Structure", "Chemical Bonding and Molecular Structure", "Chemical Thermodynamics", "Solutions", "Equilibrium", "Redox Reactions and Electrochemistry", "Chemical Kinetics"]],
  ["Inorganic Chemistry", ["Classification of Elements and Periodicity in Properties", "p-Block Elements", "d- and f-Block Elements", "Coordination Compounds"]],
  ["Organic Chemistry", ["Purification and Characterisation of Organic Compounds", "Some Basic Principles of Organic Chemistry", "Hydrocarbons", "Organic Compounds Containing Halogens", "Organic Compounds Containing Oxygen", "Organic Compounds Containing Nitrogen", "Biomolecules", "Principles Related to Practical Chemistry"]],
];
const BIO = ["Diversity in Living World", "Structural Organisation in Animals and Plants", "Cell Structure and Function", "Plant Physiology", "Human Physiology", "Reproduction", "Genetics and Evolution", "Biology and Human Welfare", "Biotechnology and Its Applications", "Ecology and Environment"];

const SYL_FAQS: QA[] = [
  ["Has the NEET 2027 syllabus been released?", "NMC has not yet released a separate NEET UG 2027 syllabus. The NEET 2026 syllabus, released by NMC on 23 December 2025 with no changes from 2025, is the reference until the 2027 version comes out."],
  ["Who releases the NEET syllabus?", "The National Medical Commission (NMC) prescribes the NEET UG syllabus on nmc.org.in. NTA conducts the exam and follows the NMC syllabus."],
  ["How many units are in the NEET syllabus?", "The current NMC syllabus has 50 units: 20 in Physics, 20 in Chemistry and 10 in Biology, based on NCERT Class 11 and 12."],
  ["Are there any deleted topics in NEET 2027?", "No new deletions have been announced for 2027. The major reduction happened for NEET 2024; the 2025 and 2026 syllabi had no changes."],
  ["Is NCERT enough for the NEET 2027 syllabus?", "NCERT Class 11 and 12 covers the syllabus and is essential, especially for Biology. Add previous-year questions and full-length mock tests for Physics and Chemistry problem practice."],
];

const Units = ({ items, start = 1 }: { items: string[]; start?: number }) => (
  <ol start={start} className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1 list-decimal pl-6">
    {items.map((u) => <li key={u}>{u}</li>)}
  </ol>
);

export const NeetSyllabus = () => {
  let n = 1;
  return (
    <Shell title="NEET 2027 Syllabus: Physics, Chemistry and Biology (Unit-wise)" intro="The NEET UG syllabus as prescribed by NMC, unit by unit, and the facts on deleted topics.">
      <Answer>
        The NEET 2027 syllabus has <b>not been released yet</b> by the National Medical Commission (NMC). Prepare from the <b>NEET 2026 NMC syllabus</b>: <b>50 units</b> (Physics 20, Chemistry 20, Biology 10) based on <b>NCERT Class 11 and 12</b>. No new deletions have been announced for 2027.
      </Answer>

      <H2>NEET syllabus at a glance</H2>
      <Table boldLast head={["Subject", "Units", "Questions", "Marks"]} rows={[
        ["Physics", "20", "45", "180"],
        ["Chemistry", "20", "45", "180"],
        ["Biology (Botany + Zoology)", "10", "90", "360"],
        ["Total", "50", "180", "720"],
      ]} />

      <H2>Physics (20 units)</H2>
      <Units items={PHYSICS} />

      <H2>Chemistry (20 units)</H2>
      {CHEM.map(([group, units]) => {
        const s = n; n += units.length;
        return (
          <div key={group}>
            <p className="font-semibold mt-4">{group}</p>
            <Units items={units} start={s} />
          </div>
        );
      })}

      <H2>Biology (10 units)</H2>
      <Units items={BIO} />
      <p className="mt-4 text-sm">See which chapters carry the most marks: <Link to="/neet-chapter-wise-weightage" className={link}>NEET chapter-wise weightage</Link>.</p>

      <H2>NEET 2027 deleted syllabus: what is true</H2>
      <ul className="mt-4 space-y-2 list-disc pl-5">
        <li>The big reduction came with the <b>NEET 2024</b> syllabus.</li>
        <li><b>NEET 2025 and 2026</b> had <b>no additions or deletions</b>. NMC released the 2026 syllabus on 23 December 2025.</li>
        <li><b>No 2027 deletions</b> have been announced. Ignore lists that claim otherwise until NMC publishes the 2027 syllabus.</li>
        <li>An NCERT textbook deletion is <b>not automatically</b> a NEET deletion. Only the NMC syllabus decides.</li>
      </ul>

      <H2>How to use this syllabus</H2>
      <ul className="mt-4 space-y-2 list-disc pl-5">
        <li>Track each unit: done, revised, tested. Biology carries half the marks, so read NCERT line by line.</li>
        <li>Practise <Link to="/neet-practice" className={link}>chapter-wise NEET PYQs</Link> for every unit.</li>
        <li>From March 2027, switch to full-length mock tests and fix weak chapters after each one.</li>
      </ul>

      <Readiness />
      <Guides />
      <Faqs faqs={SYL_FAQS} />
      <p className="text-sm text-ink/70 dark:text-paper/70 mt-6">Always confirm on nmc.org.in and neet.nta.nic.in. YNeet is not affiliated with NTA or NMC.</p>
      <StartFree />
    </Shell>
  );
};

/* ─────────────────── Tamil Nadu counselling ─────────────────── */

const TN_FAQS: QA[] = [
  ["Who conducts Tamil Nadu NEET counselling?", "The Selection Committee of the Directorate of Medical Education and Research (DME), Chennai conducts TN MBBS/BDS counselling on tnmedicalselection.net for 85% state quota seats in government colleges and seats in self-financing colleges."],
  ["What is the 7.5% government school reservation in Tamil Nadu?", "7.5% of state seats in MBBS and BDS are reserved for NEET-qualified students who studied in Tamil Nadu government schools from Class 6 to 12. Study is verified through the EMIS number. No processing fee, security deposit or tuition fee is charged under this quota. In 2026 it covered 641 seats (537 MBBS, 104 BDS)."],
  ["What is the community reservation in Tamil Nadu MBBS counselling?", "Tamil Nadu follows 69% reservation: BC 26.5%, BCM 3.5%, MBC/DNC 20%, SC 15%, SCA 3% and ST 1%, with 31% open competition (OC) filled by merit from all communities."],
  ["When will Tamil Nadu NEET counselling 2027 start?", "Dates are not announced. Based on past years, registration on tnmedicalselection.net opens after the NEET result, with rank lists and Round 1 following."],
  ["Do I need to register separately for MCC and Tamil Nadu counselling?", "Yes. MCC (mcc.nic.in) handles the 15% All India Quota and deemed universities; the TN Selection Committee handles the 85% state quota and private college seats in Tamil Nadu. Register for both to keep all options open."],
];

export const TnCounselling = () => (
  <Shell title="Tamil Nadu NEET Counselling 2027: Process, 7.5% Quota and Reservation" intro="How MBBS and BDS seats are filled in Tamil Nadu: who runs counselling, community reservation, the 7.5% government school quota and what to keep ready.">
    <Answer>
      Tamil Nadu MBBS/BDS counselling is run by the <b>DME Selection Committee, Chennai</b> on <b>tnmedicalselection.net</b> for <b>85% state quota</b> government seats and self-financing college seats. Seats follow <b>69% community reservation</b>, plus a <b>7.5% quota for government school students</b> (Class 6–12). 2027 dates are not out yet; registration opens after the NEET 2027 result.
    </Answer>

    <H2>Which seats Tamil Nadu counselling fills</H2>
    <Table head={["Seat type", "Who allots"]} rows={[
      ["15% All India Quota (govt colleges)", "MCC (mcc.nic.in)"],
      ["85% State Quota (govt colleges)", "TN Selection Committee"],
      ["Govt quota seats in self-financing colleges", "TN Selection Committee"],
      ["Management / NRI quota (private colleges)", "TN Selection Committee"],
      ["Deemed universities, AIIMS, JIPMER", "MCC"],
    ]} />
    <p className="mt-3">Register in <b>both</b> MCC and Tamil Nadu counselling. See how <Link to="/neet-counselling-2027" className={link}>NEET counselling 2027</Link> works overall.</p>

    <H2>Community reservation (69%)</H2>
    <Table head={["Community", "Reservation"]} rows={[
      ["OC (open competition, merit, all communities)", "31%"],
      ["BC (Backward Class)", "26.5%"],
      ["BCM (Backward Class Muslim)", "3.5%"],
      ["MBC / DNC", "20%"],
      ["SC", "15%"],
      ["SCA (SC Arunthathiyar)", "3%"],
      ["ST", "1%"],
    ]} />
    <p className="mt-3">Open-competition seats are filled by merit first, so top-ranked BC, MBC and SC students often take OC seats before their own quota opens.</p>

    <H2>7.5% government school reservation</H2>
    <ul className="mt-4 space-y-2 list-disc pl-5">
      <li>For NEET-qualified students who studied in <b>Tamil Nadu government schools from Class 6 to 12</b>.</li>
      <li>School study is verified through your <b>EMIS number</b>; older passouts may need a bona fide certificate.</li>
      <li><b>No processing fee, security deposit or tuition fee</b> under this quota.</li>
      <li>2026: <b>641 seats</b> (537 MBBS + 104 BDS), with a separate merit list and counselling schedule.</li>
    </ul>

    <H2>Tamil Nadu MBBS cutoff</H2>
    <p className="mt-3">College-wise, community-wise closing ranks from official counselling data: <Link to="/neet-cutoff/tamil-nadu" className={link}>Tamil Nadu NEET cutoff</Link> (<Link to="/ta/neet-cutoff/tamil-nadu" className={link}>தமிழில்</Link>). Check your chances with the free <Link to="/neet-college-predictor" className={link}>NEET College Predictor</Link>.</p>

    <H2>Expected timeline for 2027</H2>
    <Table head={["Stage", "Expected (based on past years)"]} rows={[
      ["NEET UG 2027 exam", "Likely early May 2027 (not announced)"],
      ["NEET result", "About a month after the exam"],
      ["TN online registration", "Opens around the NEET result"],
      ["Rank lists (GQ, MQ, 7.5%)", "A few weeks after registration closes"],
      ["Round 1, 2, 3 and stray", "Over the following two to three months"],
    ]} />

    <H2>Documents to keep ready</H2>
    <ul className="mt-4 space-y-1 list-disc pl-5">
      <li>NEET 2027 admit card and scorecard</li>
      <li>Class 10 and 12 mark sheets, transfer certificate</li>
      <li>Nativity and community certificates (Tamil Nadu)</li>
      <li>EMIS number or bona fide certificate (for the 7.5% quota)</li>
      <li>Aadhaar, passport photos, income certificate if applicable</li>
    </ul>

    <div lang="ta" className="mt-10 rounded-2xl border border-rise/30 bg-rise/10 p-5">
      <h2 className="font-display text-xl font-bold">தமிழில் சுருக்கம்</h2>
      <p className="mt-2">தமிழ்நாடு MBBS/BDS கலந்தாய்வை சென்னை மருத்துவக் கல்வி இயக்ககத்தின் தேர்வுக் குழு tnmedicalselection.net இணையதளத்தில் நடத்துகிறது. அரசுக் கல்லூரிகளில் 85% இடங்கள் மாநில ஒதுக்கீடு. 6 முதல் 12 ஆம் வகுப்பு வரை அரசுப் பள்ளியில் படித்த மாணவர்களுக்கு 7.5% இட ஒதுக்கீடு உண்டு; இதற்கு கல்விக் கட்டணம் இல்லை. 2027 கலந்தாய்வு தேதிகள் இன்னும் அறிவிக்கப்படவில்லை; NEET 2027 முடிவுக்குப் பிறகு பதிவு தொடங்கும்.</p>
    </div>

    <Readiness />
    <Guides />
    <Faqs faqs={TN_FAQS} />
    <p className="text-sm text-ink/70 dark:text-paper/70 mt-6">Always confirm on tnmedicalselection.net. YNeet is not affiliated with the DME Tamil Nadu, NTA or MCC.</p>
    <StartFree />
  </Shell>
);

/* ───────────────────────── Updates log ───────────────────────── */

// Newest first. Add a new entry at the top the day NTA / NMC publishes, and
// update the matching STATUS row and the related guide page.
const UPDATES: { date: string; iso: string; tag: string; title: string; body: string }[] = [
  { date: "24 November 2026", iso: "2026-11-24", tag: "Status", title: "NEET 2027 date, syllabus and notification not yet released", body: "NTA has not announced the NEET UG 2027 exam date, mode or notification, and NMC has not released the 2027 syllabus. Follow the 2026 NMC syllabus until then." },
  { date: "October 2026", iso: "2026-10", tag: "Eligibility", title: "Parliamentary panel recommends NEET age and attempt limits", body: "A parliamentary panel recommended age and attempt limits for NEET. This is only a recommendation; no change has been notified for NEET 2027. Current rules: minimum age 17 by 31 December 2027, no upper age limit, no attempt limit." },
  { date: "16 September 2026", iso: "2026-09-16", tag: "NTA", title: "NTA exam calendar to March 2027 does not list NEET UG 2027", body: "NTA's exam calendar released on 16 September 2026 runs up to March 2027 and does not include NEET UG 2027." },
  { date: "16 July 2026", iso: "2026-07-16", tag: "NEET 2026", title: "NEET 2026 re-exam result declared", body: "After the 3 May 2026 exam was cancelled on 12 May following a paper leak, NTA held a pen-and-paper re-exam on 21 June 2026 and declared the result on 16 July 2026." },
  { date: "May 2026", iso: "2026-05", tag: "Exam mode", title: "Education Ministry says NEET will move to computer-based testing", body: "The ministry said NEET would move to computer-based testing. As of November 2026 NTA has not confirmed the mode for 2027; the task force deadline was extended to January 2027." },
  { date: "23 December 2025", iso: "2025-12-23", tag: "Syllabus", title: "NMC released NEET 2026 syllabus with no changes", body: "NMC published the NEET UG 2026 syllabus with no additions or deletions compared with 2025. It remains the reference until the 2027 syllabus is released." },
];

const STATUS: [ReactNode, string, string][] = [
  [<Link to="/neet-2027-syllabus" className={link}>NEET 2027 syllabus (NMC)</Link>, "Awaited", "Usually released in December"],
  ["Information bulletin & notification", "Awaited", "Not announced"],
  ["Registration window", "Awaited", "Opens with the notification"],
  [<Link to="/neet-2027-exam-date" className={link}>Exam date</Link>, "Awaited", "Likely early May 2027"],
  ["Exam mode (CBT or pen and paper)", "Awaited", "Decision expected after January 2027"],
  [<Link to="/neet-2027-eligibility" className={link}>Age / attempt limits</Link>, "No change notified", "Panel recommendation only (Oct 2026)"],
  [<Link to="/neet-2027-admit-card" className={link}>Admit card</Link>, "Awaited", "A few days before the exam"],
  [<Link to="/neet-2027-result" className={link}>Result</Link>, "Awaited", "About a month after the exam"],
  [<Link to="/tamil-nadu-neet-counselling-2027" className={link}>TN counselling</Link>, "Awaited", "After the result"],
];

export const NeetUpdates = () => (
  <Shell title="NEET 2027 Latest Updates: Official News Only" intro="Every official NEET UG 2027 announcement from NTA and NMC in one place, newest first. Updated the same day.">
    <Answer>
      As of {LAST_CHECKED}, <b>NTA has not announced</b> the NEET UG 2027 exam date, mode or notification, and <b>NMC has not released</b> the 2027 syllabus. The syllabus is usually released in December and the notification a few months before the exam.
    </Answer>

    <H2>Status board</H2>
    <Table head={["Item", "Status", "Expected"]} rows={STATUS.map(([a, b, c]) => [a, <span className={b === "Awaited" ? "font-semibold text-amber-700 dark:text-amber-400" : "font-semibold text-rise-dark"}>{b}</span>, c])} />

    <H2>All updates (newest first)</H2>
    <div className="mt-4 space-y-5">
      {UPDATES.map((u) => (
        <article key={u.iso + u.title} className="border-l-4 border-gold pl-4">
          <time dateTime={u.iso} className="text-sm font-semibold text-ink/70 dark:text-paper/70">{u.date}</time>
          <h3 className="font-semibold text-lg mt-1">{u.title} <span className="ml-1 text-xs rounded bg-ink/[0.06] dark:bg-paper/10 px-2 py-0.5 align-middle">{u.tag}</span></h3>
          <p className="mt-1 text-ink/80 dark:text-paper/80">{u.body}</p>
        </article>
      ))}
    </div>

    <H2>Official sources we track</H2>
    <ul className="mt-4 space-y-1 list-disc pl-5">
      <li>NTA NEET: neet.nta.nic.in</li>
      <li>NMC syllabus: nmc.org.in</li>
      <li>MCC counselling (All India Quota): mcc.nic.in</li>
      <li>Tamil Nadu counselling: tnmedicalselection.net</li>
    </ul>
    <p className="text-sm text-ink/70 dark:text-paper/70 mt-4">We post only official announcements, never rumours. YNeet is not affiliated with NTA, NMC or MCC.</p>

    <Readiness />
    <Guides />
    <StartFree />
    <script type="application/ld+json" dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "LiveBlogPosting",
        headline: "NEET 2027 Latest Updates", url: "https://www.yneet.in/neet-2027-updates",
        coverageStartTime: "2025-12-23",
        publisher: { "@type": "Organization", name: "YNeet", url: "https://www.yneet.in" },
        liveBlogUpdate: UPDATES.map((u) => ({ "@type": "BlogPosting", headline: u.title, datePublished: u.iso, articleBody: u.body })),
      }).replace(/</g, "\\u003c"),
    }} />
  </Shell>
);
