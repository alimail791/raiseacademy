import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Send } from "lucide-react";
import api from "../api/axios";

// www.yneet.in/i/<slug>: free NEET tools page for one coaching centre / school,
// made from the widgets page (pages/QotdWidget.tsx → "No website?").
// Every box says "Shared by <institute>". Not indexed (see seo.ts).

type Partner = { name: string; slug: string; city: string; kind: string; cutoffState: string };

const BOXES = (p: Partner): { title: string; src: string; height: number }[] => {
  const by = `by=${encodeURIComponent(p.name)}`;
  return [
    { title: "NEET Question of the Day", src: `/embed/qotd?${by}`, height: 560 },
    { title: "NEET College Predictor", src: `/embed/predictor?${by}`, height: 480 },
    { title: "Government MBBS cutoffs", src: `/embed/cutoff?state=${p.cutoffState || "all-india-quota"}&${by}`, height: 680 },
    { title: "Chapter-wise weightage", src: `/embed/weightage?subject=Biology&${by}`, height: 600 },
  ];
};

const PartnerPage = () => {
  const { slug = "" } = useParams();
  const [p, setP] = useState<Partner | null | undefined>(undefined);

  useEffect(() => {
    api.get(`/widgets/partners/${encodeURIComponent(slug)}`)
      .then((r) => { setP(r.data.partner); document.title = `${r.data.partner.name} — Free NEET Tools`; })
      .catch(() => setP(null));
  }, [slug]);

  if (p === undefined) return <div className="max-w-5xl mx-auto px-4 py-16 text-ink/70">Loading…</div>;
  if (p === null) return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="font-display text-3xl font-bold">Page not found</h1>
      <p className="mt-3 text-ink/70">This tools page doesn't exist. <a href="/neet-tools" className="underline font-semibold">See all free NEET tools on YNeet</a>.</p>
    </div>
  );

  const url = `https://www.yneet.in/i/${p.slug}`;
  const share = `Free NEET tools from ${p.name}: daily NEET question, college predictor, cutoffs and chapter weightage. ${url}`;
  const join = `/register?utm_source=${encodeURIComponent(p.slug)}&utm_medium=partner_page&utm_campaign=widget_partner`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <p className="text-gold-deep dark:text-gold font-semibold uppercase tracking-widest text-sm">Free for our students</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">{p.name}{p.city ? `, ${p.city}` : ""}</h1>
      <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg max-w-3xl">Free NEET tools: today's NEET question, a college predictor, government MBBS cutoffs and the chapters that matter most. No login needed.</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <a href={`https://wa.me/?text=${encodeURIComponent(share)}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 bg-gold text-ink font-semibold px-5 py-3 rounded-full hover:bg-gold-dark"><Send size={18} /> Share with friends</a>
        <a href={join} className="inline-flex items-center gap-2 border border-ink/20 dark:border-paper/25 font-semibold px-5 py-3 rounded-full hover:border-gold">Practise free on YNeet</a>
      </div>

      <div className="mt-10 grid md:grid-cols-2 gap-8 justify-items-center">
        {BOXES(p).map((b) => (
          <iframe key={b.src} src={b.src} title={b.title} className="w-full rounded-2xl" style={{ height: b.height, maxWidth: 460, border: 0 }} loading="lazy" />
        ))}
      </div>

      <p className="mt-10 text-sm text-ink/60 dark:text-paper/60 text-center">
        Tools by <a href="/" className="underline font-semibold">YNeet</a>. Run a coaching centre or school? <a href="/neet-question-widget#no-website" className="underline font-semibold">Get your own free page</a>.
      </p>
    </div>
  );
};

export default PartnerPage;
