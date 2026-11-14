import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// Home page: invite visitors to play the free 60-Second Sprint (/neet-sprint).
const SprintSection = () => (
  <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-2">
    <Link to="/neet-sprint" className="block rounded-3xl bg-[#3b2fc9] text-white p-7 sm:p-9 hover:opacity-95">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
        <div>
          <p className="text-gold-light font-bold uppercase tracking-wider text-sm">Free · 60 seconds · No login</p>
          <p className="font-display text-2xl sm:text-3xl font-bold mt-2">60-Second Sprint: can you get 5/5?</p>
          <p className="text-indigo-100 mt-2">5 quick NEET questions against the clock. See how you compare with YNeet students.</p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-2 bg-gold text-ink font-bold px-6 py-3 rounded-full self-start sm:self-center">
          Play now <ArrowRight size={18} />
        </span>
      </div>
    </Link>
  </section>
);

export default SprintSection;
