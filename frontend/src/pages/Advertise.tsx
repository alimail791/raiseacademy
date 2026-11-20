import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Building2, CheckCircle2, GraduationCap, Home, MessageCircle, Megaphone, PlayCircle, Search, ShieldCheck } from "lucide-react";
import api from "../api/axios";
import { SITE } from "../utils/siteInfo";

// /advertise — PROTOTYPE (noindex, not linked from any menu yet).
// Ad packages for NEET-related businesses: coaching centres, book publishers,
// hostels/PGs, counselling services. Prices below are a first draft to review.
// Enquiries go to POST /api/contact (source: "advertise") + an admin email.

type Pack = { key: string; icon: typeof Megaphone; name: string; price: string; per: string; where: string; points: string[]; best?: boolean };

const PACKS: Pack[] = [
  {
    key: "city", icon: Search, name: "Featured in your city", price: "₹1,499", per: "/ month",
    where: "NEET coaching directory (yneet.in/neet-coaching/<your city>)",
    points: ["Top spot with a 'Featured' badge", "Your logo, courses, timings and WhatsApp button", "Students searching 'NEET coaching in <city>' see you first"],
  },
  {
    key: "tools", icon: GraduationCap, name: "Free-tool sponsor", price: "₹4,999", per: "/ month", best: true,
    where: "Rank Predictor, College Predictor, Compare Colleges, Score Calculator",
    points: ["'Sponsored by <you>' card on every result screen", "Reaches students the moment they see their rank", "Pick one state to target (shown only to that state's students)"],
  },
  {
    key: "qotd", icon: BookOpen, name: "Question of the Day sponsor", price: "₹2,999", per: "/ week",
    where: "Daily NEET question page, WhatsApp Channel and Chrome extension",
    points: ["'Today's question brought to you by <you>'", "7 days, every morning", "Link to your website or WhatsApp"],
  },
  {
    key: "shorts", icon: PlayCircle, name: "YouTube Shorts end card", price: "₹3,999", per: "/ week",
    where: "3 daily NEET quiz Shorts on YouTube + Instagram Reels",
    points: ["Your name and offer on the end card of 21 Shorts", "Link in every video description", "Great for crash courses and test series launches"],
  },
];

const WHO = [
  { icon: Building2, t: "Coaching centres", d: "NEET classroom and online batches, test series, crash courses." },
  { icon: BookOpen, t: "Book publishers", d: "NEET guides, PYQ books, NCERT companions, modules." },
  { icon: Home, t: "Hostels & PGs", d: "Student stays near coaching hubs (Kota, Chennai, Hyderabad…)." },
  { icon: GraduationCap, t: "Counselling services", d: "MBBS admission guidance, MBBS abroad, choice filling help." },
];

const RULES = [
  "Only NEET and education-related ads. No gaming, betting, loans, dating or anything unsuitable for school students.",
  "No 'guaranteed seat' or '100% selection' claims. We check every ad before it goes live.",
  "Ads are clearly marked 'Sponsored'. YNeet's free tools stay free and ad-light.",
  "Class 6–8 pages never show ads.",
];

const FAQS: [string, string][] = [
  ["Who sees the ads?", "NEET aspirants from Class 9 to droppers, and their parents, using YNeet's free tools, question pages and daily quizzes."],
  ["Can I target one state or city?", "Yes. The city listing is for your city, and the free-tool sponsorship can be shown only to students who pick your state."],
  ["How do I pay?", "Online by UPI or card, or by bank transfer. Your ad goes live within 1 working day after we check it."],
  ["Will I get a report?", "Yes. Every Monday on WhatsApp: how many times your ad was seen and clicked."],
];

