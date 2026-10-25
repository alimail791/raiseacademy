import { motion } from "framer-motion";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Microscope, Stethoscope, ArrowRight, CheckCircle2, MessageCircle, Puzzle, Gift } from "lucide-react";
import { SITE } from "../utils/siteInfo";

// This page gets most of YNeet's Google impressions (searches like "neet
// online course", "online neet preparation", "neet course"), so it carries
// real, specific text about what the course is, who it's for and what it
// costs — not just two cards of bullet points.

const courses = [
  {
    icon: Stethoscope,
    title: "NEET Coaching",
    tag: "Class 11, Class 12 & Droppers · from ₹399/month",
    desc: "Full NEET-depth preparation for the exam itself. Practise every chapter of Physics, Chemistry and Biology with chapter-wise tests and concept Shorts, then build exam stamina with full-length NEET mock tests and previous year questions.",
    items: ["720-mark full mock tests with rank analysis", "Chapter-wise tests and PYQs 2016–2026", "Concept Shorts in English, Tamil and Hindi", "WhatsApp doubt support"],
  },
  {
    icon: Microscope,
    title: "NEET Foundation",
    tag: "Class 9 & Class 10 · ₹299/month",
    desc: "Build the base for NEET two years early — science concepts, MCQ practice and mock tests at the right depth for your class, so the jump to NEET-level material in Class 11 feels natural.",
    items: ["Class 9 & 10 science MCQs", "Foundation mock tests", "Concept Shorts", "Daily quiz and puzzles"],
  },
  {
    icon: Puzzle,
    title: "YNeet Junior",
    tag: "Classes 6–8 · Free",
    desc: "Free for Class 6–8. Daily science puzzles, a daily quiz from your syllabus and short concept videos — a fun habit that builds curiosity for science and medicine.",
    items: ["Daily science puzzles", "Daily quiz", "Concept Shorts", "No payment, ever"],
  },
];

// Keep in sync with YNeet backend/src/utils/pricing.js
const plans = [
  { cls: "Class 6–8", name: "YNeet Junior", monthly: 0, year: 0, note: "Puzzles, daily quiz and Shorts" },
  { cls: "Class 9–10", name: "NEET Foundation", monthly: 299, six: 1499, year: 2399, note: "Everything in YNeet" },
  { cls: "Class 11–12", name: "NEET Full", monthly: 399, six: 1999, year: 3199, note: "Everything in YNeet", popular: true },
  { cls: "Droppers", name: "NEET Full", monthly: 499, six: 2499, year: 3999, note: "Full NEET syllabus" },
];
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const included = [
  "Full-length NEET mock tests and chapter-wise tests, with instant analysis after every attempt",
  "YNeet Shorts — 3–5 minute concept videos in English, Tamil and Hindi, with a quick check after each",
  "Daily NEET puzzle games on play.yneet.in",
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
  { title: "Pick a plan", desc: "Class 6–8 is free. From Class 9, start with the free 30-day trial, then choose 1, 6 or 12 months." },
  { title: "Start practising", desc: "Every test, quiz and question you see is matched to your class syllabus." },
];

