import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Gift } from "lucide-react";
import Counter from "../components/Counter";
import FeaturedShortsSection from "../components/FeaturedShortsSection";
import { FeatureGroups, CompareTable, ParentReportSection } from "../components/YNeetSales";
import { gamesLink } from "../utils/siteInfo";


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
              <Gift size={18} /> 30-DAY FREE TRIAL · Class 9 to Dropper <span className="hidden sm:inline font-medium">· no payment needed</span>
            </Link>
            <Link to="/register?junior=1" className="hidden ml-0 sm:ml-2 mt-2 sm:mt-0 sm:inline-flex items-center gap-2 bg-white text-rise-dark text-sm sm:text-base font-bold px-4 py-2 rounded-full hover:scale-[1.03] transition-transform">
              FREE for Class 6–8 <span className="font-medium">· tests, puzzles, quiz &amp; Shorts</span>
            </Link>
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl sm:text-6xl font-bold leading-[1.1] max-w-3xl"
          >
            NEET mock tests &amp; practice that <span className="text-gold">show you what to fix.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 max-w-xl text-paper/80 text-lg"
          >
            1,200+ NEET tests, PYQs and daily quizzes, with your weak chapters after every test. <b className="text-gold">Free for 30 days</b>, no card needed.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-9 flex flex-wrap gap-4"
          >
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-gold text-ink font-bold text-lg px-7 py-3.5 rounded-full hover:bg-gold-dark transition-colors"
            >
              Start 30 Days Free <ArrowRight size={18} />
            </Link>
            <Link
              to="/neet-readiness"
              className="inline-flex items-center gap-2 bg-paper/10 border border-paper/30 text-paper font-semibold px-6 py-3 rounded-full hover:bg-paper/20 transition-colors"
            >
              Check your NEET score free <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* RESULTS STRIP */}
      <section className="bg-ink text-paper py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <Counter to={1200} suffix="+" label="NEET tests" />
          <Counter to={98} suffix="" label="Chapters of free PYQs" />
          <Counter to={30} suffix="" label="Days free, no card" />
          <Counter to={8} suffix="" label="Class levels (6th to Dropper)" />
        </div>
      </section>

      {/* NEET READINESS — shareable 15-question score check */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-2">
        <Link to="/neet-readiness" className="block rounded-3xl bg-rise-line text-paper p-7 sm:p-9 hover:opacity-95">
          <p className="text-gold font-bold uppercase tracking-wider text-sm">Free · 5 minutes · No login</p>
          <p className="font-display text-2xl sm:text-3xl font-bold mt-2">What's your NEET Readiness Score?</p>
          <p className="text-paper/80 mt-2">15 NEET-level questions with NEET marking. Get your score out of 100, your weak chapters and a score card to share.</p>
          <span className="mt-4 inline-block bg-gold text-ink font-bold px-6 py-3 rounded-full">Check my score →</span>
        </Link>
      </section>

      <FeatureGroups heading="Everything you need for NEET, in one place" />

      <div className="border-t border-ink/10"><CompareTable /></div>

      <div className="bg-gold/10 border-y border-gold/20"><ParentReportSection /></div>

      {/* PRICES — short version; full table on /courses */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center">Simple prices, by class</h2>
        <p className="text-center text-ink/65 dark:text-paper/65 mt-2">Start with 30 days free. After that, pay only for the months you need. One-time payment, no auto-debit.</p>
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { cls: "Class 6–8", price: "Free", note: "Tests, puzzles, quiz & Shorts", to: "/register?junior=1" },
            { cls: "Class 9–10", price: "₹299/mo", note: "or ₹2,399 a year", to: "/register" },
            { cls: "Class 11–12", price: "₹399/mo", note: "or ₹3,199 a year", to: "/register", top: true },
            { cls: "Dropper", price: "₹499/mo", note: "or ₹3,999 a year", to: "/register" },
          ].map((p) => (
            <Link key={p.cls} to={p.to} className={`rounded-2xl p-5 bg-white dark:bg-ink-light hover:border-gold ${p.top ? "border-2 border-gold" : "border border-ink/10 dark:border-paper/15"}`}>
              <p className="text-sm font-semibold text-gold-dark">{p.cls}</p>
              <p className="font-display text-2xl font-bold mt-1">{p.price}</p>
              <p className="text-sm text-ink/60 dark:text-paper/60 mt-1">{p.note}</p>
            </Link>
          ))}
        </div>
        <p className="text-center mt-5"><Link to="/courses#pricing" className="font-semibold text-rise-dark underline">See all plans and what's included</Link></p>
      </section>

      {/* FREE DAILY GAMES — a no-sign-up way in for visitors not ready to register */}
      <section className="py-16 sm:py-20 bg-gold/10 border-y border-gold/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm">New · YNeet Daily</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mt-2">
              5 free puzzles every day, for every class.
            </h2>
            <p className="text-ink/70 mt-4 text-lg max-w-xl">
              A new set every morning, made from NCERT. Class 6–8, Class 9–10 and NEET students each get puzzles from their own syllabus and their own leaderboard. Play in 5 minutes and keep your streak.
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

      {/* YNEET SHORTS — featured creator videos + creator recruitment */}
      <FeaturedShortsSection />

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
