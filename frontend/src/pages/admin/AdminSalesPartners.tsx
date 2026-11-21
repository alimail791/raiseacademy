import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { KeyRound, Pause, Play, Copy } from "lucide-react";
import api from "../../api/axios";

// Admin → Sales partners: commission-only partners who bring institutes
// (www.yneet.in/partner), and the commissions to pay them.

type Partner = {
  id: string; name: string; phone: string; email: string; city: string; occupation: string; contacts: string; notes: string;
  code: string; upiId: string; status: string; createdAt: string; institutes: number; earned: number; paid: number; pending: number;
};
type Line = {
  id: string; date: string; partner: { id: string; name: string; code: string; phone: string; upiId: string } | null;
  institute: string; kind: string; base: number; amount: number; status: string; dueBy?: string; paidAt?: string; payoutRef: string; note: string;
};

const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
const KIND: Record<string, string> = { first: "First 20%", renewal: "Renewal 10%", bonus: "Bonus" };

export default function AdminSalesPartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [filter, setFilter] = useState<"pending" | "paid" | "all">("pending");
  const [loading, setLoading] = useState(true);

  const load = () => api.get("/sales-partners/admin").then((r) => { setPartners(r.data.partners); setLines(r.data.commissions); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const act = async (l: Line, action: "pay" | "cancel" | "reopen") => {
    let payoutRef = "";
    if (action === "pay") {
      const v = window.prompt(`Mark ${inr(l.amount)} to ${l.partner?.name} (UPI ${l.partner?.upiId || "not set"}) as paid.\n\nUPI / bank reference:`, "");
      if (v === null) return;
      payoutRef = v;
    } else if (!window.confirm(action === "cancel" ? "Cancel this commission? (e.g. refund, fake institute)" : "Move back to pending?")) return;
    try { await api.post(`/sales-partners/admin/commissions/${l.id}`, { action, payoutRef }); toast.success("Saved"); load(); }
    catch (err: any) { toast.error(err?.response?.data?.message || "Failed"); }
  };
  const update = async (p: Partner, body: object) => {
    try { await api.put(`/sales-partners/admin/${p.id}`, body); toast.success("Saved"); load(); }
    catch (err: any) { toast.error(err?.response?.data?.message || "Failed"); }
  };
  const resetPw = async (p: Partner) => {
    if (!window.confirm(`Reset the password for ${p.name}? A new one is emailed to ${p.email}.`)) return;
    try { const { data } = await api.post(`/sales-partners/admin/${p.id}/reset-password`); window.prompt(data.emailed ? "New password emailed. Copy if needed:" : "Email failed. Share this password:", data.password); }
    catch (err: any) { toast.error(err?.response?.data?.message || "Reset failed"); }
  };

  const shown = lines.filter((l) => filter === "all" || l.status === filter);
  const pendingTotal = lines.filter((l) => l.status === "pending").reduce((n, l) => n + l.amount, 0);
  const overdue = lines.filter((l) => l.status === "pending" && l.dueBy && new Date(l.dueBy) < new Date()).length;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Sales partners</h1>
      <p className="text-sm text-ink/70">Commission-only partners from <a href="/partner" target="_blank" className="underline">www.yneet.in/partner</a>. {partners.length} partners · {inr(pendingTotal)} to pay{overdue ? ` · ${overdue} overdue` : ""}.
        Institutes that pay offline: add the partner's code in Institutes → Partner.</p>

      <h2 className="font-display text-lg font-bold mt-6">Commissions</h2>
      <div className="flex gap-2 mt-2">
        {(["pending", "paid", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1 rounded-full border ${filter === f ? "bg-ink text-paper border-ink" : "border-ink/15"}`}>{f[0].toUpperCase() + f.slice(1)}</button>
        ))}
      </div>
      {loading ? <p className="text-sm text-ink/70 mt-3">Loading…</p> : shown.length === 0 ? <p className="text-sm text-ink/70 mt-3">Nothing here.</p> : (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="bg-ink/[0.04] text-left"><th className="p-3">Date</th><th className="p-3">Partner</th><th className="p-3">Institute</th><th className="p-3">Type</th><th className="p-3 text-right">Paid by inst.</th><th className="p-3 text-right">Commission</th><th className="p-3">Status</th><th className="p-3"></th></tr></thead>
            <tbody>
              {shown.map((l) => {
                const late = l.status === "pending" && l.dueBy && new Date(l.dueBy) < new Date();
                return (
                  <tr key={l.id} className="border-t border-ink/10 align-top">
                    <td className="p-3">{fmt(l.date)}</td>
                    <td className="p-3">{l.partner ? <>{l.partner.name} <span className="text-ink/60">({l.partner.code})</span><br /><span className="text-xs text-ink/60">{l.partner.phone} · UPI {l.partner.upiId || <b className="text-red-700">not set</b>}</span></> : "—"}</td>
                    <td className="p-3">{l.institute || "—"}{l.note ? <div className="text-xs text-ink/60">{l.note}</div> : null}</td>
                    <td className="p-3">{KIND[l.kind] || l.kind}</td>
                    <td className="p-3 text-right">{l.base ? inr(l.base) : "—"}</td>
                    <td className="p-3 text-right font-semibold">{inr(l.amount)}</td>
                    <td className="p-3 text-xs">{l.status === "paid" ? `Paid ${fmt(l.paidAt)}${l.payoutRef ? ` · ${l.payoutRef}` : ""}` : l.status === "cancelled" ? "Cancelled" : <span className={late ? "text-red-700 font-semibold" : ""}>Pay by {fmt(l.dueBy)}</span>}</td>
                    <td className="p-3 whitespace-nowrap">
                      {l.status === "pending" && <><button onClick={() => act(l, "pay")} className="text-xs font-semibold bg-gold text-ink px-3 py-1 rounded-full">Mark paid</button> <button onClick={() => act(l, "cancel")} className="text-xs underline text-ink/60 ml-1">Cancel</button></>}
                      {l.status !== "pending" && <button onClick={() => act(l, "reopen")} className="text-xs underline text-ink/60">Reopen</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="font-display text-lg font-bold mt-8">Partners</h2>
      <div className="mt-3 space-y-3">
        {!loading && partners.length === 0 && <p className="text-sm text-ink/70">No partners yet. Share www.yneet.in/partner in college and teacher WhatsApp groups.</p>}
        {partners.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-ink/10 p-4 flex flex-wrap justify-between gap-3">
            <div>
              <p className="font-semibold">{p.name} <span className="ml-1 text-xs font-mono bg-ink/5 px-2 py-0.5 rounded">{p.code}</span>
                {p.status === "suspended" && <span className="ml-1.5 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Paused</span>}</p>
              <p className="text-sm text-ink/70">{[p.phone, p.email, p.city, p.occupation, p.contacts && `knows ${p.contacts} centres`].filter(Boolean).join(" · ")}</p>
              <p className="text-sm mt-1"><b>{p.institutes}</b> institutes · earned <b>{inr(p.earned)}</b> · paid {inr(p.paid)} · pending {inr(p.pending)} · UPI {p.upiId || "—"} · joined {fmt(p.createdAt)}</p>
              {p.notes && <p className="text-xs text-ink/60 mt-0.5">Note: {p.notes}</p>}
            </div>
            <div className="flex flex-wrap gap-1 items-start">
              <a href={`https://wa.me/91${p.phone}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-ink/5 text-xs font-semibold">WhatsApp</a>
              <button onClick={() => { navigator.clipboard?.writeText(p.code); toast.success("Code copied"); }} title="Copy code" className="p-2 rounded-lg hover:bg-ink/5"><Copy size={16} /></button>
              <button onClick={() => { const v = window.prompt("UPI ID:", p.upiId); if (v !== null) update(p, { upiId: v }); }} className="p-2 rounded-lg hover:bg-ink/5 text-xs font-semibold">UPI</button>
              <button onClick={() => { const v = window.prompt("Admin note:", p.notes); if (v !== null) update(p, { notes: v }); }} className="p-2 rounded-lg hover:bg-ink/5 text-xs font-semibold">Note</button>
              <button onClick={() => resetPw(p)} title="Reset password" className="p-2 rounded-lg hover:bg-ink/5"><KeyRound size={16} /></button>
              {p.status === "active"
                ? <button onClick={() => window.confirm(`Pause ${p.name}? Their code stops working for new institutes.`) && update(p, { status: "suspended" })} title="Pause" className="p-2 rounded-lg hover:bg-ink/5"><Pause size={16} /></button>
                : <button onClick={() => update(p, { status: "active" })} title="Reactivate" className="p-2 rounded-lg hover:bg-ink/5"><Play size={16} /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
