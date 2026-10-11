import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Microscope, Stethoscope, ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
import { SITE } from "../utils/siteInfo";

// This page gets most of YNeet's Google impressions (searches like "neet
// online course", "online neet preparation", "neet course"), so it carries
// real, specific text about what the course is, who it's for and what it
// costs — not just two cards of bullet points.

const courses = [
  {
    icon: Stethoscope,
    title: "NEET Coaching",
    tag: "Class 11, Class 12 & Droppers",
    desc: "Full NEET-depth preparation for the exam itself. Practise every chapter of Physics, Chemistry and Biology with chapter-wise tests, then build exam stamina with full-length NEET mock tests and previous year questions.",
    items: ["Class 11", "Class 12", "Droppers / repeaters", "Crash courses"],
  },
  {
    icon: Microscope,
    title: "NEET Foundation",
    tag: "Classes 6–10",
    desc: "An early start for younger students — science concepts, aptitude and logical thinking at the right depth for your class, so the jump to NEET-level material in Class 11 feels natural.",
    items: ["Foundation for Olympiads", "Science aptitude", "Logical thinking"],
  },
];

const included = [
  "Full-length NEET mock tests and chapter-wise tests, with instant analysis after every attempt",
  "Previous year NEET questions, organised year by year",
  "A practice question bank you can filter by chapter, topic and difficulty",
  "A fresh daily quiz, scoped to your class syllabus",
  "An automatic mistake notebook that logs every wrong answer for revision",
  "Chapter-wise flashcards and Physics & Chemistry formula sheets",
  "Progress tracking: score trend and subject-wise strengths",
  "Doubt support on WhatsApp",
];

const steps = [
  { title: "Register", desc: "Create your account in about two minutes and tell us your class." },
  { title: "Pick a plan", desc: "Start with the ₹99 five-day trial, or choose a monthly plan." },
  { title: "Start practising", desc: "Every test, quiz and question you see is matched to your class syllabus." },
];

const faqs = [
  {
    q: "Which classes is the YNeet NEET course for?",
    a: "NEET Coaching is for students in Class 11, Class 12 and droppers preparing for NEET. NEET Foundation is for Classes 6 to 10.",
  },
  {
    q: "How much does the online NEET course cost?",
    a: "You can start with a five-day full-access trial for ₹99. Monthly plans start from ₹300, depending on your class. Plans are one-time payments.",
  },
  {
    q: "Can I try YNeet before paying?",
    a: "Yes. The homepage has a free 30-question NEET sample test — no login needed.",
  },
  {
    q: "Is the content the same for every class?",
    a: "No. Mock tests, quizzes and practice questions are scoped to your exact class, so a Class 11 student practises Class 11 chapters and a dropper gets the full NEET syllabus.",
  },
];

const Courses = () => {
  const whatsapp = `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(SITE.whatsappMessage)}`;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm">Courses</p>
      <h1 className="font-display text-4xl font-bold mt-2 max-w-3xl">
        Online NEET course for Class 11, Class 12 &amp; Droppers
      </h1>
      <p className="mt-5 text-ink/70 text-lg leading-relaxed max-w-3xl">
        YNeet is online NEET preparation built around your class syllabus — chapter-wise and
        full-length mock tests, previous year questions, a daily quiz and a large practice
        question bank for Physics, Chemistry and Biology, with doubt support on WhatsApp.
        Younger students can start early with NEET Foundation for Classes 6–10.
      </p>

      <div className="grid sm:grid-cols-2 gap-6 mt-12">
        {courses.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-ink/10 p-6 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all bg-white"
          >
            <div className="h-12 w-12 rounded-xl bg-rise-light flex items-center justify-center">
              <c.icon className="text-rise-dark" size={24} />
            </div>
            <h2 className="font-display font-bold text-xl mt-4">{c.title}</h2>
            <p className="text-gold-dark text-sm font-semibold mt-1">{c.tag}</p>
            <p className="text-ink/70 text-sm leading-relaxed mt-3">{c.desc}</p>

            <ul className="mt-4 space-y-1.5 text-sm text-ink/70 flex-1">
              {c.items.map((it) => (
                <li key={it}>• {it}</li>
              ))}
            </ul>

            <Link
              to="/register"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-rise-dark hover:text-rise"
            >
              Enroll in {c.title} <ArrowRight size={16} />
            </Link>
          </motion.div>
        ))}
      </div>

      <section className="mt-16 grid lg:grid-cols-2 gap-10">
        <div>
          <h2 className="font-display text-2xl font-bold">What's included in every plan</h2>
          <ul className="mt-5 space-y-3">
            {included.map((p) => (
              <li key={p} className="flex items-start gap-3 text-ink/80">
                <CheckCircle2 className="text-gold shrink-0 mt-0.5" size={20} />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-ink text-paper p-8 self-start">
          <h2 className="font-display text-2xl font-bold">Plans &amp; pricing</h2>
          <div className="mt-6 space-y-5">
            <div>
              <p className="text-gold font-display text-3xl font-bold">₹99</p>
              <p className="text-paper/80">Five-day trial with full access to every mock test, quiz and practice question.</p>
            </div>
            <div>
              <p className="text-gold font-display text-3xl font-bold">From ₹300<span className="text-base font-body text-paper/70"> / month</span></p>
              <p className="text-paper/80">Monthly plans, priced by class. One-time payments.</p>
            </div>
          </div>
          <Link
            to="/register"
            className="mt-8 inline-flex items-center gap-2 bg-gold text-ink font-semibold px-6 py-3 rounded-full hover:bg-gold-dark transition-colors"
          >
            Start the ₹99 trial <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-bold">How it works</h2>
        <ol className="grid sm:grid-cols-3 gap-6 mt-6">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-ink/10 bg-white p-6">
              <p className="text-gold-dark font-display font-bold text-lg">{i + 1}. {s.title}</p>
              <p className="text-ink/70 text-sm mt-2 leading-relaxed">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 max-w-3xl">
        <h2 className="font-display text-2xl font-bold">Questions about the NEET course</h2>
        <div className="mt-6 space-y-6">
          {faqs.map((f) => (
            <div key={f.q}>
              <h3 className="font-semibold text-ink">{f.q}</h3>
              <p className="text-ink/70 mt-1.5 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            to="/"
            className="inline-flex justify-center items-center gap-2 border border-ink/20 font-semibold px-6 py-3 rounded-full hover:bg-ink/5 transition-colors"
          >
            Try the free 30-question test
          </Link>
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex justify-center items-center gap-2 border border-ink/20 font-semibold px-6 py-3 rounded-full hover:bg-ink/5 transition-colors"
          >
            <MessageCircle size={18} /> Ask us on WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
};

export default Courses;
