import { motion } from "framer-motion";
import { Target, Eye, HeartHandshake } from "lucide-react";

const values = [
  { icon: Target, title: "Our Mission", desc: "To make every student, from Class 6 foundations through Dropper-level intensity, exam-ready and confident — with content matched to exactly where they are, not a one-size-fits-all syllabus." },
  { icon: Eye, title: "Our Vision", desc: "To be the most trusted NEET preparation companion for students across every stage of school and coaching." },
  { icon: HeartHandshake, title: "Our Promise", desc: "Class-scoped mock tests, daily quizzes, practice questions, flashcards and formula sheets — kept simple, current, and genuinely useful." },
];

const About = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm">About Us</p>
      <h1 className="font-display text-4xl font-bold mt-2 max-w-2xl">
        We're completely dedicated to transforming the way you prepare for NEET.
      </h1>
      <p className="mt-6 text-ink/70 text-lg leading-relaxed max-w-3xl">
        YNeet is built around one idea: that with the right content, delivered at the right
        depth for your class, any student can rise. We support students from Class 6 through
        Class 12 and Droppers, with foundation-level content for younger students and full
        NEET-depth material for 11th, 12th and repeaters — mock tests, daily quizzes, a
        practice question bank, a mistake notebook, flashcards, and formula sheets.
      </p>

      <div className="grid sm:grid-cols-3 gap-6 mt-14">
        {values.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="p-6 rounded-2xl bg-ink text-paper"
          >
            <v.icon className="text-gold" size={26} />
            <h3 className="font-display font-semibold text-lg mt-4">{v.title}</h3>
            <p className="text-paper/70 text-sm mt-2 leading-relaxed">{v.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-16 grid sm:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="font-display text-2xl font-bold">What you get with YNeet</h2>
          <ul className="mt-4 space-y-2 text-ink/70">
            <li>• Mock tests — full-length and subject-wise</li>
            <li>• A fresh daily quiz, scoped to your class</li>
            <li>• A practice question bank with PYQ filters</li>
            <li>• An automatic mistake notebook</li>
            <li>• Chapter-wise flashcards</li>
            <li>• Physics &amp; Chemistry formula sheets</li>
          </ul>
        </div>
        <div className="rounded-2xl overflow-hidden aspect-video bg-rise-line flex items-center justify-center text-paper/70 text-sm">
          Preparing you, one chapter at a time.
        </div>
      </div>
    </div>
  );
};

export default About;
