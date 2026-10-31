import { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Check } from "lucide-react";
import { SITE } from "../utils/siteInfo";

// Page for coaching centres, schools and bloggers: preview of the daily NEET
// question box, and the code to paste into their own website.

const CODE = `<iframe src="https://www.yneet.in/embed/qotd" title="NEET Question of the Day" width="100%" height="560" style="border:0;max-width:460px;width:100%" loading="lazy"></iframe>
<p style="font-size:13px;margin:4px 0 0">Daily <a href="https://www.yneet.in/neet-question-of-the-day">NEET Question of the Day</a> by <a href="https://www.yneet.in">YNeet</a></p>`;

const STEPS = [
  ["WordPress", "Edit the page or sidebar, add a Custom HTML block, paste the code and update."],
  ["Wix", "Add → Embed code → Embed HTML, paste the code, then resize the box to about 460 × 560."],
  ["Google Sites", "Insert → Embed → Embed code, paste the code and click Next, then Insert."],
  ["Blogger", "Layout → Add a Gadget → HTML/JavaScript, paste the code and save."],
  ["Any other site", "Paste the code into the page's HTML where you want the box to appear."],
];

const QotdWidget = () => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CODE);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
      try { (window as any).gtag?.("event", "widget_code_copy"); } catch { /* analytics only */ }
    } catch { /* clipboard blocked */ }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm">Free for coaching centres, schools and blogs</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">Add a daily NEET question to your website</h1>
      <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg max-w-3xl">
        A free box that shows a new NEET question every day, mostly from previous NEET papers. Students tap an answer and see the explanation. Paste the code once and it updates itself. No sign-up, no cost.
      </p>

      <div className="mt-10 flex flex-wrap gap-10">
        <div style={{ flex: "1 1 340px" }} className="min-w-0">
          <h2 className="font-display text-xl font-bold">1. Copy this code</h2>
          <pre className="mt-3 p-4 rounded-2xl bg-ink text-paper text-xs leading-relaxed whitespace-pre-wrap break-all">{CODE}</pre>
          <button onClick={copy} className="mt-3 inline-flex items-center gap-2 bg-gold text-ink font-semibold px-5 py-3 rounded-full hover:bg-gold-dark">
            {copied ? <><Check size={18} /> Copied</> : <><Copy size={18} /> Copy code</>}
          </button>

          <h2 className="font-display text-xl font-bold mt-10">2. Paste it into your website</h2>
          <ul className="mt-3 space-y-3">
            {STEPS.map(([k, v]) => (
              <li key={k} className="rounded-xl border border-ink/10 dark:border-paper/15 p-4">
                <b>{k}:</b> <span className="text-ink/75 dark:text-paper/75">{v}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-ink/60 dark:text-paper/60">
            Need help adding it? <a href={`https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent("Hi YNeet, I'd like help adding the NEET Question of the Day box to my website.")}`} target="_blank" rel="noopener noreferrer" className="underline font-semibold">Message us on WhatsApp</a>.
            Running a coaching centre? See <Link to="/institutes" className="underline font-semibold">YNeet for institutes</Link>.
          </p>
        </div>

        <div style={{ flex: "0 1 460px" }} className="min-w-0 w-full">
          <h2 className="font-display text-xl font-bold">Live preview</h2>
          <iframe src="/embed/qotd" title="NEET Question of the Day preview" className="mt-3 w-full rounded-2xl border border-ink/10" style={{ height: 560, maxWidth: 460 }} loading="lazy" />
        </div>
      </div>
    </div>
  );
};

export default QotdWidget;
