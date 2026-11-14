import { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Check } from "lucide-react";
import { SITE } from "../utils/siteInfo";

// /neet-question-widget: free widgets for coaching centres, schools and blogs —
// a preview of each box and the code to paste into their own website. Each code
// ends with a plain-HTML credit link (outside the iframe), which is what counts
// as a link to yneet.in for search engines.

type Widget = { id: string; title: string; blurb: string; height: number; src: (opt: string) => string; credit: (opt: string) => string };

const CUTOFF_STATES: [string, string][] = [
  ["all-india-quota", "All India Quota (AIQ)"], ["andhra-pradesh", "Andhra Pradesh"], ["bihar", "Bihar"], ["delhi", "Delhi"],
  ["gujarat", "Gujarat"], ["jharkhand", "Jharkhand"], ["karnataka", "Karnataka"], ["kerala", "Kerala"], ["madhya-pradesh", "Madhya Pradesh"],
  ["maharashtra", "Maharashtra"], ["punjab", "Punjab"], ["rajasthan", "Rajasthan"], ["tamil-nadu", "Tamil Nadu"], ["telangana", "Telangana"], ["west-bengal", "West Bengal"],
];
const stateName = (slug: string) => CUTOFF_STATES.find(([s]) => s === slug)?.[1] || "";

const WIDGETS: Widget[] = [
  {
    id: "qotd", title: "NEET Question of the Day", height: 560,
    blurb: "A new NEET question every day, mostly from previous NEET papers. Students tap an answer and see the explanation. Updates itself.",
    src: () => "https://www.yneet.in/embed/qotd",
    credit: () => `Daily <a href="https://www.yneet.in/neet-question-of-the-day">NEET Question of the Day</a> by <a href="https://www.yneet.in">YNeet</a>`,
  },
  {
    id: "predictor", title: "NEET College Predictor", height: 480,
    blurb: "Students enter their NEET rank, category and home state and see the MBBS and BDS colleges they can get, from last year's official closing ranks.",
    src: () => "https://www.yneet.in/embed/predictor",
    credit: () => `Free <a href="https://www.yneet.in/neet-college-predictor">NEET College Predictor</a> by <a href="https://www.yneet.in">YNeet</a>`,
  },
  {
    id: "cutoff", title: "NEET Cutoff for Government MBBS", height: 680,
    blurb: "The top government MBBS colleges and their closing ranks for the quota you pick, with a link to every college and category. Updated each counselling year.",
    src: (state) => `https://www.yneet.in/embed/cutoff?state=${state}`,
    credit: (state) => `<a href="https://www.yneet.in/neet-cutoff/${state}">${stateName(state)} NEET cutoff</a> by <a href="https://www.yneet.in">YNeet</a>`,
  },
];

const codeFor = (w: Widget, opt: string) =>
  `<iframe src="${w.src(opt)}" title="${w.title}" width="100%" height="${w.height}" style="border:0;max-width:460px;width:100%" loading="lazy"></iframe>
<p style="font-size:13px;margin:4px 0 0">${w.credit(opt)}</p>`;

const STEPS = [
  ["WordPress", "Edit the page or sidebar, add a Custom HTML block, paste the code and update."],
  ["Wix", "Add → Embed code → Embed HTML, paste the code, then resize the box to about 460 wide."],
  ["Google Sites", "Insert → Embed → Embed code, paste the code and click Next, then Insert."],
  ["Blogger", "Layout → Add a Gadget → HTML/JavaScript, paste the code and save."],
  ["Any other site", "Paste the code into the page's HTML where you want the box to appear."],
];

function WidgetCard({ w }: { w: Widget }) {
  const [opt, setOpt] = useState(w.id === "cutoff" ? "tamil-nadu" : "");
  const [copied, setCopied] = useState(false);
  const code = codeFor(w, opt);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
      try { (window as any).gtag?.("event", "widget_code_copy", { widget: w.id }); } catch { /* analytics only */ }
    } catch { /* clipboard blocked */ }
  };
  return (
    <section id={w.id} className="mt-14 scroll-mt-24">
      <h2 className="font-display text-2xl font-bold">{w.title}</h2>
      <p className="text-ink/70 dark:text-paper/70 mt-2 max-w-3xl">{w.blurb}</p>
      <div className="mt-5 flex flex-wrap gap-10">
        <div style={{ flex: "1 1 340px" }} className="min-w-0">
          {w.id === "cutoff" && (
            <label className="block text-sm font-semibold mb-3">Quota to show
              <select value={opt} onChange={(e) => setOpt(e.target.value)} className="block w-full mt-1 px-3 py-2.5 rounded-xl border border-ink/20 dark:border-paper/25 bg-transparent">
                {CUTOFF_STATES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
          )}
          <pre className="p-4 rounded-2xl bg-ink text-paper text-xs leading-relaxed whitespace-pre-wrap break-all">{code}</pre>
          <button onClick={copy} className="mt-3 inline-flex items-center gap-2 bg-gold text-ink font-semibold px-5 py-3 rounded-full hover:bg-gold-dark">
            {copied ? <><Check size={18} /> Copied</> : <><Copy size={18} /> Copy code</>}
          </button>
        </div>
        <div style={{ flex: "0 1 460px" }} className="min-w-0 w-full">
          <p className="text-sm font-semibold text-ink/70 dark:text-paper/70">Live preview</p>
          <iframe key={opt} src={w.src(opt).replace("https://www.yneet.in", "")} title={`${w.title} preview`} className="mt-2 w-full rounded-2xl border border-ink/10" style={{ height: w.height, maxWidth: 460 }} loading="lazy" />
        </div>
      </div>
    </section>
  );
}

const QotdWidget = () => (
  <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
    <p className="text-gold-deep dark:text-gold font-semibold uppercase tracking-widest text-sm">Free for coaching centres, schools and blogs</p>
    <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">Free NEET widgets for your website</h1>
    <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg max-w-3xl">
      Give NEET students on your website something useful: a daily question, a college predictor or the latest government MBBS cutoffs. Copy one code, paste it once and it keeps itself up to date. No sign-up, no cost, no ads.
    </p>
    <nav className="mt-6 flex flex-wrap gap-2 text-sm">
      {WIDGETS.map((w) => <a key={w.id} href={`#${w.id}`} className="px-4 py-2 rounded-full border border-ink/15 dark:border-paper/20 hover:border-gold font-semibold">{w.title}</a>)}
    </nav>

    {WIDGETS.map((w) => <WidgetCard key={w.id} w={w} />)}

    <section className="mt-16">
      <h2 className="font-display text-2xl font-bold">How to add a widget to your website</h2>
      <ul className="mt-4 space-y-3 max-w-3xl">
        {STEPS.map(([k, v]) => (
          <li key={k} className="rounded-xl border border-ink/10 dark:border-paper/15 p-4">
            <b>{k}:</b> <span className="text-ink/75 dark:text-paper/75">{v}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-ink/70 dark:text-paper/70">
        Need help adding one? <a href={`https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent("Hi YNeet, I'd like help adding a free NEET widget to my website.")}`} target="_blank" rel="noopener noreferrer" className="underline font-semibold">Message us on WhatsApp</a>.
        Running a coaching centre? See <Link to="/institutes" className="underline font-semibold">YNeet for institutes</Link>.
      </p>
    </section>
  </div>
);

export default QotdWidget;