export default function Advertise() {
  const [pack, setPack] = useState("tools");
  const [form, setForm] = useState({ name: "", business: "", city: "", phone: "", email: "", note: "" });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState("");
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    try {
      const p = PACKS.find((x) => x.key === pack);
      await api.post("/contact", {
        source: "advertise",
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: `[Advertise] ${p?.name} (${p?.price}${p?.per})\nBusiness: ${form.business}\nCity: ${form.city}\n${form.note}`,
      });
      setState("done");
      try { (window as any).gtag?.("event", "advertise_enquiry", { pack }); } catch { /* analytics only */ }
    } catch (e: any) {
      setState("error");
      setErr(e?.response?.data?.message || "Couldn't send. Please try WhatsApp instead.");
    }
  };

  const wa = `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent("Hi YNeet, I'd like to advertise on yneet.in. Please share details.")}`;

  return (
    <div>
      <section className="bg-ink text-paper">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <p className="text-gold font-semibold uppercase tracking-widest text-xs flex items-center gap-2"><Megaphone size={14} /> Advertise on YNeet</p>
          <h1 className="font-display text-3xl sm:text-5xl font-bold leading-tight mt-3">Reach NEET students at the moment they're deciding</h1>
          <p className="text-paper/80 mt-4 text-lg max-w-2xl">Students come to YNeet to check their rank, compare colleges and practise PYQs. Put your coaching centre, books or hostel in front of them, right there.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#enquire" className="bg-gold text-ink font-bold px-6 py-3 rounded-full hover:bg-gold-dark">See packages & enquire</a>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-paper/30 font-semibold px-6 py-3 rounded-full hover:border-gold"><MessageCircle size={18} /> Talk on WhatsApp</a>
          </div>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {[["70,000+", "NEET questions on the site"], ["3 a day", "NEET quiz Shorts & Reels"], ["16", "states' cutoff data"], ["Class 9+", "aspirants, droppers and parents"]].map(([a, b]) => (
              <div key={b} className="rounded-xl bg-paper/5 p-4"><p className="font-display text-2xl font-bold text-gold">{a}</p><p className="text-paper/70 mt-1">{b}</p></div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="font-display text-2xl sm:text-3xl font-bold">Who advertises with us</h2>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WHO.map((w) => (
            <div key={w.t} className="rounded-2xl border border-ink/10 dark:border-paper/15 p-5">
              <w.icon className="text-gold" size={26} />
              <p className="font-semibold mt-3">{w.t}</p>
              <p className="text-sm text-ink/70 dark:text-paper/70 mt-1">{w.d}</p>
            </div>
          ))}
        </div>

        <h2 id="packages" className="font-display text-2xl sm:text-3xl font-bold mt-14">Packages</h2>
        <p className="text-ink/70 dark:text-paper/70 mt-2">Simple monthly or weekly prices. No GST. Start small, renew if it works.</p>
        <div className="mt-6 grid sm:grid-cols-2 gap-5">
          {PACKS.map((p) => (
            <button key={p.key} type="button" onClick={() => { setPack(p.key); document.getElementById("enquire")?.scrollIntoView({ behavior: "smooth" }); }}
              className={`text-left rounded-2xl border-2 p-6 relative transition-colors ${pack === p.key ? "border-gold bg-gold/5" : "border-ink/10 dark:border-paper/15 hover:border-gold/60"}`}>
              {p.best && <span className="absolute -top-3 right-5 bg-gold text-ink text-xs font-bold px-3 py-1 rounded-full">Most popular</span>}
              <p.icon className="text-rise" size={26} />
              <p className="font-display text-xl font-bold mt-3">{p.name}</p>
              <p className="mt-1"><span className="font-display text-3xl font-bold">{p.price}</span> <span className="text-ink/60 dark:text-paper/60">{p.per}</span></p>
              <p className="text-xs text-ink/60 dark:text-paper/60 mt-2">{p.where}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {p.points.map((x) => <li key={x} className="flex gap-2"><CheckCircle2 size={16} className="text-rise mt-0.5 shrink-0" />{x}</li>)}
              </ul>
              <p className="mt-5 text-sm font-semibold text-rise-dark">{pack === p.key ? "✓ Selected" : "Choose this →"}</p>
            </button>
          ))}
        </div>

        <div className="mt-14 rounded-2xl bg-rise/5 border border-rise/20 p-6">
          <h2 className="font-display text-xl font-bold flex items-center gap-2"><ShieldCheck size={20} className="text-rise" /> Our ad rules</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {RULES.map((r) => <li key={r} className="flex gap-2"><span className="text-rise">•</span>{r}</li>)}
          </ul>
        </div>

        <section id="enquire" className="mt-14 scroll-mt-24">
          <h2 className="font-display text-2xl sm:text-3xl font-bold">Enquire</h2>
          <p className="text-ink/70 dark:text-paper/70 mt-2">Tell us about your business. We'll reply on WhatsApp within 1 working day with available dates.</p>
          {state === "done" ? (
            <div className="mt-6 rounded-2xl bg-rise/10 border border-rise/25 p-6">
              <p className="font-display text-xl font-bold">Thanks, {form.name.split(" ")[0] || "we got it"}!</p>
              <p className="mt-1 text-ink/70 dark:text-paper/70">We'll message you on WhatsApp soon. Want to talk now? <a href={wa} target="_blank" rel="noopener noreferrer" className="text-rise-dark font-semibold underline">Open WhatsApp</a></p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 grid sm:grid-cols-2 gap-4 rounded-2xl border border-ink/10 dark:border-paper/15 p-5">
              <label className="text-sm font-semibold sm:col-span-2">Package
                <select value={pack} onChange={(e) => setPack(e.target.value)} className="cp-in">
                  {PACKS.map((p) => <option key={p.key} value={p.key}>{p.name} — {p.price} {p.per}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Your name<input required value={form.name} onChange={set("name")} className="cp-in" /></label>
              <label className="text-sm font-semibold">Business name<input required value={form.business} onChange={set("business")} placeholder="e.g. ABC NEET Academy" className="cp-in" /></label>
              <label className="text-sm font-semibold">City<input required value={form.city} onChange={set("city")} className="cp-in" /></label>
              <label className="text-sm font-semibold">WhatsApp number<input required inputMode="tel" value={form.phone} onChange={set("phone")} className="cp-in" /></label>
              <label className="text-sm font-semibold sm:col-span-2">Email<input required type="email" value={form.email} onChange={set("email")} className="cp-in" /></label>
              <label className="text-sm font-semibold sm:col-span-2">Anything else? (optional)<textarea value={form.note} onChange={set("note")} rows={3} placeholder="What you want to promote, start date, budget…" className="cp-in" /></label>
              {state === "error" && <p className="sm:col-span-2 text-sm text-red-600">{err}</p>}
              <button type="submit" disabled={state === "sending"} className="sm:col-span-2 bg-gold text-ink font-bold px-6 py-3 rounded-full hover:bg-gold-dark disabled:opacity-50">{state === "sending" ? "Sending…" : "Send enquiry"}</button>
            </form>
          )}
        </section>

        <h2 className="font-display text-2xl font-bold mt-14">Questions</h2>
        <div className="mt-4 space-y-3">
          {FAQS.map(([q, a]) => (
            <details key={q} className="rounded-2xl border border-ink/10 dark:border-paper/15 p-4">
              <summary className="cursor-pointer font-semibold">{q}</summary>
              <p className="mt-2 text-ink/75 dark:text-paper/75">{a}</p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-sm text-ink/60 dark:text-paper/60">Running a coaching institute? You can also give your students YNeet logins: see <Link to="/institutes" className="underline">plans for institutes</Link>.</p>
      </div>
    </div>
  );
}
