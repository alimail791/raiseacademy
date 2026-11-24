import { useEffect, useState } from "react";
import axios from "axios";
import { YNEET_API, SUBJECTS, SCHOOL_CLASSES } from "../practice/practiceData";
import { Link } from "react-router-dom";
import { Copy, Check, Send } from "lucide-react";
import api from "../api/axios";
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
    id: "countdown", title: "NEET Countdown", height: 400,
    blurb: "Days left to NEET with a target for this week that changes as the exam gets closer. Counts in India time and updates itself every day.",
    src: () => "https://www.yneet.in/embed/countdown",
    credit: () => `<a href="https://www.yneet.in/neet-2027-exam-date">NEET 2027 countdown</a> by <a href="https://www.yneet.in">YNeet</a>`,
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
  {
    id: "weightage", title: "NEET Chapter-wise Weightage", height: 600,
    blurb: "The 10 chapters that carry the most questions in a NEET paper, with Physics, Chemistry and Biology tabs. Students tap a chapter to practise its previous year questions free.",
    src: (subject) => `https://www.yneet.in/embed/weightage?subject=${subject}`,
    credit: (subject) => `<a href="https://www.yneet.in/neet-chapter-wise-weightage">NEET ${subject} chapter-wise weightage</a> by <a href="https://www.yneet.in">YNeet</a>`,
  },
];

// Adds ?by=<institute> so the box says "Shared by <institute>".
const withBy = (url: string, by: string) => (by.trim() ? `${url}${url.includes("?") ? "&" : "?"}by=${encodeURIComponent(by.trim())}` : url);

// WhatsApp message the owner forwards to whoever looks after the website.
function sendToWebPerson(id: string, title: string) {
  const text = `Please add this free NEET widget (${title}) to our website. It takes 2 minutes: copy the code from ${"https://www.yneet.in/neet-question-widget#" + id} and paste it into a Custom HTML / Embed block.`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  try { (window as any).gtag?.("event", "widget_send_whatsapp", { widget: id }); } catch { /* analytics only */ }
}

function SendButton({ id, title }: { id: string; title: string }) {
  return (
    <button onClick={() => sendToWebPerson(id, title)} className="mt-3 ml-2 inline-flex items-center gap-2 border border-ink/20 dark:border-paper/25 font-semibold px-5 py-3 rounded-full hover:border-gold">
      <Send size={18} /> Send to my website person
    </button>
  );
}

const codeFor = (w: Widget, opt: string, by: string) =>
  `<iframe src="${withBy(w.src(opt), by)}" title="${w.title}" width="100%" height="${w.height}" style="border:0;max-width:460px;width:100%" loading="lazy"></iframe>
<p style="font-size:13px;margin:4px 0 0">${w.credit(opt)}</p>`;

const STEPS = [
  ["WordPress", "Edit the page or sidebar, add a Custom HTML block, paste the code and update."],
  ["Wix", "Add → Embed code → Embed HTML, paste the code, then resize the box to about 460 wide."],
  ["Google Sites", "Insert → Embed → Embed code, paste the code and click Next, then Insert."],
  ["Blogger", "Layout → Add a Gadget → HTML/JavaScript, paste the code and save."],
  ["Any other site", "Paste the code into the page's HTML where you want the box to appear."],
];