const faqs = [
  {
    q: "Which classes is the YNeet NEET course for?",
    a: "NEET Coaching is for students in Class 11, Class 12 and droppers preparing for NEET. NEET Foundation is for Class 9 and 10. YNeet Junior is free for Classes 6 to 8.",
  },
  {
    q: "How much does the online NEET course cost?",
    a: "YNeet is free for Class 6–8. From Class 9, every new student gets a free 30-day full-access trial. After that it's ₹299/month for Class 9–10, ₹399/month for Class 11–12 and ₹499/month for droppers — or a full year for about 8 months' price (₹2,399 / ₹3,199 / ₹3,999). Plans are one-time payments, no auto-charge.",
  },
  {
    q: "What do Class 6–8 students get for free?",
    a: "Daily science puzzles, a daily quiz from their syllabus and concept Shorts — no payment, ever. Sign-up takes a minute, and parents get a free weekly progress report on WhatsApp. From Class 9 they can move to NEET Foundation.",
  },
  {
    q: "What are YNeet Shorts?",
    a: "Short 3–5 minute videos that explain one NEET concept each, in English, Tamil or Hindi, followed by a quick check. They're included in every plan.",
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
  // Links like /courses#pricing (from the homepage badge) jump to that section.
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [hash]);
  const whatsapp = `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(SITE.whatsappMessage)}`;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm">Courses</p>
      <h1 className="font-display text-4xl font-bold mt-2 max-w-3xl">
        Online NEET course from Class 6 to Droppers
      </h1>
      <p className="mt-5 text-ink/70 text-lg leading-relaxed max-w-3xl">
        YNeet is online NEET preparation built around your class syllabus — chapter-wise and
        full-length mock tests, previous year questions, 3–5 minute concept Shorts, a daily quiz
        and a 4,000+ question practice bank for Physics, Chemistry and Biology, with doubt support
        on WhatsApp. NEET Full for Class 11, 12 and droppers, NEET Foundation for Class 9–10, and
        YNeet Junior — free — for Class 6–8.
      </p>

      <Link to="/register" className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl bg-rise text-white px-5 py-4 max-w-3xl hover:bg-rise-dark transition-colors">
        <Gift size={26} className="shrink-0" />
        <span className="flex-1 min-w-[200px]"><b className="font-display text-lg">Free for Class 6–8.</b> Daily science puzzles, a daily quiz and concept Shorts — no payment, ever.</span>
        <span className="inline-flex items-center gap-1 font-semibold">Register free <ArrowRight size={16} /></span>
      </Link>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
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
          <h2 className="font-display text-2xl font-bold">Start free</h2>
          <div className="mt-6 space-y-5">
            <div>
              <p className="text-gold font-display text-3xl font-bold">Class 6–8 · Free</p>
              <p className="text-paper/80">Daily puzzles, daily quiz and Shorts. No payment, no trial needed.</p>
            </div>
            <div>
              <p className="text-gold font-display text-3xl font-bold">Class 9+ · 30 days free</p>
              <p className="text-paper/80">Full access to every mock test, quiz, Short and practice question. No payment needed.</p>
            </div>
          </div>
          <Link
            to="/register"
            className="mt-8 inline-flex items-center gap-2 bg-gold text-ink font-semibold px-6 py-3 rounded-full hover:bg-gold-dark transition-colors"
          >
            Register free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="mt-16" id="pricing">
        <h2 className="font-display text-2xl font-bold">Plans &amp; pricing</h2>
        <p className="text-ink/60 mt-1">Priced by class. One-time payment, no auto-charge. A full year costs about 8 months' price.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
          {plans.map((p) => {
            const free = p.monthly === 0;
            return (
              <div key={p.cls} className={`relative rounded-2xl p-6 flex flex-col bg-white ${free ? "border-2 border-rise ring-4 ring-rise/10" : p.popular ? "border-2 border-gold" : "border border-ink/10"}`}>
                {free && <span className="absolute -top-3 left-5 bg-rise text-white text-xs font-bold px-3 py-1 rounded-full">FREE FOREVER</span>}
                {p.popular && <span className="absolute -top-3 left-5 bg-gold text-ink text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>}
                <p className="text-sm font-semibold text-gold-dark">{p.cls}</p>
                <p className="font-display font-bold text-lg">{p.name}</p>
                {free ? (
                  <>
                    <p className="font-display text-4xl font-bold text-rise-dark mt-3">₹0</p>
                    <p className="text-sm text-ink/60">No payment, ever</p>
                  </>
                ) : (
                  <>
                    <p className="font-display text-4xl font-bold mt-3">{inr(p.monthly)}<span className="text-base font-body text-ink/50"> /month</span></p>
                    <p className="text-sm text-ink/60">or <b className="text-ink">{inr(p.year!)}</b> for a full year · {inr(p.six!)} for 6 months</p>
                    <p className="text-xs font-semibold text-rise-dark mt-1">Save {inr(p.monthly * 12 - p.year!)} with the yearly plan</p>
                  </>
                )}
                <p className="text-sm text-ink/70 mt-3 flex-1">{p.note}</p>
                <Link to="/register" className={`mt-5 text-center font-semibold py-2.5 rounded-full transition-colors ${free ? "bg-rise text-white hover:bg-rise-dark" : "bg-ink text-paper hover:bg-ink/90"}`}>
                  {free ? "Register free" : "Start 30 days free"}
                </Link>
              </div>
            );
          })}
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

      <section className="mt-16 grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-ink/10 bg-white p-6">
          <h2 className="font-display text-xl font-bold">Learn with YNeet Shorts</h2>
          <p className="text-ink/70 text-sm leading-relaxed mt-2">
            One concept in 3–5 minutes, made by teachers across India in English, Tamil and Hindi.
            After every Short there's a quick check from the question bank, and wrong answers go
            straight to your mistake notebook.
          </p>
          <Link to="/" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-rise-dark hover:text-rise">Watch sample Shorts on the homepage <ArrowRight size={16} /></Link>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-6">
          <h2 className="font-display text-xl font-bold">For coaching institutes</h2>
          <p className="text-ink/70 text-sm leading-relaxed mt-2">
            Give every student YNeet from ₹1,200 per student per year, with a live progress panel and
            weekly parent reports. Class 6–8 students are free and don't use a seat.
          </p>
          <Link to="/institutes" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-rise-dark hover:text-rise">See institute plans <ArrowRight size={16} /></Link>
        </div>
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
