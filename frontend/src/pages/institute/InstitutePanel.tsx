import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Upload, Download, UserPlus, Trash2, Mail, LogOut, KeyRound } from "lucide-react";
import instituteApi, { INST_TOKEN, parseCsv } from "../../api/instituteApi";

interface Institute {
  name: string; email: string; seats: number; seatsUsed: number; seatsLeft: number;
  startDate: string; endDate: string; status: string; live: boolean;
}
interface Student { id: string; fullName: string; email: string; phone: string; gender: string; currentClass?: string; createdAt: string; }
interface Result { row: number; email: string; ok: boolean; message?: string; password?: string; emailed?: boolean; linked?: boolean; }
interface NewStudent { fullName: string; email: string; phone: string; gender: string; currentClass: string; }

const empty: NewStudent = { fullName: "", email: "", phone: "", gender: "", currentClass: "" };
const CLASSES = ["6", "7", "8", "9", "10", "11", "12", "Dropper"];
const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const input = "w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-gold outline-none bg-white";

const InstitutePanel = () => {
  const navigate = useNavigate();
  const [inst, setInst] = useState<Institute | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState<NewStudent>(empty);
  const [csvRows, setCsvRows] = useState<NewStudent[]>([]);
  const [csvName, setCsvName] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [search, setSearch] = useState("");
  const [pw, setPw] = useState({ open: false, current: "", next: "" });

  const load = async () => {
    try {
      const [me, list] = await Promise.all([instituteApi.get("/me"), instituteApi.get("/students")]);
      setInst(me.data.institute);
      setStudents(list.data.students);
    } catch (err: any) {
      if (err?.response?.status === 401) { localStorage.removeItem(INST_TOKEN); navigate("/institute/login", { replace: true }); }
      else toast.error("Could not load your panel");
    }
  };

  useEffect(() => {
    if (!localStorage.getItem(INST_TOKEN)) { navigate("/institute/login", { replace: true }); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = async (rows: NewStudent[]) => {
    setBusy(true);
    setResults(null);
    try {
      const { data } = await instituteApi.post("/students", { students: rows });
      setResults(data.results);
      if (data.added) toast.success(`${data.added} student${data.added > 1 ? "s" : ""} added. Login details sent by email.`);
      if (data.failed) toast.error(`${data.failed} could not be added — see below.`);
      await load();
      return data.failed === 0;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not add students");
      return false;
    } finally { setBusy(false); }
  };

  const addOne = async (e: FormEvent) => {
    e.preventDefault();
    if (await add([form])) setForm(empty);
  };

  const onCsv = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    file.text().then((text) => {
      const rows = parseCsv(text).map((r) => ({
        fullName: r.fullname || r.name || r.studentname || "",
        email: r.email || r.emailid || "",
        phone: r.phone || r.mobile || r.phonenumber || r.mobilenumber || "",
        gender: r.gender || "",
        currentClass: r.class || r.currentclass || r.standard || "",
      })).filter((r) => r.fullName || r.email);
      if (!rows.length) { toast.error("No students found. Use the template's column names."); return; }
      setCsvRows(rows);
      setCsvName(file.name);
    });
  };

  const template = () => {
    const csv = "fullName,email,phone,gender,class\r\nPriya S,priya@example.com,9876543210,Female,12\r\nArun K,arun@example.com,9876500000,Male,Dropper\r\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "yneet_students_template.csv";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const remove = async (s: Student) => {
    if (!window.confirm(`Remove ${s.fullName}? Their YNeet access ends now and the seat becomes free for another student.`)) return;
    try { await instituteApi.delete(`/students/${s.id}`); toast.success("Removed. Seat is free."); load(); }
    catch (err: any) { toast.error(err?.response?.data?.message || "Could not remove"); }
  };

  const resend = async (s: Student) => {
    if (!window.confirm(`Send ${s.fullName} a new password by email? Their old password will stop working.`)) return;
    try {
      const { data } = await instituteApi.post(`/students/${s.id}/resend`);
      if (data.emailed) toast.success("New login sent by email.");
      else window.prompt("Email could not be sent. Share this password with the student:", data.password);
    } catch (err: any) { toast.error(err?.response?.data?.message || "Could not resend"); }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await instituteApi.post("/change-password", { currentPassword: pw.current, newPassword: pw.next });
      toast.success("Password changed.");
      setPw({ open: false, current: "", next: "" });
    } catch (err: any) { toast.error(err?.response?.data?.message || "Could not change password"); }
  };

  const logout = () => { localStorage.removeItem(INST_TOKEN); navigate("/institute/login"); };

  if (!inst) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="h-8 w-8 border-4 border-gold border-t-transparent rounded-full animate-spin" /></div>;
  }

  const pct = Math.min(100, Math.round((inst.seatsUsed / inst.seats) * 100));
  const daysLeft = Math.ceil((new Date(inst.endDate).getTime() - Date.now()) / 86400000);
  const shown = students.filter((s) => !search || `${s.fullName} ${s.email} ${s.phone}`.toLowerCase().includes(search.toLowerCase()));
  const needsSharing = (results || []).filter((r) => r.ok && r.password && !r.emailed);
  const failures = (results || []).filter((r) => !r.ok);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-ink/40 font-semibold">Institute panel</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">{inst.name}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPw({ ...pw, open: !pw.open })} className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-full border border-ink/15 hover:bg-ink/5"><KeyRound size={15} /> Password</button>
          <button onClick={logout} className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-full border border-ink/15 hover:bg-ink/5"><LogOut size={15} /> Logout</button>
        </div>
      </div>

      {pw.open && (
        <form onSubmit={changePassword} className="bg-white rounded-2xl border border-ink/10 p-5 grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div><label className="text-xs font-medium">Current password</label><input type="password" required className={input} value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div>
          <div><label className="text-xs font-medium">New password (6+ characters)</label><input type="password" required minLength={6} className={input} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
          <button className="bg-ink text-paper text-sm font-semibold px-5 py-2 rounded-full">Save</button>
        </form>
      )}

      {!inst.live && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
          {inst.status === "suspended" ? "Your institute account is suspended." : `Your pack expired on ${fmt(inst.endDate)}.`} Students can't use YNeet until it's renewed. Please contact YNeet on WhatsApp.
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-ink/10 p-5 sm:col-span-2">
          <div className="flex justify-between text-sm"><span className="font-semibold">Seats used</span><span>{inst.seatsUsed} of {inst.seats}</span></div>
          <div className="mt-3 h-3 rounded-full bg-ink/10 overflow-hidden"><div className="h-full bg-gold" style={{ width: `${pct}%` }} /></div>
          <p className="mt-2 text-sm text-ink/60">{inst.seatsLeft} seat{inst.seatsLeft === 1 ? "" : "s"} left. Removing a student frees their seat.</p>
        </div>
        <div className="bg-white rounded-2xl border border-ink/10 p-5">
          <p className="text-sm font-semibold">Valid till</p>
          <p className="font-display text-2xl font-bold mt-1">{fmt(inst.endDate)}</p>
          <p className="text-sm text-ink/60">{inst.live ? `${daysLeft} days left` : "Not active"}</p>
        </div>
      </div>

      {inst.live && inst.seatsLeft > 0 && (
        <div className="grid lg:grid-cols-2 gap-4">
          <form onSubmit={addOne} className="bg-white rounded-2xl border border-ink/10 p-5 space-y-3">
            <h2 className="font-semibold flex items-center gap-2"><UserPlus size={18} /> Add a student</h2>
            <input required placeholder="Full name" className={input} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input required type="email" placeholder="Email" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input required placeholder="Phone" className={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <select required className={input} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">Gender</option><option>Male</option><option>Female</option><option>Other</option>
              </select>
              <select required className={input} value={form.currentClass} onChange={(e) => setForm({ ...form, currentClass: e.target.value })}>
                <option value="">Class</option>{CLASSES.map((c) => <option key={c} value={c}>{c === "Dropper" ? c : `Class ${c}`}</option>)}
              </select>
            </div>
            <button disabled={busy} className="w-full bg-gold text-ink font-semibold py-2.5 rounded-full hover:bg-gold-dark disabled:opacity-60">{busy ? "Adding..." : "Add student"}</button>
            <p className="text-xs text-ink/50">The student gets their login by email. If they already have a YNeet account, it's linked and they keep their password.</p>
          </form>

          <div className="bg-white rounded-2xl border border-ink/10 p-5 space-y-3">
            <h2 className="font-semibold flex items-center gap-2"><Upload size={18} /> Add many (CSV / Excel)</h2>
            <p className="text-sm text-ink/60">Columns: <b>fullName, email, phone, gender, class</b>. In Excel use File → Save As → CSV.</p>
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer flex items-center gap-1.5 text-sm font-semibold bg-ink text-paper px-4 py-2 rounded-full">
                <Upload size={15} /> Choose CSV<input type="file" accept=".csv,text/csv" className="hidden" onChange={onCsv} />
              </label>
              <button onClick={template} className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-full border border-ink/15 hover:bg-ink/5"><Download size={15} /> Template</button>
            </div>
            {csvRows.length > 0 && (
              <div className="rounded-lg bg-ink/5 p-3 text-sm space-y-2">
                <p><b>{csvName}</b>: {csvRows.length} students found.{csvRows.length > inst.seatsLeft && <span className="text-red-700"> Only {inst.seatsLeft} seats left, so the first {inst.seatsLeft} will be added.</span>}</p>
                <div className="flex gap-2">
                  <button disabled={busy} onClick={async () => { await add(csvRows); setCsvRows([]); setCsvName(""); }} className="bg-gold text-ink font-semibold px-4 py-1.5 rounded-full disabled:opacity-60">{busy ? "Adding..." : `Add ${Math.min(csvRows.length, inst.seatsLeft)} students`}</button>
                  <button onClick={() => { setCsvRows([]); setCsvName(""); }} className="px-4 py-1.5 rounded-full border border-ink/15">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {(needsSharing.length > 0 || failures.length > 0) && (
        <div className="bg-white rounded-2xl border border-ink/10 p-5 space-y-3 text-sm">
          {needsSharing.length > 0 && (
            <div>
              <p className="font-semibold">Email didn't go out for these — share the login yourself (login at www.yneet.in/login):</p>
              <ul className="mt-1 space-y-0.5">{needsSharing.map((r) => <li key={r.email}>{r.email} · password <code className="bg-ink/5 px-1.5 rounded">{r.password}</code></li>)}</ul>
            </div>
          )}
          {failures.length > 0 && (
            <div>
              <p className="font-semibold text-red-700">Not added:</p>
              <ul className="mt-1 space-y-0.5">{failures.map((r) => <li key={`${r.row}-${r.email}`}>Row {r.row}{r.email ? ` (${r.email})` : ""}: {r.message}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-ink/10">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
          <h2 className="font-semibold">Your students ({students.length})</h2>
          <input placeholder="Search name, email, phone" className={`${input} max-w-xs`} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-ink/5 text-left">
              <tr><th className="px-4 py-2.5">Name</th><th className="px-4 py-2.5">Email</th><th className="px-4 py-2.5">Phone</th><th className="px-4 py-2.5">Class</th><th className="px-4 py-2.5">Joined</th><th className="px-4 py-2.5"></th></tr>
            </thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-ink/50">{students.length ? "No match." : "No students yet. Add your first student above."}</td></tr>}
              {shown.map((s) => (
                <tr key={s.id} className="border-t border-ink/5">
                  <td className="px-4 py-2.5 font-medium">{s.fullName}</td>
                  <td className="px-4 py-2.5">{s.email}</td>
                  <td className="px-4 py-2.5">{s.phone}</td>
                  <td className="px-4 py-2.5">{s.currentClass || "—"}</td>
                  <td className="px-4 py-2.5">{fmt(s.createdAt)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => resend(s)} title="Send new login" className="p-1.5 rounded hover:bg-ink/5"><Mail size={16} /></button>
                    <button onClick={() => remove(s)} title="Remove and free seat" className="p-1.5 rounded hover:bg-red-50 text-red-700"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InstitutePanel;
