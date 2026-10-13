import { useEffect, useState, FormEvent } from "react";
import toast from "react-hot-toast";
import { Plus, RefreshCw, KeyRound, Pause, Play, Trash2, Users, Pencil } from "lucide-react";
import api from "../../api/axios";

interface Institute {
  id: string; name: string; contactName?: string; email: string; phone?: string; city?: string; board?: string;
  seats: number; seatsUsed: number; seatsLeft: number; amountPaid: number; paymentRef?: string;
  startDate: string; endDate: string; status: string; live: boolean; notes?: string;
}
interface Pack { seats: number; price: number; }
interface Student { id: string; fullName: string; email: string; phone: string; currentClass?: string; }

const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const inr = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;
const input = "w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-gold outline-none bg-white";
const blank = { pack: "20", name: "", contactName: "", email: "", phone: "", city: "", board: "CBSE", seats: "20", amountPaid: "100000", paymentRef: "", startDate: new Date().toISOString().slice(0, 10), notes: "" };

const AdminInstitutes = () => {
  const [list, setList] = useState<Institute[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  const load = () => api.get("/institute/admin").then((r) => { setList(r.data.institutes); setPacks(r.data.packs); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const pickPack = (v: string) => {
    const p = packs.find((x) => String(x.seats) === v);
    setForm({ ...form, pack: v, ...(p ? { seats: String(p.seats), amountPaid: String(p.price) } : {}) });
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post("/institute/admin", form);
      window.prompt(
        data.emailed
          ? `Created. Login details were emailed to ${data.institute.email}. Password (copy if needed):`
          : `Created, but the email didn't send. Share this password with the institute (login at www.yneet.in/institute):`,
        data.password
      );
      setForm(blank); setShowForm(false); load();
    } catch (err: any) { toast.error(err?.response?.data?.message || "Could not create"); }
    finally { setSaving(false); }
  };

  const update = async (i: Institute, body: object, msg: string) => {
    try { await api.put(`/institute/admin/${i.id}`, body); toast.success(msg); load(); }
    catch (err: any) { toast.error(err?.response?.data?.message || "Update failed"); }
  };

  const renew = (i: Institute) => {
    const amt = window.prompt(`Renew ${i.name} for one more year (from ${i.live ? fmt(i.endDate) : "today"}).\n\nTotal amount received so far (₹):`, String(i.amountPaid));
    if (amt === null) return;
    update(i, { renew: true, amountPaid: Number(amt) || i.amountPaid }, "Renewed for one year");
  };

  const changePack = (i: Institute) => {
    const seats = window.prompt(`Seats for ${i.name} (now ${i.seats}, ${i.seatsUsed} in use). Packs: 20 / 50 / 100 or any number:`, String(i.seats));
    if (!seats) return;
    const amt = window.prompt("Total amount received (₹):", String(i.amountPaid));
    if (amt === null) return;
    update(i, { seats: Number(seats), amountPaid: Number(amt) || 0 }, "Pack updated");
  };

  const edit = (i: Institute) => {
    const ref = window.prompt("Payment reference / notes (UTR, cheque no.):", i.paymentRef || "");
    if (ref === null) return;
    const end = window.prompt("Valid till (YYYY-MM-DD):", i.endDate.slice(0, 10));
    if (!end) return;
    update(i, { paymentRef: ref, endDate: end }, "Saved");
  };

  const resetPw = async (i: Institute) => {
    if (!window.confirm(`Reset the password for ${i.name}? A new one is emailed to ${i.email}.`)) return;
    try {
      const { data } = await api.post(`/institute/admin/${i.id}/reset-password`);
      window.prompt(data.emailed ? "New password emailed. Copy if needed:" : "Email failed. Share this password:", data.password);
    } catch (err: any) { toast.error(err?.response?.data?.message || "Reset failed"); }
  };

  const del = async (i: Institute) => {
    if (!window.confirm(`Delete ${i.name}? Its ${i.seatsUsed} students lose YNeet access immediately (their accounts stay).`)) return;
    try { await api.delete(`/institute/admin/${i.id}`); toast.success("Deleted"); load(); }
    catch (err: any) { toast.error(err?.response?.data?.message || "Delete failed"); }
  };

  const toggleStudents = async (i: Institute) => {
    if (open === i.id) { setOpen(null); return; }
    setOpen(i.id); setStudents([]);
    const { data } = await api.get(`/institute/admin/${i.id}/students`);
    setStudents(data.students);
  };

  const totalSeats = list.reduce((n, i) => n + i.seats, 0);
  const totalUsed = list.reduce((n, i) => n + i.seatsUsed, 0);
  const revenue = list.reduce((n, i) => n + (i.amountPaid || 0), 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Institutes</h1>
          <p className="text-sm text-ink/60">Bulk student packs, 1 year. {list.length} institutes · {totalUsed}/{totalSeats} seats used · {inr(revenue)} received</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 text-sm font-semibold bg-gold text-ink px-4 py-2 rounded-full"><Plus size={16} /> New institute</button>
      </div>

      {showForm && (
        <form onSubmit={create} className="mt-5 bg-white rounded-2xl border border-ink/10 p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap gap-2">
            {packs.map((p) => (
              <button type="button" key={p.seats} onClick={() => pickPack(String(p.seats))}
                className={`px-4 py-2 rounded-xl border text-sm ${form.pack === String(p.seats) ? "border-gold bg-gold-light font-semibold" : "border-ink/15"}`}>
                {p.seats} students · {inr(p.price)}
              </button>
            ))}
            <button type="button" onClick={() => pickPack("custom")} className={`px-4 py-2 rounded-xl border text-sm ${form.pack === "custom" ? "border-gold bg-gold-light font-semibold" : "border-ink/15"}`}>Custom</button>
          </div>
          <div><label className="text-xs font-medium">Institute name *</label><input required className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="text-xs font-medium">Login email *</label><input required type="email" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="text-xs font-medium">Contact person</label><input className={input} value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
          <div><label className="text-xs font-medium">Phone</label><input className={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="text-xs font-medium">City</label><input className={input} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><label className="text-xs font-medium">Students' board</label>
            <select className={input} value={form.board} onChange={(e) => setForm({ ...form, board: e.target.value })}><option>CBSE</option><option>Tamil Nadu State Board</option></select></div>
          <div><label className="text-xs font-medium">Seats *</label><input required type="number" min={1} className={input} value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value, pack: "custom" })} /></div>
          <div><label className="text-xs font-medium">Amount received (₹)</label><input type="number" className={input} value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} /></div>
          <div><label className="text-xs font-medium">Payment ref (UTR / cheque)</label><input className={input} value={form.paymentRef} onChange={(e) => setForm({ ...form, paymentRef: e.target.value })} /></div>
          <div><label className="text-xs font-medium">Start date (valid 1 year)</label><input type="date" className={input} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="text-xs font-medium">Notes</label><input className={input} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
            <button disabled={saving} className="bg-ink text-paper text-sm font-semibold px-5 py-2 rounded-full disabled:opacity-60">{saving ? "Creating..." : "Create & email login"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm px-5 py-2 rounded-full border border-ink/15">Cancel</button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {loading && <p className="text-ink/50 text-sm">Loading…</p>}
        {!loading && list.length === 0 && <p className="text-ink/50 text-sm">No institutes yet. Create one after the payment arrives.</p>}
        {list.map((i) => (
          <div key={i.id} className="bg-white rounded-2xl border border-ink/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{i.name} <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${i.live ? "bg-rise/15 text-rise-dark" : "bg-red-100 text-red-700"}`}>{i.status === "suspended" ? "Suspended" : i.live ? "Active" : "Expired"}</span></p>
                <p className="text-sm text-ink/60">{[i.contactName, i.email, i.phone, i.city].filter(Boolean).join(" · ")}</p>
                <p className="text-sm mt-1"><b>{i.seatsUsed}/{i.seats}</b> seats · valid till <b>{fmt(i.endDate)}</b> · {inr(i.amountPaid)}{i.paymentRef ? ` · ref ${i.paymentRef}` : ""}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                <button onClick={() => toggleStudents(i)} title="Students" className="p-2 rounded-lg hover:bg-ink/5"><Users size={16} /></button>
                <button onClick={() => renew(i)} title="Renew 1 year" className="p-2 rounded-lg hover:bg-ink/5"><RefreshCw size={16} /></button>
                <button onClick={() => changePack(i)} title="Change pack" className="p-2 rounded-lg hover:bg-ink/5 text-xs font-semibold">Seats</button>
                <button onClick={() => edit(i)} title="Edit payment ref / end date" className="p-2 rounded-lg hover:bg-ink/5"><Pencil size={16} /></button>
                <button onClick={() => resetPw(i)} title="Reset password" className="p-2 rounded-lg hover:bg-ink/5"><KeyRound size={16} /></button>
                {i.status === "active"
                  ? <button onClick={() => window.confirm(`Suspend ${i.name}? Its students lose access until you reactivate.`) && update(i, { status: "suspended" }, "Suspended")} title="Suspend" className="p-2 rounded-lg hover:bg-ink/5"><Pause size={16} /></button>
                  : <button onClick={() => update(i, { status: "active" }, "Reactivated")} title="Reactivate" className="p-2 rounded-lg hover:bg-ink/5"><Play size={16} /></button>}
                <button onClick={() => del(i)} title="Delete" className="p-2 rounded-lg hover:bg-red-50 text-red-700"><Trash2 size={16} /></button>
              </div>
            </div>
            {open === i.id && (
              <div className="mt-3 border-t border-ink/10 pt-3 text-sm">
                {students.length === 0 ? <p className="text-ink/50">No students added yet.</p> : (
                  <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                    {students.map((s) => <li key={s.id}>{s.fullName} <span className="text-ink/50">· {s.email} · {s.currentClass || "—"}</span></li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminInstitutes;
