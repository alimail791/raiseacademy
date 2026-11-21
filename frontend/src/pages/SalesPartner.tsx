import { useEffect, useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { BadgeIndianRupee, Briefcase, Check, GraduationCap, Handshake, MessageCircle, School, Sparkles, UserRound, Users } from "lucide-react";
import partnerApi, { SP_TOKEN, DEFAULT_TERMS, PartnerTerms, inr } from "../api/partnerApi";
import { SITE } from "../utils/siteInfo";

// /partner — recruit commission-only sales partners who bring coaching
// institutes to YNeet. Terms and prices come from GET /api/sales-partners/terms.

const WHO = [
  { icon: GraduationCap, t: "College students", d: "B.Ed, MBA, science students who want good part-time income." },
  { icon: UserRound, t: "Retired teachers", d: "You already know coaching centre owners, and they trust you." },
  { icon: School, t: "Tuition & coaching teachers", d: "Recommend YNeet to the centres you work with or know." },
  { icon: Briefcase, t: "Education sellers", d: "Book sellers, stationery suppliers, consultants who visit centres." },
];

const FAQS: [string, string][] = [
  ["Is there a joining fee?", "No. Joining is free, and there are no targets."],
  ["Do I need to know the product well?", "No. You introduce the institute; the YNeet team gives the demo and sets everything up."],
  ["How is my sale tracked?", "Share your link (www.yneet.in/institutes?sp=YOURCODE). Institutes that start a pilot or buy through it are tagged to you. If an institute pays offline, just tell us your code and we add it."],
  ["When do I get paid?", "Commission is paid to your UPI within 7 days after the institute's payment reaches YNeet."],
  ["What if the institute starts with the free pilot?", "Great — that's the easiest first step. When they buy a plan after the pilot, you earn your commission."],
  ["Can I see my institutes and earnings?", "Yes. Your partner dashboard shows every institute you brought, their stage, and every commission (pending and paid)."],
];

const input = "mt-1 w-full rounded-lg border border-ink/15 px-3 py-2.5 text-sm focus:border-gold outline-none bg-white";
const empty = { name: "", phone: "", email: "", city: "", occupation: "College student", contacts: "1–5", upiId: "", password: "" };

export default function SalesPartner() {
  const navigate = useNavigate();
  const [t, setT] = useState<PartnerTerms>(DEFAULT_TERMS);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  useEffect(() => { partnerApi.get("/terms").then((r) => setT(r.data)).catch(() => {}); }, []);

  const first = Math.round(t.firstRate * 100);
  const renew = Math.round(t.renewalRate * 100);
  const topYearly = t.yearly[t.yearly.length - 1];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await partnerApi.post("/signup", form);
      localStorage.setItem(SP_TOKEN, data.token);
      try { (window as any).gtag?.("event", "generate_lead", { lead_type: "sales_partner" }); } catch { /* analytics only */ }
      toast.success(`Welcome! Your partner code is ${data.partner.code}`);
      navigate("/partner/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Something went wrong");
    } finally { setBusy(false); }
  };

  return (
    <div>
      {/* HERO */}
      <section className="bg-rise-line text-paper">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <p className="text-gold font-semibold uppercase tracking-widest text-sm">YNeet Partner Program</p>
          <h1 className="font-display text-3xl sm:text-5xl font-bold mt-3 max-w-3xl leading-tight">Earn up to {inr(topYearly.price * t.firstRate)} for every coaching institute you bring</h1>
          <p className="mt-5 text-paper/80 max-w-2xl text-lg">Introduce NEET coaching centres to YNeet. We do the demo, setup and support. You earn {first}% of their first payment, {renew}% of every renewal, and a {inr(t.bonusAmount)} bonus on your {t.bonusAfter}rd institute. No fee, no targets, no salary — just commission.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#join" className="bg-gold text-ink font-semibold px-6 py-3 rounded-full hover:bg-gold-dark">Become a partner — free</a>
            <Link to="/partner/login" className="border border-paper/30 font-semibold px-6 py-3 rounded-full hover:bg-paper/10">Partner login</Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-display text-2xl sm:text-3xl font-bold">How it works</h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Sparkles, t: "1. Join free", d: "Sign up below and get your partner code and link in a minute." },
            { icon: Handshake, t: "2. Introduce YNeet", d: "Visit or call NEET coaching centres. Offer them the free 14-day pilot for 5 students." },
            { icon: Users, t: "3. We do the rest", d: "The YNeet team gives the demo, sets up the institute panel and supports them." },
            { icon: BadgeIndianRupee, t: "4. Get paid", d: `When the institute pays, your commission reaches your UPI within ${t.payWithinDays} days.` },
          ].map((s) => (
            <div key={s.t} className="p-6 rounded-2xl border border-ink/10 bg-white">
              <s.icon className="text-rise" size={26} />
              <h3 className="font-display font-semibold text-lg mt-3">{s.t}</h3>
              <p className="text-ink/70 text-sm mt-1.5">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* EARNINGS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <h2 className="font-display text-2xl sm:text-3xl font-bold">What you earn</h2>
        <p className="text-ink/70 mt-2 max-w-3xl">{first}% of the institute's first payment. Then {renew}% every time they renew or buy more — as long as they stay with YNeet.</p>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="bg-ink/[0.04]">
                <th className="text-left p-3">Institute buys</th>
                <th className="text-right p-3">Price</th>
                <th className="text-right p-3 bg-gold/25">You earn ({first}%)</th>
                <th className="text-right p-3">Each renewal ({renew}%)</th>
              </tr>
            </thead>
            <tbody>
              {t.yearly.map((p) => (
                <tr key={`y${p.seats}`} className="border-t border-ink/10">
                  <td className="p-3 font-medium">{p.seats}-student yearly pack</td>
                  <td className="p-3 text-right">{inr(p.price)}</td>
                  <td className="p-3 text-right font-semibold bg-gold/10">{inr(p.price * t.firstRate)}</td>
                  <td className="p-3 text-right">{inr(p.price * t.renewalRate)}</td>
                </tr>
              ))}
              {t.monthly.map((p) => (
                <tr key={`m${p.seats}`} className="border-t border-ink/10">
                  <td className="p-3 font-medium">{p.seats}-student monthly plan</td>
                  <td className="p-3 text-right">{inr(p.price)}/month</td>
                  <td className="p-3 text-right font-semibold bg-gold/10">{inr(p.price * t.firstRate)}</td>
                  <td className="p-3 text-right">{inr(p.price * t.renewalRate)}/month</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 rounded-2xl bg-rise text-white p-6 grid sm:grid-cols-3 gap-6 items-center">
          <div className="sm:col-span-2">
            <h3 className="font-display text-xl font-bold">+ {inr(t.bonusAmount)} bonus on your {t.bonusAfter}rd paying institute</h3>
            <p className="text-white/85 mt-1.5 text-sm">Example: three centres each buy the {t.yearly[0].seats}-student yearly pack → {inr(t.yearly[0].price * t.firstRate * 3 + t.bonusAmount)} for you, plus {inr(t.yearly[0].price * t.renewalRate * 3)} more when they renew next year.</p>
          </div>
          <ul className="space-y-1.5 text-sm">
            {["No joining fee", "No targets", `Paid within ${t.payWithinDays} days`, "Track everything in your dashboard"].map((x) => (
              <li key={x} className="flex gap-2"><Check size={16} className="shrink-0 mt-0.5" />{x}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* WHO */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="font-display text-2xl sm:text-3xl font-bold">Who can join</h2>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {WHO.map((w) => (
            <div key={w.t} className="p-5 rounded-2xl border border-ink/10 bg-white">
              <w.icon className="text-gold-deep dark:text-gold" size={24} />
              <h3 className="font-semibold mt-2">{w.t}</h3>
              <p className="text-ink/70 text-sm mt-1">{w.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 grid md:grid-cols-2 gap-5">
          <div className="p-6 rounded-2xl border border-ink/10 bg-white">
            <h3 className="font-display font-semibold text-lg">What you get from us</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {["Your own partner code and link", "A one-page offer to show institute owners", "Ready WhatsApp messages to send centres", "Demo, setup and support by the YNeet team", "A dashboard with your institutes and earnings"].map((x) => (
                <li key={x} className="flex gap-2"><Check size={16} className="text-rise shrink-0 mt-0.5" />{x}</li>
              ))}
            </ul>
          </div>
          <div className="p-6 rounded-2xl border border-ink/10 bg-white">
            <h3 className="font-display font-semibold text-lg">Simple rules</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                "Commission is paid only after the institute's payment reaches YNeet.",
                "One institute counts for the partner whose code it used first.",
                "Be honest with centres: no fake promises or 'guaranteed results' claims.",
                "Self-referral or fake institutes cancel the commission.",
              ].map((x) => (
                <li key={x} className="flex gap-2"><Check size={16} className="text-rise shrink-0 mt-0.5" />{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* JOIN */}
      <section id="join" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 scroll-mt-20">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 items-start">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">Become a YNeet Partner</h2>
            <p className="text-ink/70 mt-2">Free to join. You'll get your partner code and dashboard right away.</p>
            <div className="mt-6 space-y-4">
              {FAQS.map(([q, a]) => (
                <div key={q}>
                  <h3 className="font-semibold text-sm">{q}</h3>
                  <p className="text-ink/70 text-sm mt-0.5">{a}</p>
                </div>
              ))}
            </div>
            <a href={`https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent("Hi YNeet, I have a question about the YNeet Partner Program.")}`} target="_blank" rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-rise-dark hover:underline"><MessageCircle size={16} /> Questions? WhatsApp us</a>
          </div>
          <form onSubmit={submit} className="bg-white p-6 rounded-2xl border border-ink/10 grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><label className="text-sm font-medium">Full name *</label><input required className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="text-sm font-medium">WhatsApp number *</label><input required inputMode="numeric" className={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile" /></div>
            <div><label className="text-sm font-medium">Email *</label><input required type="email" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="text-sm font-medium">City *</label><input required className={input} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><label className="text-sm font-medium">You are a</label>
              <select className={input} value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })}>
                {["College student", "Teacher / tutor", "Retired teacher", "Coaching faculty", "Education consultant", "Book / stationery seller", "Other"].map((o) => <option key={o}>{o}</option>)}
              </select></div>
            <div><label className="text-sm font-medium">Coaching centres you know</label>
              <select className={input} value={form.contacts} onChange={(e) => setForm({ ...form, contacts: e.target.value })}>
                {["None yet", "1–5", "6–20", "20+"].map((o) => <option key={o}>{o}</option>)}
              </select></div>
            <div><label className="text-sm font-medium">UPI ID (for payouts)</label><input className={input} value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} placeholder="name@upi (can add later)" /></div>
            <div className="sm:col-span-2"><label className="text-sm font-medium">Create a password *</label><input required type="password" minLength={6} className={input} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" /></div>
            <button disabled={busy} className="sm:col-span-2 bg-gold text-ink font-semibold py-3 rounded-full hover:bg-gold-dark disabled:opacity-60">{busy ? "Creating your account..." : "Join as a partner"}</button>
            <p className="sm:col-span-2 text-xs text-ink/60 text-center">Already a partner? <Link to="/partner/login" className="text-rise-dark underline">Log in</Link></p>
          </form>
        </div>
      </section>
    </div>
  );
}
