import { useState, useEffect, FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { BarChart3, ClipboardCheck, FileClock, Users, MessageCircle, BookOpenCheck, X, Check, ShieldCheck, Gift } from "lucide-react";
import api from "../api/axios";
import { INST_TOKEN } from "../api/instituteApi";
import { payWithRazorpay, trackPurchase } from "../utils/razorpay";
import { SITE } from "../utils/siteInfo";

// Keep in sync with backend controllers/instituteController.js
const MONTHLY = [
  { seats: 20, price: 3999 },
  { seats: 50, price: 8999 },
  { seats: 100, price: 14999 },
];
const YEARLY = [
  { seats: 20, price: 31999 },
  { seats: 50, price: 69999 },
  { seats: 100, price: 119999 },
];
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const benefits = [
  { icon: ClipboardCheck, title: "Full NEET mocks & chapter tests", desc: "720-mark mock tests plus chapter-wise tests for Physics, Chemistry, Botany and Zoology — matched to 11th, 12th and Dropper." },
  { icon: FileClock, title: "PYQs 2016–2026", desc: "Every NEET paper year by year, with answers and explanations." },
  { icon: BarChart3, title: "Instant analysis", desc: "Score, estimated rank and weakest chapters after every test." },
  { icon: BookOpenCheck, title: "Practice & mistake notebook", desc: "Practice targeted at each student's weak chapters; every wrong answer saved to revise." },
  { icon: Users, title: "Your institute panel", desc: "See every student's progress live, nudge inactive students on WhatsApp, download Excel reports." },
  { icon: MessageCircle, title: "Weekly parent reports", desc: "Parents get a progress report every week — they see the value of your coaching." },
];

const input = "mt-1 w-full rounded-lg border border-ink/15 px-3 py-2.5 text-sm focus:border-gold outline-none bg-white";
const emptyForm = { name: "", contactName: "", email: "", phone: "", city: "", board: "CBSE", password: "" };

const Institutes = () => {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<{ seats: number; price: number } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [months, setMonths] = useState(1);
  // Referral: /institutes?ref=CODE — remembered for this visit so it survives navigation.
  const [params] = useSearchParams();
  const [ref, setRef] = useState("");
  const [refName, setRefName] = useState("");
  useEffect(() => {
    let code = (params.get("ref") || "").trim().toUpperCase();
    try { if (code) sessionStorage.setItem("yneet_inst_ref", code); else code = sessionStorage.getItem("yneet_inst_ref") || ""; } catch { /* ignore */ }
    if (!code) return;
    api.get("/institute/referral/check", { params: { code } }).then((r) => { if (r.data.valid) { setRef(code); setRefName(r.data.name); } }).catch(() => {});
  }, [params]);

  const waLink = (msg: string) => `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(msg)}`;

  const buy = async (e: FormEvent) => {
    e.preventDefault();
    if (!plan) return;
    setBusy(true);
    try {
      const { data } = await api.post("/institute/signup/order", { ...form, seats: plan.seats, months, ref });
      const paid = await payWithRazorpay({ keyId: data.keyId, orderId: data.orderId, amount: data.amount, description: `Institute plan · ${plan.seats} students · ${months} month${months > 1 ? "s" : ""}`, prefill: data.prefill });
      const { data: done } = await api.post("/institute/signup/verify", paid);
      localStorage.setItem(INST_TOKEN, done.token);
      trackPurchase(plan.price * months, `Institute ${plan.seats} × ${months}m`);
      toast.success("Payment received! Your institute panel is ready.");
      navigate("/institute");
    } catch (err: any) {
      if (err?.message === "cancelled") toast("Payment cancelled.");
      else toast.error(err?.response?.data?.message || err?.message || "Something went wrong");
    } finally { setBusy(false); }
  };

  return (
    <div>
      {refName && (
        <div className="bg-gold-light/60 border-b border-gold/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 text-sm flex items-center gap-2"><Gift size={16} className="text-gold-dark" /> You were invited by <b>{refName}</b>. Pick a plan below to get started.</div>
        </div>
      )}

      {/* HERO */}
      <section className="bg-rise-line text-paper">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <p className="text-gold font-semibold uppercase tracking-widest text-sm">For NEET coaching centres</p>
          <h1 className="font-display text-3xl sm:text-5xl font-bold mt-3 max-w-3xl leading-tight">Daily NEET practice for your students. Live progress for you.</h1>
          <p className="mt-5 text-paper/80 max-w-2xl text-lg">Give every student YNeet's mock tests, PYQs and analysis on their phone — and see who is practising, their scores and weak chapters from your own panel.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#plans" className="bg-gold text-ink font-semibold px-6 py-3 rounded-full hover:bg-gold-dark">See plans</a>
            <a href={waLink("Hi YNeet, I'd like a demo for my NEET coaching centre.")} target="_blank" rel="noopener noreferrer" className="border border-paper/30 font-semibold px-6 py-3 rounded-full hover:bg-paper/10">Ask for a free demo</a>
          </div>
        </div>
      </section>


      {/* BENEFITS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-display text-2xl sm:text-3xl font-bold">What your centre gets</h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b) => (
            <div key={b.title} className="p-6 rounded-2xl border border-ink/10 bg-white">
              <b.icon className="text-rise" size={26} />
              <h3 className="font-display font-semibold text-lg mt-3">{b.title}</h3>
              <p className="text-ink/60 text-sm mt-1.5">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MONTHLY PLANS */}
      <section id="plans" className="bg-ink/[0.03] py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-bold">Monthly plans — start today</h2>
          <p className="text-ink/60 mt-2">Pay online for 1 to 12 months at a time — your panel is ready instantly. Renew from your panel anytime. No GST.</p>
          <div className="mt-8 grid md:grid-cols-3 gap-5">
            {MONTHLY.map((p, i) => (
              <div key={p.seats} className={`relative p-6 rounded-2xl border bg-white flex flex-col ${i === 1 ? "border-gold shadow-lg" : "border-ink/10"}`}>
                {i === 1 && <span className="absolute -top-3 right-5 bg-gold text-ink text-xs font-bold px-3 py-1 rounded-full">POPULAR</span>}
                <p className="font-semibold text-ink/60">{p.seats} students</p>
                <p className="font-display text-4xl font-bold mt-2">{inr(p.price)}<span className="text-base font-medium text-ink/50"> / month</span></p>
                <p className="text-sm text-rise-dark font-medium mt-1">≈ {inr(Math.round(p.price / p.seats))} per student</p>
                <ul className="mt-5 space-y-2 text-sm text-ink/70 flex-1">
                  {["Every YNeet feature for each student", "Institute panel with live progress", "Weekly parent reports", "Swap students anytime"].map((t) => (
                    <li key={t} className="flex gap-2"><Check size={16} className="text-rise shrink-0 mt-0.5" />{t}</li>
                  ))}
                </ul>
                <button onClick={() => { setPlan(p); setForm(emptyForm); setMonths(1); }} className="mt-6 w-full bg-ink text-paper font-semibold py-3 rounded-full hover:bg-ink-light">Buy now · {inr(p.price)}</button>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-ink/50 flex items-center gap-1.5"><ShieldCheck size={15} /> Secure payment by UPI, card or net banking via Razorpay. Already a YNeet institute? <Link to="/institute/login" className="text-rise-dark underline">Log in</Link> to renew.</p>
        </div>
      </section>

      {/* YEARLY */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-display text-2xl sm:text-3xl font-bold">Yearly packs — best value</h2>
        <p className="text-ink/60 mt-2">One year for your whole batch. Payment by bank transfer, UPI or cheque — talk to us on WhatsApp.</p>
        <div className="mt-8 grid md:grid-cols-3 gap-5">
          {YEARLY.map((p) => (
            <div key={p.seats} className="p-6 rounded-2xl border border-ink/10 bg-white">
              <p className="font-semibold text-ink/60">{p.seats} students · 1 year</p>
              <p className="font-display text-3xl font-bold mt-2">{inr(p.price)}</p>
              <p className="text-sm text-rise-dark font-medium mt-1">≈ {inr(Math.round(p.price / p.seats / 12))} per student per month</p>
              <a href={waLink(`Hi YNeet, I'm interested in the yearly pack for ${p.seats} students.`)} target="_blank" rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 border border-ink/20 font-semibold px-5 py-2.5 rounded-full hover:border-gold"><MessageCircle size={16} /> Enquire on WhatsApp</a>
            </div>
          ))}
        </div>
      </section>

      {/* SIGN-UP + PAY */}
      {plan && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4" onClick={() => !busy && setPlan(null)}>
          <form onSubmit={buy} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[92vh] overflow-y-auto space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-xl font-bold">{plan.seats} students · {inr(plan.price)} / month</h3>
                <p className="text-sm text-ink/60">Create your institute account, then pay securely.</p>
              </div>
              <button type="button" disabled={busy} onClick={() => setPlan(null)} className="p-1 rounded hover:bg-ink/5"><X size={20} /></button>
            </div>
            <div><label className="text-xs font-medium">Institute name *</label><input required className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="text-xs font-medium">Contact person</label><input className={input} value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
              <div><label className="text-xs font-medium">Phone / WhatsApp *</label><input required type="tel" className={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><label className="text-xs font-medium">Login email *</label><input required type="email" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className="text-xs font-medium">City</label><input className={input} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div><label className="text-xs font-medium">Students' board</label>
                <select className={input} value={form.board} onChange={(e) => setForm({ ...form, board: e.target.value })}><option>CBSE</option><option>Tamil Nadu State Board</option></select></div>
              <div><label className="text-xs font-medium">Create a password *</label><input required minLength={6} type="password" className={input} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            </div>
            <div className="rounded-xl bg-ink/[0.04] p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">How many months?</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setMonths((m) => Math.max(1, m - 1))} className="w-8 h-8 rounded-full border border-ink/20 font-bold">−</button>
                  <span className="w-20 text-center font-semibold whitespace-nowrap">{months} month{months > 1 ? "s" : ""}</span>
                  <button type="button" onClick={() => setMonths((m) => Math.min(12, m + 1))} className="w-8 h-8 rounded-full border border-ink/20 font-bold">+</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">{[1, 3, 6, 12].map((m) => <button type="button" key={m} onClick={() => setMonths(m)} className={`text-xs px-2.5 py-1 rounded-full border ${months === m ? "bg-ink text-paper border-ink" : "border-ink/15"}`}>{m === 12 ? "12 months" : `${m} month${m > 1 ? "s" : ""}`}</button>)}</div>
              <p className="text-xs text-ink/60 mt-2">{inr(plan.price)} × {months} = <b className="text-ink">{inr(plan.price * months)}</b></p>
            </div>
            <button disabled={busy} className="w-full bg-gold text-ink font-semibold py-3 rounded-full hover:bg-gold-dark disabled:opacity-60">{busy ? "Please wait…" : `Pay ${inr(plan.price * months)} & start`}</button>
            <p className="text-xs text-ink/50 text-center">{months}-month plan from today. Renew anytime from your panel — early renewals add on after your current end date.</p>
          </form>
        </div>
      )}
    </div>
  );
};

export default Institutes;
