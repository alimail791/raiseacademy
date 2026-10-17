import { ArrowUpRight, ClipboardList, GraduationCap, BookOpenCheck } from "lucide-react";

// Cross-promotion of Raise Academy's other products. Links carry UTM tags so
// visits show up as "yneet / referral" in each site's analytics, and each click
// fires a GA event (cross_site_click) here on yneet.in.
export const OTHER_SITES = [
  {
    key: "testmandi",
    name: "TestMandi",
    domain: "testmandi.in",
    url: "https://testmandi.in",
    for: "Students, teachers & institutes",
    icon: ClipboardList,
    pitch: "India's online test marketplace. Take mock tests for NEET and other exams with instant score reports, or sell your own tests and worksheets and keep 80% of every sale.",
    cta: "Explore tests",
  },
  {
    key: "classcoach",
    name: "ClassCoach",
    domain: "classcoach.in",
    url: "https://classcoach.in",
    for: "Teachers & tutors",
    icon: GraduationCap,
    pitch: "An AI teaching assistant for tutors. Grade descriptive answers with AI, create class slides, and share notes and question banks with your students.",
    cta: "Try ClassCoach",
  },
  {
    key: "vasulbook",
    name: "VasulBook",
    domain: "vasulbook.com",
    url: "https://vasulbook.com",
    for: "Shop owners & businesses",
    icon: BookOpenCheck,
    pitch: "A simple credit ledger for any business. Record customer dues, send payment reminders and collect money faster, on your phone. 3 months free.",
    cta: "Start free trial",
  },
];

export const siteLink = (url: string, placement: string) =>
  `${url}/?utm_source=yneet&utm_medium=referral&utm_campaign=${placement}`;

export const trackSiteClick = (site: string, placement: string) => {
  try { (window as any).gtag?.("event", "cross_site_click", { site, placement, transport_type: "beacon" }); } catch { /* analytics only */ }
};

const OurOtherSites = () => (
  <section className="py-16 sm:py-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="max-w-2xl mb-10">
        <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm">More from Raise Academy</p>
        <h2 className="font-display text-3xl sm:text-4xl font-bold mt-2">Tools for students, teachers and businesses</h2>
        <p className="text-ink/60 mt-3">The team behind YNeet also builds these. Free to sign up on each.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {OTHER_SITES.map((s) => (
          <a
            key={s.key}
            href={siteLink(s.url, "home_more_sites")}
            target="_blank"
            rel="noopener"
            onClick={() => trackSiteClick(s.key, "home")}
            className="group flex flex-col p-6 rounded-2xl border border-ink/10 bg-white hover:border-gold/60 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <s.icon className="text-rise" size={28} />
              <span className="text-xs font-semibold text-ink/50 bg-ink/5 px-2.5 py-1 rounded-full">{s.for}</span>
            </div>
            <h3 className="font-display font-bold text-xl mt-4">{s.name}</h3>
            <p className="text-sm text-rise-dark font-medium">{s.domain}</p>
            <p className="text-ink/65 text-sm mt-3 flex-1">{s.pitch}</p>
            <span className="inline-flex items-center gap-1.5 mt-5 font-semibold text-ink group-hover:text-gold-dark">
              {s.cta} <ArrowUpRight size={17} />
            </span>
          </a>
        ))}
      </div>
    </div>
  </section>
);

export default OurOtherSites;