function WidgetCard({ w, by }: { w: Widget; by: string }) {
  const [opt, setOpt] = useState(w.id === "cutoff" ? "tamil-nadu" : w.id === "weightage" ? "Biology" : "");
  const [copied, setCopied] = useState(false);
  const code = codeFor(w, opt, by);
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
          {w.id === "weightage" && (
            <label className="block text-sm font-semibold mb-3">Subject shown first
              <select value={opt} onChange={(e) => setOpt(e.target.value)} className="block w-full mt-1 px-3 py-2.5 rounded-xl border border-ink/20 dark:border-paper/25 bg-transparent">
                {["Biology", "Physics", "Chemistry"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
          )}
          <pre className="p-4 rounded-2xl bg-ink text-paper text-xs leading-relaxed whitespace-pre-wrap break-all">{code}</pre>
          <button onClick={copy} className="mt-3 inline-flex items-center gap-2 bg-gold text-ink font-semibold px-5 py-3 rounded-full hover:bg-gold-dark">
            {copied ? <><Check size={18} /> Copied</> : <><Copy size={18} /> Copy code</>}
          </button>
          <SendButton id={w.id} title={w.title} />
        </div>
        <div style={{ flex: "0 1 460px" }} className="min-w-0 w-full">
          <p className="text-sm font-semibold text-ink/70 dark:text-paper/70">Live preview</p>
          <iframe key={opt + by} src={withBy(w.src(opt), by).replace("https://www.yneet.in", "")} title={`${w.title} preview`} className="mt-2 w-full rounded-2xl border border-ink/10" style={{ height: w.height, maxWidth: 460 }} loading="lazy" />
        </div>
      </div>
    </section>
  );
}

// Chapter PYQ box: the institute picks NEET or a school class, then a chapter.
// The credit link points at that chapter's own page, so every site that adds
// the box links to a different, specific yneet.in page.
type PickChapter = { slug: string; subject: string; chapter: string; count: number };
const PYQ_HEIGHT = 640;

function PyqWidgetCard({ by }: { by: string }) {
  const [level, setLevel] = useState("neet"); // "neet" or "6".."10"
  const [chapters, setChapters] = useState<PickChapter[] | null>(null);
  const [slug, setSlug] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!YNEET_API) { setChapters([]); return; }
    let alive = true;
    setChapters(null);
    const req = level === "neet"
      ? axios.get(`${YNEET_API}/public/practice`).then((r) => (r.data.chapters || []).filter((c: any) => c.total >= 5).map((c: any) => ({ slug: c.slug, subject: c.subject, chapter: c.chapter, count: c.pyqCount || c.total })))
      : axios.get(`${YNEET_API}/public/school-questions?class=${level}`).then((r) => (r.data.class?.chapters || []).map((c: any) => ({ slug: c.slug, subject: c.subject, chapter: c.chapter, count: c.count })));
    req.then((list: PickChapter[]) => {
      if (!alive) return;
      const sorted = SUBJECTS.flatMap((s) => list.filter((c) => c.subject === s));
      // NEET: "mixed" (2 Physics + 2 Chemistry + 2 Biology a day) first, as the easy default.
      if (level === "neet" && sorted.length) sorted.unshift({ slug: "mixed", subject: "Mixed", chapter: "PYQs of the day, all subjects", count: 6 });
      setChapters(sorted);
      setSlug(sorted[0]?.slug || "");
    }).catch(() => alive && setChapters([]));
    return () => { alive = false; };
  }, [level]);

  const ch = chapters?.find((c) => c.slug === slug);
  const school = level !== "neet";
  const src = withBy(school ? `https://www.yneet.in/embed/pyq?class=${level}&chapter=${slug}` : `https://www.yneet.in/embed/pyq?chapter=${slug}`, by);
  const mixed = slug === "mixed";
  const page = school ? `https://www.yneet.in/class-${level}-questions#${slug}` : mixed ? "https://www.yneet.in/neet-practice" : `https://www.yneet.in/neet-practice/${slug}`;
  const anchor = ch ? (school ? `Class ${level} ${ch.chapter} MCQs` : mixed ? "NEET PYQs of the day" : `${ch.chapter} NEET PYQs`) : "";
  const code = ch
    ? `<iframe src="${src}" title="${anchor}" width="100%" height="${PYQ_HEIGHT}" style="border:0;max-width:460px;width:100%" loading="lazy"></iframe>
<p style="font-size:13px;margin:4px 0 0"><a href="${page}">${anchor}</a> by <a href="https://www.yneet.in">YNeet</a></p>`
    : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
      try { (window as any).gtag?.("event", "widget_code_copy", { widget: "pyq", chapter: slug, level }); } catch { /* analytics only */ }
    } catch { /* clipboard blocked */ }
  };
  const sel = "block w-full mt-1 px-3 py-2.5 rounded-xl border border-ink/20 dark:border-paper/25 bg-transparent";

  return (
    <section id="pyq" className="mt-14 scroll-mt-24">
      <h2 className="font-display text-2xl font-bold">Chapter-wise NEET PYQs</h2>
      <p className="text-ink/70 dark:text-paper/70 mt-2 max-w-3xl">
        Pick "All subjects mixed" for 6 NEET PYQs a day (2 Physics, 2 Chemistry, 2 Biology), or 5 previous year NEET questions from one chapter you pick, with answers and explanations. A new set every day, so students come back. Put a Biology chapter on your Biology page, a Physics chapter on your Physics page. Schools can pick a Class 6–10 Science chapter instead.
      </p>
      <div className="mt-5 flex flex-wrap gap-10">
        <div style={{ flex: "1 1 340px" }} className="min-w-0">
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <label className="block text-sm font-semibold">Level
              <select value={level} onChange={(e) => setLevel(e.target.value)} className={sel}>
                <option value="neet">NEET (Class 11–12, droppers)</option>
                {SCHOOL_CLASSES.map((n) => <option key={n} value={String(n)}>Class {n} Science</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold">Chapter
              <select value={slug} onChange={(e) => setSlug(e.target.value)} className={sel} disabled={!chapters?.length}>
                {chapters === null && <option>Loading chapters…</option>}
                {chapters?.[0]?.slug === "mixed" && <option value="mixed">All subjects mixed: 6 PYQs a day (easiest)</option>}
                {SUBJECTS.map((s) => {
                  const list = (chapters || []).filter((c) => c.subject === s);
                  return list.length ? (
                    <optgroup key={s} label={s}>
                      {list.map((c) => <option key={c.slug} value={c.slug}>{c.chapter} ({c.count})</option>)}
                    </optgroup>
                  ) : null;
                })}
              </select>
            </label>
          </div>
          {chapters && !chapters.length && <p className="text-sm text-ink/70 dark:text-paper/70 mb-3">Couldn't load the chapter list. Please refresh the page.</p>}
          {code && <pre className="p-4 rounded-2xl bg-ink text-paper text-xs leading-relaxed whitespace-pre-wrap break-all">{code}</pre>}
          <button onClick={copy} disabled={!code} className="mt-3 inline-flex items-center gap-2 bg-gold text-ink font-semibold px-5 py-3 rounded-full hover:bg-gold-dark disabled:opacity-50">
            {copied ? <><Check size={18} /> Copied</> : <><Copy size={18} /> Copy code</>}
          </button>
          <SendButton id="pyq" title="Chapter-wise NEET PYQs" />
        </div>
        <div style={{ flex: "0 1 460px" }} className="min-w-0 w-full">
          <p className="text-sm font-semibold text-ink/70 dark:text-paper/70">Live preview</p>
          {ch && <iframe key={src} src={src.replace("https://www.yneet.in", "")} title={`${anchor} preview`} className="mt-2 w-full rounded-2xl border border-ink/10" style={{ height: PYQ_HEIGHT, maxWidth: 460 }} loading="lazy" />}
        </div>
      </div>
    </section>
  );
}

const KINDS: [string, string][] = [["coaching", "Coaching centre"], ["school", "School"], ["teacher", "Tutor / teacher"], ["other", "Other"]];

// "No website?" — the institute gets www.yneet.in/i/<slug> with all the boxes
// carrying its name, to share on WhatsApp, Instagram and Google Business.
function OwnPageForm({ by }: { by: string }) {
  const [f, setF] = useState({ name: "", phone: "", city: "", kind: "coaching", cutoffState: "all-india-quota", website: "", listed: true });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [made, setMade] = useState<{ slug: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (by && !f.name) setF((x) => ({ ...x, name: by })); }, [by]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const r = await api.post("/widgets/partners", f);
      setMade(r.data);
      try { (window as any).gtag?.("event", "widget_partner_page", { kind: f.kind }); } catch { /* analytics only */ }
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Couldn't create the page. Please try again.");
    } finally { setBusy(false); }
  };
  const url = made ? `https://www.yneet.in/i/${made.slug}` : "";
  const share = `Free NEET tools for our students from ${made?.name}: daily NEET question, college predictor, cutoffs, chapter weightage and PYQs. ${url}`;
  const input = "block w-full mt-1 px-3 py-2.5 rounded-xl border border-ink/20 dark:border-paper/25 bg-transparent";

  if (made) return (
    <div className="mt-5 rounded-2xl border border-gold/50 bg-gold/10 p-5 max-w-2xl">
      <p className="font-bold text-lg">Your page is ready</p>
      <a href={url} target="_blank" rel="noopener" className="block mt-2 font-semibold underline break-all">{url}</a>
      <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">Put it in your WhatsApp status and groups, your Instagram bio and your Google Business profile.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={`https://wa.me/?text=${encodeURIComponent(share)}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 bg-gold text-ink font-semibold px-5 py-3 rounded-full hover:bg-gold-dark"><Send size={18} /> Share on WhatsApp</a>
        <button onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* blocked */ } }}
          className="inline-flex items-center gap-2 border border-ink/20 dark:border-paper/25 font-semibold px-5 py-3 rounded-full hover:border-gold">
          {copied ? <><Check size={18} /> Copied</> : <><Copy size={18} /> Copy link</>}
        </button>
      </div>
      <div className="mt-5 grid sm:grid-cols-2 gap-3 text-sm">
        <a href={`/i/${made.slug}/poster`} target="_blank" rel="noopener" className="rounded-xl border border-ink/15 dark:border-paper/20 p-3 hover:border-gold"><b>🖨️ Notice-board poster</b><br />A4 poster with a QR code to your page.</a>
        <a href={`/i/${made.slug}/status`} target="_blank" rel="noopener" className="rounded-xl border border-ink/15 dark:border-paper/20 p-3 hover:border-gold"><b>📱 Daily WhatsApp status</b><br />Today's NEET question as an image with your name. New every morning.</a>
      </div>
      {f.city && f.listed && <p className="mt-4 text-sm">You're also listed in <a href={`/neet-coaching/${f.city.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`} className="underline font-semibold">NEET coaching in {f.city}</a>.</p>}
    </div>
  );

  return (
    <form onSubmit={submit} className="mt-5 grid sm:grid-cols-2 gap-3 max-w-2xl">
      <label className="block text-sm font-semibold sm:col-span-2">Institute / school name
        <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={60} placeholder="e.g. Sri Vidya NEET Academy" className={input} />
      </label>
      <label className="block text-sm font-semibold">WhatsApp number
        <input inputMode="numeric" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/[^\d+ ]/g, "") })} maxLength={14} placeholder="10-digit number" className={input} />
      </label>
      <label className="block text-sm font-semibold">City / town
        <input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} maxLength={40} placeholder="e.g. Salem" className={input} />
      </label>
      <label className="block text-sm font-semibold">You are a
        <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} className={input}>
          {KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <label className="block text-sm font-semibold">Cutoffs to show
        <select value={f.cutoffState} onChange={(e) => setF({ ...f, cutoffState: e.target.value })} className={input}>
          {CUTOFF_STATES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <label className="block text-sm font-semibold sm:col-span-2">Website <span className="font-normal text-ink/60 dark:text-paper/60">(optional)</span>
        <input value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} maxLength={120} placeholder="e.g. www.srividya.in" className={input} />
      </label>
      <label className="flex gap-2 items-start text-sm sm:col-span-2">
        <input type="checkbox" checked={f.listed} onChange={(e) => setF({ ...f, listed: e.target.checked })} className="mt-1" />
        <span>List my institute free in YNeet's <a href="/neet-coaching" target="_blank" rel="noopener" className="underline">NEET coaching directory</a> for my city (with a link to my website)</span>
      </label>
      {err && <p className="text-sm text-red-600 sm:col-span-2">{err}</p>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={busy} className="bg-gold text-ink font-bold px-6 py-3 rounded-full hover:bg-gold-dark disabled:opacity-60">{busy ? "Creating…" : "Create my free page"}</button>
        <p className="mt-2 text-xs text-ink/60 dark:text-paper/60">We use your number only to send your page link and YNeet updates for institutes. Reply STOP any time.</p>
      </div>
    </form>
  );
}

