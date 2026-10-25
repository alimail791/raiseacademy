import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MessageCircle,
  ArrowRight,
  Layers,
  ClipboardCheck,
  TrendingUp,
  BrainCircuit,
  BookMarked,
  Wallet,
  Gift,
} from "lucide-react";
import Counter from "../components/Counter";
import FreeTestSection from "../components/FreeTestSection";
import OurOtherSites from "../components/OurOtherSites";
import { SITE, gamesLink } from "../utils/siteInfo";

const whyUs = [
  { icon: Layers, title: "Class-Scoped Content", desc: "Mock tests, quizzes and practice questions matched strictly to your class syllabus — 6th to Dropper." },
  { icon: ClipboardCheck, title: "Daily Practice", desc: "A fresh quiz every day plus a full practice bank filtered by chapter, topic and difficulty." },
  { icon: BrainCircuit, title: "Mistake Notebook", desc: "Every wrong answer is logged automatically so you know exactly what to revise." },
  { icon: TrendingUp, title: "Progress Tracking", desc: "See your score trend, subject-wise strength, and estimated rank as you improve." },
  { icon: BookMarked, title: "Flashcards & Formulas", desc: "Chapter-wise flashcards and formula sheets for Physics, Chemistry and Biology." },
  { icon: MessageCircle, title: "Doubt Support", desc: "Reach us directly on WhatsApp whenever you're stuck." },
  { icon: Wallet, title: "Affordable Plans", desc: "Free for Class 6–8. From Class 9, start with a free 30-day trial, then plans from ₹299/month — a full year costs about 8 months' price." },
];

