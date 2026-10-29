import { Link } from "react-router-dom";
import { OTHER_SITES, siteLink, trackSiteClick } from "../OurOtherSites";
import { ArrowRight, MessageCircle } from "lucide-react";
import { SITE, gamesLink } from "../../utils/siteInfo";

// Footer grouped by what a visitor is looking for: free practice first, then
// YNeet itself, then parents/institutes, then help. Other Raise Academy sites
// sit in a small line at the bottom so they don't pull NEET visitors away.

type Item = { label: string; to?: string; href?: string; onClick?: () => void };

const FREE: Item[] = [
  { label: "NEET Readiness Test", to: "/neet-readiness" },
  { label: "NEET Question of the Day", to: "/neet-question-of-the-day" },
  { label: "Chapter-wise NEET PYQs", to: "/neet-practice" },
  { label: "NEET question papers by year", to: "/neet-question-papers" },
  { label: "NCERT Biology notes", to: "/ncert-notes" },
  { label: "Daily NEET puzzles", href: gamesLink("footer") },
  { label: "NEET 2027 exam date", to: "/neet-2027-exam-date" },
];

const YNEET: Item[] = [
  { label: "Courses & prices", to: "/courses" },
  { label: "Start 30 days free", to: "/register" },
  { label: "Student login", to: "/login" },
  { label: "Pay online", href: "https://pay.yneet.in" },
  { label: "Blog", to: "/blog" },
  { label: "About us", to: "/about" },
];

const PARENTS: Item[] = [
  { label: "For parents", to: "/neet-parents" },
  { label: "For coaching institutes", to: "/institutes" },
  { label: "Institute login", to: "/institute/login" },
];

const HELP: Item[] = [
  { label: "Talk on WhatsApp", href: `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(SITE.whatsappMessage)}` },
  ...(SITE.whatsappChannel ? [{ label: "Daily NEET Question channel", href: SITE.whatsappChannel }] : []),
  { label: "Help & FAQ", to: "/help" },
  { label: "Contact us", href: "https://pay.yneet.in/contact" },
  { label: "Refund policy", href: "https://pay.yneet.in/refund" },
];

function Column({ title, items }: { title: string; items: Item[] }) {
  return (
    <div>
      <h4 className="font-display font-semibold text-paper mb-3">{title}</h4>
      <ul className="space-y-2 text-sm">
        {items.map((i) => (
          <li key={i.label}>
            {i.to ? (
              <Link to={i.to} className="hover:text-gold">{i.label}</Link>
            ) : (
              <a href={i.href} target="_blank" rel="noopener noreferrer" className="hover:text-gold">{i.label}</a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const Footer = () => {
  return (
    <footer className="bg-ink text-paper/80 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-2 lg:grid-cols-6 gap-x-6 gap-y-10">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <img src={SITE.logoUrl} alt={SITE.name} className="h-9 w-9 rounded-lg object-cover" />
            <span className="font-display font-bold text-lg text-paper">{SITE.name}</span>
          </div>
          <p className="text-sm leading-relaxed max-w-sm">
            NEET mock tests, chapter-wise PYQs, daily quizzes and weekly parent reports, matched to your class. Free for 30 days from Class 9; free for Class 6–8.
          </p>
          <Link to="/register" className="mt-5 inline-flex items-center gap-2 bg-gold text-ink font-semibold px-5 py-2.5 rounded-full hover:bg-gold-dark">
            Start 30 days free <ArrowRight size={16} />
          </Link>
          {SITE.whatsappChannel && (
            <a href={SITE.whatsappChannel} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-2 text-sm hover:text-gold">
              <MessageCircle size={16} className="text-gold" /> Follow the Daily NEET Question channel
            </a>
          )}
        </div>
        <Column title="Free NEET practice" items={FREE} />
        <Column title="YNeet" items={YNEET} />
        <Column title="Parents & institutes" items={PARENTS} />
        <Column title="Help" items={HELP} />
      </div>

      <div className="border-t border-paper/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 pr-20 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-xs text-paper/55">
          <span>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</span>
          <span>
            More from Raise Academy:{" "}
            {OTHER_SITES.map((o, i) => (
              <span key={o.key}>
                {i > 0 && " · "}
                <a href={siteLink(o.url, "footer")} target="_blank" rel="noopener" onClick={() => trackSiteClick(o.key, "footer")} className="hover:text-gold underline-offset-2 hover:underline">
                  {o.name}
                </a>
              </span>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
