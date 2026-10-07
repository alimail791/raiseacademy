import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
import FreeTestSection from "../components/FreeTestSection";
import { SITE } from "../utils/siteInfo";

// Landing page for Google Ads: one message, one button. The full home page
// has many links competing for attention; ad visitors should see the offer,
// the price and a single Register button, with the free taster below it.
const points = [
  "Full-length & chapter-wise NEET mock tests with instant analysis",
  "Daily quiz, flashcards and formula sheets for Physics, Chemistry & Biology",
  "Previous year questions, year by year",
  "Made for 11th, 12th & Dropper — matched to your class syllabus",
  "Doubt support on WhatsApp",
];

const NeetTrial = () => {
  const whatsapp = `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(SITE.whatsappMessage)}`;
  return (
    <div>
      <section className="bg-rise-line text-paper">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <p className="uppercase tracking-widest text-gold text-xs sm:text-sm font-semibold mb-3">
            NEET Mock Tests &amp; Practice
          </p>
          <h1 className="font-display text-3xl sm:text-5xl font-bold leading-tight">
            Start your NEET prep today for just <span className="text-gold">₹99</span>
          </h1>
          <p className="mt-4 text-paper/80 text-base sm:text-lg">
            5 days of full access to every mock test, quiz and practice question.
          </p>

          <Link
            to="/register"
            className="mt-8 inline-flex items-center gap-2 bg-gold text-ink font-semibold px-8 py-4 rounded-full text-lg hover:bg-gold-dark transition-colors"
          >
            Register &amp; Start Trial <ArrowRight size={20} />
          </Link>
          <p className="mt-3 text-paper/60 text-sm">Takes about 2 minutes. Monthly plans from ₹300.</p>
        </div>
      </section>

      <section className="max-w-xl mx-auto px-4 py-10">
        <ul className="space-y-3">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-3 text-ink/80">
              <CheckCircle2 className="text-gold shrink-0 mt-0.5" size={20} />
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            to="/register"
            className="flex-1 inline-flex justify-center items-center gap-2 bg-ink text-paper font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
          >
            Start the ₹99 trial <ArrowRight size={18} />
          </Link>
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="flex-1 inline-flex justify-center items-center gap-2 border border-ink/20 font-semibold px-6 py-3 rounded-full hover:bg-ink/5 transition-colors"
          >
            <MessageCircle size={18} /> Ask us on WhatsApp
          </a>
        </div>
      </section>

      <div className="border-t border-ink/10">
        <p className="text-center text-ink/60 pt-10 px-4">Not sure yet? Try 30 free questions first — no login.</p>
        <FreeTestSection />
      </div>
    </div>
  );
};

export default NeetTrial;