const QotdWidget = () => {
  const [typed, setTyped] = useState("");
  const [by, setBy] = useState(""); // follows `typed` after a pause, so previews don't reload on every key
  useEffect(() => { const t = setTimeout(() => setBy(typed), 600); return () => clearTimeout(t); }, [typed]);
  return (
  <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
    <p className="text-gold-deep dark:text-gold font-semibold uppercase tracking-widest text-sm">Free for coaching centres, schools and blogs</p>
    <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">Free NEET widgets for your website</h1>
    <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg max-w-3xl">
      Give NEET students on your website something useful: a daily question, a college predictor, the latest government MBBS cutoffs, the chapter-wise weightage or daily PYQs from any chapter. Copy one code, paste it once and it keeps itself up to date. No sign-up, no cost, no ads.
    </p>
    <nav className="mt-6 flex flex-wrap gap-2 text-sm">
      {WIDGETS.map((w) => <a key={w.id} href={`#${w.id}`} className="px-4 py-2 rounded-full border border-ink/15 dark:border-paper/20 hover:border-gold font-semibold">{w.title}</a>)}
      <a href="#pyq" className="px-4 py-2 rounded-full border border-ink/15 dark:border-paper/20 hover:border-gold font-semibold">Chapter-wise NEET PYQs</a>
      <a href="#no-website" className="px-4 py-2 rounded-full border border-gold bg-gold/15 font-semibold">No website? Get a free page</a>
    </nav>

    <div className="mt-8 rounded-2xl border border-ink/10 dark:border-paper/15 p-5 max-w-2xl">
      <label className="block text-sm font-semibold">Your institute or school name <span className="font-normal text-ink/60 dark:text-paper/60">(optional)</span>
        <input value={typed} onChange={(e) => setTyped(e.target.value.slice(0, 60))} placeholder="e.g. Sri Vidya NEET Academy" className="block w-full mt-1 px-3 py-2.5 rounded-xl border border-ink/20 dark:border-paper/25 bg-transparent" />
      </label>
      <p className="mt-2 text-xs text-ink/60 dark:text-paper/60">Every box below will say "Shared by {typed.trim() || "your institute"}" so students see it as your free tool.</p>
    </div>

    {WIDGETS.map((w) => <WidgetCard key={w.id} w={w} by={by} />)}
    <PyqWidgetCard by={by} />

    <section id="no-website" className="mt-16 scroll-mt-24">
      <h2 className="font-display text-2xl font-bold">No website? Get a free NEET tools page</h2>
      <p className="text-ink/70 dark:text-paper/70 mt-2 max-w-3xl">
        We'll make a page with all these tools under your institute's name, like www.yneet.in/i/your-institute, plus a notice-board poster, a daily WhatsApp status image and a free listing in our NEET coaching directory. Already added a widget to your website? Fill this in too to get listed. Free, no ads.
      </p>
      <OwnPageForm by={by} />
    </section>

    <section className="mt-16">
      <h2 className="font-display text-2xl font-bold">How to add a widget to your website</h2>
      <ul className="mt-4 space-y-3 max-w-3xl">
        {STEPS.map(([k, v]) => (
          <li key={k} className="rounded-xl border border-ink/10 dark:border-paper/15 p-4">
            <b>{k}:</b> <span className="text-ink/75 dark:text-paper/75">{v}</span>
          </li>
        ))}
        <li className="rounded-xl border border-ink/10 dark:border-paper/15 p-4">
          <b>WordPress plugin:</b> <span className="text-ink/75 dark:text-paper/75">or install the free <a href="https://wordpress.org/plugins/raise-academy-medical-exam-widgets/" target="_blank" rel="noopener" className="underline font-semibold">Raise Academy Medical Exam Widgets</a> plugin from WordPress.org (Plugins → Add New → search "Raise Academy Medical Exam Widgets"), then put a shortcode like <code>[memcw_widget type="predictor"]</code> on any page.</span>
        </li>
      </ul>
      <p className="mt-6 text-sm text-ink/70 dark:text-paper/70">
        Need help adding one? <a href={`https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent("Hi YNeet, I'd like help adding a free NEET widget to my website.")}`} target="_blank" rel="noopener noreferrer" className="underline font-semibold">Message us on WhatsApp</a>.
        Running a coaching centre? See <Link to="/institutes" className="underline font-semibold">YNeet for institutes</Link>.
      </p>
    </section>
  </div>
  );
};

export default QotdWidget;
