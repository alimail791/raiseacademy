import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Copy, LogOut, MessageCircle, Share2 } from "lucide-react";
import partnerApi, { SP_TOKEN, inr } from "../../api/partnerApi";
import { SITE } from "../../utils/siteInfo";

type Data = {
  partner: { name: string; code: string; phone: string; email: string; city: string; upiId: string; status: string; link: string };
  terms: { firstRate: number; renewalRate: number; bonusAfter: number; bonusAmount: number; payWithinDays: number };
  stats: { earned: number; paid: number; pending: number; institutes: number; pilots: number; paying: number; bonusAwarded: boolean };
  institutes: { name: string; city: string; stage: string; seats: number; joined: string }[];
  commissions: { id: string; date: string; institute: string; kind: string; base: number; amount: number; status: string; dueBy?: string; paidAt?: string; payoutRef: string }[];
};

const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
const KIND: Record<string, string> = { first: "First payment", renewal: "Renewal", bonus: "Bonus" };
const STAGE_CLS: Record<string, string> = { Paying: "bg-rise/15 text-rise-dark", "Free pilot": "bg-gold/20 text-gold-deep", Expired: "bg-red-100 text-red-700", "Pilot ended": "bg-ink/5 text-ink/70", Paused: "bg-ink/5 text-ink/70" };

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const [d, setD] = useState<Data | null>(null);
  const [upi, setUpi] = useState("");
  const [pw, setPw] = useState({ currentPassword: "", password: "" });

  const load = () => partnerApi.get("/me").then((r) => { setD(r.data); setUpi(r.data.partner.upiId); }).catch((err) => {
    if (err?.response?.status === 401) { localStorage.removeItem(SP_TOKEN); navigate("/partner/login"); }
    else toast.error("Couldn't load your dashboard");
  });
  useEffect(() => {
    if (!localStorage.getItem(SP_TOKEN)) { navigate("/partner/login"); return; }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!d) return <div className="min-h-[60vh] flex items-center justify-center text-ink/60">Loading…</div>;
  const { partner: p, stats: s, terms: t } = d;

  const pitch = `Hello sir/madam, I'm ${p.name}. YNeet gives your NEET students 70,000+ practice questions, full mock tests and PYQs on their phone, and gives you a live panel with each student's weak chapters plus weekly parent reports. Start a FREE 14-day pilot for 5 students (no payment): ${p.link}`;
  // Easy first message: something free for the centre, then the pilot link.
  const freePitch = `Hello sir/madam, I'm ${p.name} from YNeet. A free gift for your NEET students: a daily NEET PYQ box for your website (6 previous-year questions a day with answers) (no sign-up needed) and free chapter-wise NEET PYQ PDFs. No payment: https://www.yneet.in/neet-question-widget#pyq\n\nIf you'd like, your students can also get a FREE 14-day mock test pilot: ${p.link}`;
  const copy = (text: string, msg: string) => { navigator.clipboard?.writeText(text).then(() => toast.success(msg)).catch(() => window.prompt("Copy:", text)); };
  const saveUpi = async () => {
    try { await partnerApi.put("/me", { upiId: upi }); toast.success("UPI ID saved"); load(); }
    catch (err: any) { toast.error(err?.response?.data?.message || "Could not save"); }
  };
  const changePw = async () => {
    try { await partnerApi.put("/me", pw); toast.success("Password changed"); setPw({ currentPassword: "", password: "" }); }
    catch (err: any) { toast.error(err?.response?.data?.message || "Could not change password"); }
  };
  const logout = () => { localStorage.removeItem(SP_TOKEN); navigate("/partner/login"); };
  const toBonus = Math.max(0, t.bonusAfter - s.paying);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink/60">YNeet Partner</p>
          <h1 className="font-display text-3xl font-bold">Hello, {p.name.split(" ")[0]}</h1>
          {p.status === "suspended" && <p className="mt-1 text-sm text-red-700">Your partner account is paused. Please WhatsApp YNeet.</p>}
        </div>
        <button onClick={logout} className="flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-ink/15 hover:bg-ink/5"><LogOut size={15} /> Logout</button>
      </div>

      {/* CODE + LINK */}
      <div className="mt-6 rounded-2xl bg-rise-line text-paper p-6 grid md:grid-cols-[auto_1fr] gap-6 items-center">
        <div>
          <p className="text-paper/70 text-sm">Your partner code</p>
          <p className="font-display text-4xl font-bold text-gold tracking-wide">{p.code}</p>
        </div>
        <div>
          <p className="text-paper/70 text-sm">Your link for coaching centres (pilot or purchase through it is tagged to you)</p>
          <p className="font-mono text-sm break-all mt-1">{p.link}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => copy(p.link, "Link copied")} className="flex items-center gap-1.5 bg-gold text-ink text-sm font-semibold px-4 py-2 rounded-full"><Copy size={15} /> Copy link</button>
            <a href={`https://wa.me/?text=${encodeURIComponent(pitch)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 border border-paper/30 text-sm font-semibold px-4 py-2 rounded-full hover:bg-paper/10"><Share2 size={15} /> Send on WhatsApp</a>
            <button onClick={() => copy(pitch, "Message copied")} className="flex items-center gap-1.5 border border-paper/30 text-sm font-semibold px-4 py-2 rounded-full hover:bg-paper/10"><MessageCircle size={15} /> Copy message</button>
            <a href={`https://wa.me/?text=${encodeURIComponent(freePitch)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 border border-gold/60 text-gold text-sm font-semibold px-4 py-2 rounded-full hover:bg-paper/10"><Share2 size={15} /> Send free PYQ gift (easy first message)</a>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          ["Institutes brought", String(s.institutes)],
          ["Paying institutes", String(s.paying)],
          ["Total earned", inr(s.earned)],
          ["Paid to you", inr(s.paid)],
          ["Pending payout", inr(s.pending)],
        ].map(([k, v]) => (
          <div key={k} className="p-4 rounded-2xl border border-ink/10 bg-white">
            <p className="text-xs text-ink/60">{k}</p>
            <p className="font-display text-2xl font-bold mt-1">{v}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink/70">
        {s.bonusAwarded ? `🎉 You've earned the ${inr(t.bonusAmount)} bonus.` : `${toBonus} more paying institute${toBonus === 1 ? "" : "s"} to your ${inr(t.bonusAmount)} bonus.`}{" "}
        You earn {Math.round(t.firstRate * 100)}% of each institute's first payment and {Math.round(t.renewalRate * 100)}% of every renewal, paid within {t.payWithinDays} days.
      </p>

      {/* INSTITUTES */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-bold">Your institutes</h2>
        {d.institutes.length === 0 ? (
          <p className="mt-2 text-sm text-ink/70">None yet. Share your link with a coaching centre and help them start the free pilot — it takes 2 minutes. If an institute pays offline, ask them to mention your code {p.code}.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
            <table className="w-full min-w-[520px] text-sm">
              <thead><tr className="bg-ink/[0.04] text-left"><th className="p-3">Institute</th><th className="p-3">City</th><th className="p-3">Stage</th><th className="p-3">Seats</th><th className="p-3">Joined</th></tr></thead>
              <tbody>
                {d.institutes.map((i, n) => (
                  <tr key={n} className="border-t border-ink/10">
                    <td className="p-3 font-medium">{i.name}</td><td className="p-3">{i.city || "—"}</td>
                    <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${STAGE_CLS[i.stage] || "bg-ink/5"}`}>{i.stage}</span></td>
                    <td className="p-3">{i.seats}</td><td className="p-3">{fmt(i.joined)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* COMMISSIONS */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-bold">Your commissions</h2>
        {d.commissions.length === 0 ? (
          <p className="mt-2 text-sm text-ink/70">Commissions appear here as soon as an institute you brought pays.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="bg-ink/[0.04] text-left"><th className="p-3">Date</th><th className="p-3">Institute</th><th className="p-3">Type</th><th className="p-3 text-right">They paid</th><th className="p-3 text-right">You earn</th><th className="p-3">Status</th></tr></thead>
              <tbody>
                {d.commissions.map((c) => (
                  <tr key={c.id} className="border-t border-ink/10">
                    <td className="p-3">{fmt(c.date)}</td><td className="p-3">{c.institute || "—"}</td><td className="p-3">{KIND[c.kind] || c.kind}</td>
                    <td className="p-3 text-right">{c.base ? inr(c.base) : "—"}</td><td className="p-3 text-right font-semibold">{inr(c.amount)}</td>
                    <td className="p-3 text-xs">
                      {c.status === "paid" ? <span className="text-rise-dark">Paid {fmt(c.paidAt)}{c.payoutRef ? ` · ${c.payoutRef}` : ""}</span>
                        : c.status === "cancelled" ? <span className="text-red-700">Cancelled</span>
                        : <span className="text-gold-deep">Pending · by {fmt(c.dueBy)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SETTINGS + TOOLKIT */}
      <section className="mt-8 grid md:grid-cols-2 gap-5">
        <div className="p-6 rounded-2xl border border-ink/10 bg-white">
          <h2 className="font-display text-lg font-bold">Payout details</h2>
          {!p.upiId && <p className="mt-1 text-sm text-red-700">Add your UPI ID so we can pay you.</p>}
          <label className="text-sm font-medium mt-3 block">UPI ID</label>
          <div className="flex gap-2 mt-1">
            <input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="name@upi" className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-gold outline-none" />
            <button onClick={saveUpi} className="bg-ink text-paper text-sm font-semibold px-4 py-2 rounded-full">Save</button>
          </div>
          <h3 className="font-semibold text-sm mt-5">Change password</h3>
          <div className="grid sm:grid-cols-2 gap-2 mt-1">
            <input type="password" placeholder="Current password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} className="rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-gold outline-none" />
            <input type="password" placeholder="New password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} className="rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-gold outline-none" />
          </div>
          <button onClick={changePw} disabled={!pw.password} className="mt-2 text-sm px-4 py-2 rounded-full border border-ink/15 disabled:opacity-50">Change password</button>
        </div>
        <div className="p-6 rounded-2xl border border-ink/10 bg-white">
          <h2 className="font-display text-lg font-bold">Your sales toolkit</h2>
          <ol className="mt-3 space-y-2 text-sm list-decimal pl-5">
            <li>Visit or call NEET coaching centres near you. Ask how their students practise MCQs at home and how they find weak chapters.</li>
            <li>Show them <Link to="/institutes" className="text-rise-dark underline">www.yneet.in/institutes</Link> on your phone, then open your link and help them start the <b>free 14-day pilot</b> (5 students, no payment).</li>
            <li>Tell us on WhatsApp — we give the demo and follow up during the pilot.</li>
            <li>When they buy a plan, your commission shows above.</li>
          </ol>
          <a href={`https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(`Hi YNeet, I'm partner ${p.code}. I have a coaching centre interested in a demo.`)}`} target="_blank" rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 bg-gold text-ink text-sm font-semibold px-4 py-2 rounded-full"><MessageCircle size={15} /> Book a demo for a centre</a>
        </div>
      </section>
    </div>
  );
}
