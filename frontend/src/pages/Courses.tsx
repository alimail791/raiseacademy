import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Microscope, Stethoscope, ArrowRight } from "lucide-react";

const courses = [
  {
    icon: Microscope,
    title: "NEET Foundation",
    tag: "Classes 6–10",
    boards: [],
    items: ["Foundation for Olympiads", "Science Aptitude", "Logical Thinking"],
  },
  {
    icon: Stethoscope,
    title: "NEET Coaching",
    tag: "Classes 11, 12 & Droppers",
    boards: [],
    items: ["Class 11", "Class 12", "Droppers", "Crash Courses"],
  },
];

const Courses = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm">Courses</p>
      <h1 className="font-display text-4xl font-bold mt-2 max-w-2xl">
        A course for every stage of your journey.
      </h1>

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
            <h3 className="font-display font-bold text-xl mt-4">{c.title}</h3>
            <p className="text-gold-dark text-sm font-semibold mt-1">{c.tag}</p>

            {c.boards.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {c.boards.map((b) => (
                  <span key={b} className="text-xs bg-ink/5 px-2.5 py-1 rounded-full">{b}</span>
                ))}
              </div>
            )}

            <ul className="mt-4 space-y-1.5 text-sm text-ink/70 flex-1">
              {c.items.map((it) => (
                <li key={it}>• {it}</li>
              ))}
            </ul>

            <Link
              to="/register"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-rise-dark hover:text-rise"
            >
              Enroll in this course <ArrowRight size={16} />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Courses;