const Home = () => {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-rise-line text-paper">
        <div className="absolute inset-0 opacity-[0.15]" aria-hidden="true">
          <svg viewBox="0 0 800 400" className="w-full h-full" preserveAspectRatio="xMidYMax slice">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <motion.rect
                key={i}
                x={i * 130 + 20}
                width={70}
                fill="#F2A93B"
                initial={{ height: 0, y: 400 }}
                animate={{ height: 60 + i * 40, y: 400 - (60 + i * 40) }}
                transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
              />
            ))}
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5"
          >
            <Link to="/register" className="inline-flex items-center gap-2 bg-gold text-ink text-sm sm:text-base font-bold px-4 py-2 rounded-full shadow-lg shadow-gold/30 hover:scale-[1.03] transition-transform">
              <Gift size={18} /> 30-DAY FREE TRIAL for every student <span className="hidden sm:inline font-medium">· no payment needed</span>
            </Link>
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl sm:text-6xl font-bold leading-[1.1] max-w-3xl"
          >
            Learn Smart, Score High, <span className="text-gold">Achieve Success.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 max-w-xl text-paper/80 text-lg"
          >
            Every NEET mock test, chapter test, PYQ and daily quiz — <b className="text-gold">free for your first 30 days</b>. Register in 2 minutes, no card needed.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-9 flex flex-wrap gap-4"
          >
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-gold text-ink font-semibold px-6 py-3 rounded-full hover:bg-gold-dark transition-colors"
            >
              Start 30 Days Free <ArrowRight size={18} />
            </Link>
            <a
              href="#free-test"
              className="inline-flex items-center gap-2 bg-paper/10 border border-paper/30 text-paper font-semibold px-6 py-3 rounded-full hover:bg-paper/20 transition-colors"
            >
              Take a Free Mock Test <ArrowRight size={18} />
            </a>
            <a
              href={`https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(SITE.whatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
            >
              <MessageCircle size={18} /> Talk on WhatsApp
            </a>
          </motion.div>
        </div>
      </section>

      {/* RESULTS STRIP */}
      <section className="bg-ink text-paper py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <Counter to={70000} suffix="+" label="NEET Questions in bank" />
          <Counter to={1200} suffix="+" label="NEET Tests" />
          <Counter to={7} suffix="" label="Class levels covered" />
          <Counter to={365} suffix="" label="Days of daily quizzes" />
        </div>
      </section>

      {/* FREE DAILY GAMES — a no-sign-up way in for visitors not ready to register */}
      <section className="py-16 sm:py-20 bg-gold/10 border-y border-gold/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm">New · YNeet Daily</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mt-2">
              5 free NEET puzzles every day.
            </h2>
            <p className="text-ink/70 mt-4 text-lg max-w-xl">
              A new set every morning, made from NCERT. Play in 5 minutes, keep your streak and see your All-India rank.
              No sign-up needed to play.
            </p>
            <p className="text-ink/70 mt-3 max-w-xl">
              Invite 3 friends and get <b>1 month of YNeet free</b>.
            </p>
            <a
              href={gamesLink("home")}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 mt-7 bg-rise text-white font-semibold px-7 py-3 rounded-full hover:bg-rise-dark transition-colors"
            >
              Play today's puzzles <ArrowRight size={18} />
            </a>
          </div>
          <ul className="grid sm:grid-cols-2 gap-3">
            {[
              { k: "B", name: "BioWord", desc: "Guess the biology term in 6 tries", c: "#2e9d68" },
              { k: "P", name: "Pinpoint NEET", desc: "Find the NCERT chapter from 5 clues", c: "#3a6fd8" },
              { k: "Z", name: "Pathway Zip", desc: "Connect cycles and pathways in order", c: "#d64f4a" },
              { k: "Q", name: "Element Queens", desc: "Place atoms on a periodic-table grid", c: "#8457d4" },
              { k: "5", name: "Daily 5", desc: "5 NEET MCQs in 2 minutes", c: "#dd851a" },
            ].map((g) => (
              <li key={g.name} className="flex items-center gap-3 bg-white rounded-xl border border-ink/10 p-3">
                <span
                  className="w-11 h-11 shrink-0 rounded-lg grid place-items-center font-display font-bold text-white text-lg"
                  style={{ background: g.c }}
                  aria-hidden="true"
                >
                  {g.k}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{g.name}</span>
                  <span className="block text-sm text-ink/60">{g.desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* WHY US */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-12">
          <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm">Why YNeet</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mt-2">
            Built for students who want to rise, not just pass.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {whyUs.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="p-6 rounded-2xl border border-ink/10 hover:border-gold/50 hover:shadow-lg transition-all bg-white"
            >
              <item.icon className="text-rise" size={28} />
              <h3 className="font-display font-semibold text-lg mt-4">{item.title}</h3>
              <p className="text-ink/60 text-sm mt-2">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FREE TEST — embedded directly here so visitors take it without leaving the page */}
      <section className="bg-ink/[0.03]">
        <FreeTestSection />
      </section>

      {/* TESTMANDI CROSS-PROMOTION */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">Want more NEET practice beyond our program?</h2>
          <p className="text-ink/70 leading-relaxed mb-7">
            TestMandi hosts full-length NEET mock tests covering Biology, Physics and Chemistry, each with an instant,
            topic-wise score report — a solid way to track your weak areas between study sessions.
          </p>
          <a
            href="https://testmandi.in/tests/premium_neet_1/neet-complete-practice-test-biology-physics-chemistry"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-ink/20 text-ink font-semibold px-6 py-3 rounded-full hover:border-gold hover:text-gold-dark transition-colors"
          >
            Take a NEET mock test on TestMandi <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* OTHER RAISE ACADEMY SITES */}
      <div className="bg-ink/[0.03]">
        <OurOtherSites />
      </div>

      {/* CTA */}
      <section className="bg-rise text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-3xl font-bold">Ready to raise your rank?</h2>
          <p className="mt-3 text-white/85">Enroll now and get 30 days of full access free.</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 mt-7 bg-white text-rise-dark font-semibold px-7 py-3 rounded-full hover:bg-paper transition-colors"
          >
            Start 30 Days Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
