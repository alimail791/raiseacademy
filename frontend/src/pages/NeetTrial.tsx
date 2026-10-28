import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle } from "lucide-react";
import { FeatureGroups, CompareTable, ParentReportSection, FreeStartCards } from "../components/YNeetSales";
import { SITE } from "../utils/siteInfo";

// Landing page for Google Ads: one message, one button. The full home page
// has many links competing for attention; ad visitors should see the offer,
// the price and a single Register button, then what's included, how YNeet
// compares, the parent report, and free ways in for visitors not ready yet.

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
            Start your NEET prep today — <span className="text-gold">free for 30 days</span>
          </h1>
          <p className="mt-4 text-paper/80 text-base sm:text-lg">
            30 days of full access to every mock test, quiz and practice question. No payment, no card.
          </p>

          <Link
            to="/register"
            className="mt-8 inline-flex items-center gap-2 bg-gold text-ink font-semibold px-8 py-4 rounded-full text-lg hover:bg-gold-dark transition-colors"
          >
            Register &amp; Start Free Trial <ArrowRight size={20} />
          </Link>
          <p className="mt-3 text-paper/60 text-sm">Takes about 2 minutes. After the trial, plans from ₹399/month, or ₹3,199 for a full year.</p>
        </div>
      </section>

      <FeatureGroups heading="What you get for 30 days, free" />

      <section className="max-w-xl mx-auto px-4 pb-4 flex flex-col sm:flex-row gap-3">
        <Link
          to="/register"
          className="flex-1 inline-flex justify-center items-center gap-2 bg-ink text-paper font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
        >
          Start the free 30-day trial <ArrowRight size={18} />
        </Link>
        <a
          href={whatsapp}
          target="_blank"
          rel="noreferrer"
          className="flex-1 inline-flex justify-center items-center gap-2 border border-ink/20 font-semibold px-6 py-3 rounded-full hover:bg-ink/5 transition-colors"
        >
          <MessageCircle size={18} /> Ask us on WhatsApp
        </a>
      </section>

      <div className="border-t border-ink/10"><CompareTable /></div>
      <div className="bg-gold/10 border-y border-gold/20"><ParentReportSection /></div>
      <FreeStartCards />
    </div>
  );
};

export default NeetTrial;
