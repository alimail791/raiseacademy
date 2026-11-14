import { Link } from "react-router-dom";
import { OTHER_SITES, siteLink, trackSiteClick } from "../OurOtherSites";
import { ArrowRight, MessageCircle, Smartphone, Youtube } from "lucide-react";

// The live Google Play listing; VITE_PLAY_STORE_URL on Railway can override it.
const YOUTUBE_URL = "https://www.youtube.com/channel/UCj5krrV4r1n-ru9hWZDKOtA";
// The Play Store button shows only when VITE_PLAY_STORE_URL is set (Railway
// variable on the website service, then redeploy). Left unset while the app is
// in closed testing: the public listing 404s until it's in production.
// When live: VITE_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=in.yneet.app
const PLAY_URL: string = import.meta.env.VITE_PLAY_STORE_URL || "";
import { SITE, gamesLink } from "../../utils/siteInfo";
import { PRACTICE, STUDY, TOOLS } from "../../utils/navLinks";

// Footer: brand strip on top, then six short columns: the three free-feature
// groups (shared with the header menu), then YNeet, parents/institutes, help.
// Other Raise Academy sites sit in a small line at the bottom so they don't
// pull NEET visitors away.

type Item = { label: string; to?: string; href?: string };

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
  { label: "Free NEET widgets for your website", to: "/neet-question-widget" },
];

const HELP: Item[] = [
  { label: "Talk on WhatsApp", href: `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(SITE.whatsappMessage)}` },
  { label: "Help & FAQ", to: "/help" },
  { label: "Contact us", href: "https://pay.yneet.in/contact" },
  { label: "Refund policy", href: "https://pay.yneet.in/refund" },
  { label: "Terms of Service", to: "/terms" },
  { label: "Privacy policy", to: "/privacy" },
  { label: "Delete my account", to: "/delete-account" },
];

function Column({ title, items }: { title: string; items: Item[] }) {
  return (
    <div>
      <h2 className="font-display font-semibold text-base text-paper mb-3">{title}</h2>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-10">
        {/* Brand strip */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-10 border-b border-paper/10">
          <div className="max-w-md">
            <div className="flex items-center gap-2 mb-3">
              <img src={SITE.logoUrl} alt={SITE.name} className="h-9 w-9 rounded-lg object-cover" />
              <span className="font-display font-bold text-lg text-paper">{SITE.name}</span>
            </div>
            <p className="text-sm leading-relaxed">
              NEET mock tests, chapter-wise PYQs, daily quizzes and weekly parent reports, matched to your class. Free for 30 days for Class 9–12 and droppers; free for Class 6–8.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/register" className="inline-flex items-center gap-2 bg-gold text-ink font-semibold px-5 py-2.5 rounded-full hover:bg-gold-dark">
              Start 30 days free <ArrowRight size={16} />
            </Link>
            {PLAY_URL && (
              <a href={PLAY_URL} target="_blank" rel="noopener noreferrer" onClick={() => { try { (window as any).gtag?.("event", "play_store_click", { place: "footer" }); } catch { /* ignore */ } }}
                className="flex w-fit items-center gap-3 rounded-xl border border-paper/25 px-4 py-2 hover:border-gold">
                <Smartphone size={20} className="text-gold" />
                <span className="leading-tight"><span className="block text-[11px] text-paper/60">Get the app on</span><span className="font-semibold text-paper">Google Play</span></span>
              </a>
            )}
            <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" onClick={() => { try { (window as any).gtag?.("event", "youtube_click", { place: "footer" }); } catch { /* ignore */ } }}
              className="flex items-center gap-2 text-sm hover:text-gold">
              <Youtube size={18} className="text-gold" /> Daily NEET quiz on YouTube
            </a>
            {SITE.whatsappChannel && (
              <a href={SITE.whatsappChannel} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-gold">
                <MessageCircle size={16} className="text-gold" /> Daily NEET Question channel
              </a>
            )}
          </div>
        </div>

        {/* Link columns */}
        <div className="pt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-10">
          <Column title={`Free ${PRACTICE.title.toLowerCase()}`} items={PRACTICE.items.map((i) => (i.href ? { ...i, href: gamesLink("footer") } : i))} />
          <Column title={`Free ${STUDY.title.toLowerCase()}`} items={STUDY.items} />
          <Column title={TOOLS.title} items={TOOLS.items} />
          <Column title="YNeet" items={YNEET} />
          <Column title="Parents & institutes" items={PARENTS} />
          <Column title="Help" items={HELP} />
        </div>
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
