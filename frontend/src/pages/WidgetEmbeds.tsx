// Boxes other websites (coaching centres, schools, blogs) show in an <iframe>:
//   /embed/predictor            NEET College Predictor: rank + category + state → opens the predictor
//   /embed/cutoff?state=<slug>  top government MBBS cutoffs for one quota
// No site header or footer. Every link opens www.yneet.in in a new tab and
// carries the host site in its UTM tags (same as the Question of the Day box).
import { useEffect, useState } from "react";
import api from "../api/axios";
import type { CutoffState } from "../practice/practiceData";

function hostSite() {
  try { return document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : "direct"; } catch { return "direct"; }
}
function useLink(campaign: string) {
  const [site, setSite] = useState("direct");
  useEffect(() => { setSite(hostSite()); }, []);
  return (path: string) => `https://www.yneet.in${path}${path.includes("?") ? "&" : "?"}utm_source=${encodeURIComponent(site)}&utm_medium=widget&utm_campaign=${campaign}`;
}

function Frame({ title, tag, children, footer }: { title: string; tag?: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="font-body text-ink bg-white min-h-screen p-3">
      <div className="rounded-2xl border border-ink/15 overflow-hidden bg-white">
        <div className="bg-ink text-paper px-4 py-3 flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gold">{title}</span>
          {tag && <span className="text-xs text-paper/70">{tag}</span>}
        </div>
        <div className="p-4">{children}</div>
        <div className="border-t border-ink/10 px-4 py-2.5 flex items-center justify-between gap-2 text-xs">{footer}</div>
      </div>
    </div>
  );
}

// Same list as the College Predictor's home-state choices.
export const PREDICTOR_STATES: [string, string][] = [
  ["", "Only All India Quota"], ["AP", "Andhra Pradesh"], ["BR", "Bihar"], ["DL", "Delhi (DU/IP)"], ["GJ", "Gujarat"], ["JH", "Jharkhand"],
  ["KA", "Karnataka"], ["KL", "Kerala"], ["MP", "Madhya Pradesh"], ["MH", "Maharashtra"], ["PB", "Punjab"], ["RJ", "Rajasthan"],
  ["TN", "Tamil Nadu"], ["TS", "Telangana"], ["UP", "Uttar Pradesh"], ["WB", "West Bengal"],
];
const CATS: [string, string][] = [["OPEN", "General / UR"], ["EWS", "EWS"], ["OBC", "OBC (NCL)"], ["SC", "SC"], ["ST", "ST"]];

export const PredictorEmbed = () => {
  const link = useLink("predictor_embed");
  const [air, setAir] = useState("");
  const [category, setCategory] = useState("OPEN");
  const [state, setState] = useState("");
  const [course, setCourse] = useState("MBBS");
  const [err, setErr] = useState("");

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{1,7}$/.test(air.trim())) { setErr("Enter your NEET All India Rank"); return; }
    const q = new URLSearchParams({ air: air.trim(), category, course, ...(state && { state }) });
    window.open(link(`/neet-college-predictor?${q}`), "_blank", "noopener");
  };
  const input = "w-full mt-1 px-3 py-2.5 rounded-xl border border-ink/20 bg-white text-sm min-h-[44px]";

  return (
    <Frame title="NEET College Predictor" tag="Free"
      footer={<><span className="text-ink/55">From last year's official closing ranks</span><a href={link("/neet-college-predictor")} target="_blank" rel="noopener" className="font-bold text-ink hover:text-gold-dark">by YNeet ↗</a></>}>
      <p className="text-sm text-ink/70">See the MBBS and BDS colleges you can get with your NEET rank: All India Quota plus your state quota.</p>
      <form onSubmit={go} className="mt-3 space-y-3">
        <label className="block text-sm font-semibold">NEET All India Rank
          <input inputMode="numeric" value={air} onChange={(e) => { setAir(e.target.value.replace(/\D/g, "")); setErr(""); }} placeholder="e.g. 45000" className={input} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">Category
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={input}>
              {CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Course
            <select value={course} onChange={(e) => setCourse(e.target.value)} className={input}>
              <option value="MBBS">MBBS</option><option value="BDS">BDS</option>
            </select>
          </label>
        </div>
        <label className="block text-sm font-semibold">Home state
          <select value={state} onChange={(e) => setState(e.target.value)} className={input}>
            {PREDICTOR_STATES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button type="submit" className="w-full bg-gold text-ink font-bold px-5 py-3 rounded-full hover:bg-gold-dark min-h-[44px]">Show my colleges ↗</button>
      </form>
    </Frame>
  );
};

const fmt = (n?: number) => (n === undefined ? "—" : n.toLocaleString("en-IN"));
const ROWS = 10;

export const CutoffEmbed = () => {
  const link = useLink("cutoff_embed");
  const [slug, setSlug] = useState("");
  const [c, setC] = useState<CutoffState | null | undefined>(undefined);

  useEffect(() => {
    const s = (new URLSearchParams(window.location.search).get("state") || "all-india-quota").toLowerCase().replace(/[^a-z-]/g, "");
    setSlug(s);
    api.get(`/predictor/cutoff-pages?state=${s}`)
      .then((r) => setC((r.data.states || []).find((x: CutoffState) => x.slug === s) || null))
      .catch(() => setC(null));
  }, []);

  const name = c ? (c.code === "AIQ" ? "All India Quota" : c.name) : "";
  const unit = c?.rankType === "SCORE" ? "marks" : "rank";
  const valueHead = c?.rankType === "SCORE" ? "General (marks)" : "General (rank)";
  const open = c?.categorySummary.find((x) => x.category === "OPEN");

  return (
    <Frame title={c ? `${name} NEET cutoff ${c.year}` : "NEET cutoff"} tag="Govt MBBS"
      footer={<><span className="text-ink/55">Official counselling data</span><a href={link(`/neet-cutoff/${slug}`)} target="_blank" rel="noopener" className="font-bold text-ink hover:text-gold-dark">by YNeet ↗</a></>}>
      {c === undefined && <p className="text-sm text-ink/50">Loading cutoffs…</p>}
      {c === null && <p className="text-sm text-ink/60">Couldn't load the cutoffs. <a href={link("/neet-cutoff")} target="_blank" rel="noopener" className="underline font-semibold">See them on YNeet</a>.</p>}
      {c && (
        <>
          {open && <p className="text-sm text-ink/70">General category: last government MBBS seat at {unit === "marks" ? <><b>{fmt(open.last)}</b> marks</> : <>rank <b>{fmt(open.last)}</b></>}.</p>}
          <table className="w-full mt-3 text-sm border-collapse">
            <thead><tr className="text-left border-b border-ink/15"><th className="py-1.5 pr-2">College</th><th className="py-1.5 text-right">{valueHead}</th></tr></thead>
            <tbody>
              {c.colleges.filter((x) => x.closing.OPEN !== undefined).slice(0, ROWS).map((x) => (
                <tr key={x.college} className="border-b border-ink/5"><td className="py-1.5 pr-2">{x.college}</td><td className="py-1.5 text-right">{fmt(x.closing.OPEN)}</td></tr>
              ))}
            </tbody>
          </table>
          <a href={link(`/neet-cutoff/${slug}`)} target="_blank" rel="noopener" className="inline-block mt-3 text-sm font-semibold text-rise-dark underline">All {c.colleges.length} colleges, every category ↗</a>
        </>
      )}
    </Frame>
  );
};
