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
} from "lucide-react";
import Counter from "../components/Counter";
import FreeTestSection from "../components/FreeTestSection";
import { SITE } from "../utils/siteInfo";

const whyUs = [
  { icon: Layers, title: "Class-Scoped Content", desc: "Mock tests, quizzes and practice questions matched strictly to your class syllabus — 6th to Dropper." },
  { icon: ClipboardCheck, title: "Daily Practice", desc: "A fresh quiz every day plus a full practice bank filtered by chapter, topic and difficulty." },
  { icon: BrainCircuit, title: "Mistake Notebook", desc: "Every wrong answer is logged automatically so you know exactly what to revise." },
  { icon: TrendingUp, title: "Progress Tracking", desc: "See your score trend, subject-wise strength, and estimated rank as you improve." },
  { icon: BookMarked, title: "Flashcards & Formulas", desc: "Chapter-wise flashcards and formula sheets for Physics, Chemistry and Biology." },
  { icon: MessageCircle, title: "Doubt Support", desc: "Reach us directly on WhatsApp whenever you're stuck." },
  { icon: Wallet, title: "Affordable Plans", desc: "Start with a 5-day trial for ₹99, or go monthly for ₹299 — full access either way." },
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
            className="uppercase tracking-widest text-gold text-sm font-semibold mb-4"
          >
            NEET Preparation, Built Around You
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
            Mastering NEET concepts, Enroll Today for top results.
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
              Enroll Now <ArrowRight size={18} />
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
          <Counter to={70} suffix="+" label="NEET Questions in bank" />
          <Counter to={19} suffix="" label="Mock Tests" />
          <Counter to={7} suffix="" label="Class levels covered" />
          <Counter to={365} suffix="" label="Days of daily quizzes" />
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

      {/* CTA */}
      <section className="bg-rise text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-3xl font-bold">Ready to raise your rank?</h2>
          <p className="mt-3 text-white/85">Enroll now and start with a 5-day full-access trial for ₹99.</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 mt-7 bg-white text-rise-dark font-semibold px-7 py-3 rounded-full hover:bg-paper transition-colors"
          >
            Enroll Now <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
