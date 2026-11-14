import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";

// Admin: load official cutoff / allotment data for the NEET College Predictor, see leads.

type Dataset = { quota: string; name: string; year: number; round: number; course: string; rows: number; updatedAt: string };
type Summary = { quotas: Record<string, string>; datasets: Dataset[]; leads: { total: number; verified: number; paid: number; revenue: number } };
type Preview = { mode: string; rows: number; skipped: number; colleges: number; categories: string[]; courses: string[]; seatTypes: string[]; sample: any[] };
type Lead = { _id: string; createdAt: string; name: string; phone: string; verified: boolean; air?: number; category: string; homeState: string; course: string; searches: number; paid: boolean };

const errMsg = (e: any) => e?.response?.data?.message || "Something went wrong.";
const STATE_RANK_DEFAULT = new Set(["KL", "KA", "MH", "AP", "TS"]); // states that commonly list state merit rank (TN data is mark-based)

const AdminPredictor = () => {
  const [sum, setSum] = useState<Summary | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [f, setF] = useState({ quota: "AIQ", year: String(new Date().getFullYear()), round: "1", course: "", rankType: "AIR", openToAllDefault: false, source: "" });
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.get("/predictor/admin/summary").then((r) => setSum(r.data)).catch((e) => toast.error(errMsg(e)));
    api.get("/predictor/admin/leads").then((r) => setLeads(r.data.leads || [])).catch(() => {});
  };
  useEffect(load, []);

  const pick = async (file?: File) => {
    if (!file) return;
    setFileName(file.name); setPreview(null);
    setCsv(await file.text());
    setF((x) => ({ ...x, source: file.name }));
  };

  const send = async (dryRun: boolean) => {
    if (!csv) return toast.error("Choose a CSV file first");
    setBusy(true);
    try {
      const r = await api.post("/predictor/admin/import", { ...f, csv, dryRun, course: f.course || undefined });
      if (dryRun) setPreview(r.data);
      else { toast.success(`Imported ${r.data.imported} rows (${r.data.colleges} colleges)`); setPreview(null); setCsv(""); setFileName(""); load(); }
    } catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); }
  };

  const remove = async (d: Dataset) => {
    if (!window.confirm(`Delete ${d.name} ${d.year} round ${d.round} ${d.course}?`)) return;
    try { await api.delete("/predictor/admin/data", { data: { quota: d.quota, year: d.year, round: d.round, course: d.course } }); toast.success("Deleted"); load(); }
    catch (e) { toast.error(errMsg(e)); }
  };

  const downloadLeads = async () => {
    const r = await api.get("/predictor/admin/leads", { params: { format: "csv" }, responseType: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(r.data); a.download = "predictor-leads.csv"; a.click();
  };

  const input = "mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-ink";
  const quotas = sum?.quotas || { AIQ: "All India Quota (MCC)" };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">NEET College Predictor</h1>
        <p className="text-sm text-ink/70 mt-1">Public page: <a className="underline" href="/neet-college-predictor" target="_blank" rel="noreferrer">/neet-college-predictor</a></p>
      </div>

      {sum && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[["Leads", sum.leads.total], ["WhatsApp confirmed", sum.leads.verified], ["Reports sold", sum.leads.paid], ["Report revenue", `₹${sum.leads.revenue.toLocaleString("en-IN")}`]].map(([k, v]) => (
            <div key={k as string} className="rounded-xl border border-ink/10 bg-white p-4"><p className="text-xs text-ink/70">{k}</p><p className="text-2xl font-bold">{v}</p></div>
          ))}
        </div>
      )}

      {/* Data loaded */}
      <section className="rounded-2xl border border-ink/10 bg-white p-5">
        <h2 className="font-display text-lg font-bold">Data loaded</h2>
        <p className="text-xs text-ink/70 mt-1">The predictor always uses the latest year and highest round loaded for each quota.</p>
        <table className="w-full text-sm mt-3">
          <thead><tr className="text-left text-xs text-ink/70 border-b"><th className="py-1">Quota</th><th>Year</th><th>Round</th><th>Course</th><th>Rows</th><th /></tr></thead>
          <tbody>
            {Object.entries(quotas).map(([code, name]) => {
              const rows = sum?.datasets.filter((d) => d.quota === code) || [];
              if (!rows.length) return <tr key={code} className="border-b border-ink/5"><td className="py-1.5">{name}</td><td colSpan={5} className="text-red-600 text-xs">Not loaded yet</td></tr>;
              return rows.map((d, i) => (
                <tr key={code + i} className="border-b border-ink/5">
                  <td className="py-1.5">{i === 0 ? name : ""}</td><td>{d.year}</td><td>{d.round}</td><td>{d.course}</td><td>{d.rows.toLocaleString("en-IN")}</td>
                  <td className="text-right"><button onClick={() => remove(d)} className="text-xs text-red-600 underline">Delete</button></td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </section>

      {/* Upload */}
      <section className="rounded-2xl border border-ink/10 bg-white p-5">
        <h2 className="font-display text-lg font-bold">Upload cutoff data</h2>
        <p className="text-sm text-ink/65 mt-1">
          Upload a CSV of either <b>(a)</b> an official allotment list (one row per candidate: <code>rank, college, course, category, quota</code>) — closing ranks are worked out automatically — or <b>(b)</b> a cutoff list (<code>college, course, category, closing_rank</code>, optional <code>seat_type, college_type, college_state, opening_rank, annual_fee, open_to_all</code>).
          Convert official PDFs to CSV first (ask Claude, or use <code>scripts/allotment_pdf_to_csv.py</code>).
        </p>
        <div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
          <label>Quota
            <select className={input} value={f.quota} onChange={(e) => setF({ ...f, quota: e.target.value, rankType: e.target.value === "AIQ" ? "AIR" : STATE_RANK_DEFAULT.has(e.target.value) ? "STATE" : "AIR" })}>
              {Object.entries(quotas).map(([c, n]) => <option key={c} value={c}>{n}</option>)}
            </select>
          </label>
          <label>Counselling year<input className={input} value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} /></label>
          <label>Round<input className={input} value={f.round} onChange={(e) => setF({ ...f, round: e.target.value })} /></label>
          <label>Ranks in this file are
            <select className={input} value={f.rankType} onChange={(e) => setF({ ...f, rankType: e.target.value })}>
              <option value="AIR">NEET All India Rank</option><option value="STATE">State merit rank</option><option value="SCORE">NEET marks (lowest mark admitted)</option>
            </select>
          </label>
          <label>Course (if the file has no course column)
            <select className={input} value={f.course} onChange={(e) => setF({ ...f, course: e.target.value })}>
              <option value="">From file</option><option value="MBBS">MBBS</option><option value="BDS">BDS</option>
            </select>
          </label>
          {f.quota !== "AIQ" && (
            <label className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={f.openToAllDefault} onChange={(e) => setF({ ...f, openToAllDefault: e.target.checked })} />
              Seats open to other states' students (e.g. management)
            </label>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input type="file" accept=".csv,text/csv" onChange={(e) => pick(e.target.files?.[0])} />
          {fileName && <span className="text-xs text-ink/70">{fileName} · {(csv.length / 1024).toFixed(0)} KB</span>}
          <button disabled={busy || !csv} onClick={() => send(true)} className="px-4 py-2 rounded-lg border font-semibold disabled:opacity-50">Check file</button>
          <button disabled={busy || !preview} onClick={() => send(false)} className="px-4 py-2 rounded-lg bg-ink text-paper font-semibold disabled:opacity-50">Import (replaces this quota/year/round)</button>
        </div>
        {preview && (
          <div className="mt-4 text-sm rounded-xl bg-ink-50 p-4">
            <p><b>{preview.mode === "allotment" ? "Allotment list" : "Cutoff list"}</b> · {preview.rows} seat buckets · {preview.colleges} colleges · {preview.skipped} rows skipped</p>
            <p className="mt-1">Courses: {preview.courses.join(", ")} · Categories: {preview.categories.join(", ")}</p>
            {preview.seatTypes.length > 0 && <p className="mt-1">Seat types: {preview.seatTypes.join(", ")}</p>}
            <table className="w-full text-xs mt-3">
              <thead><tr className="text-left text-ink/70"><th>College</th><th>Seat type</th><th>Category</th><th>Open</th><th>Close</th><th>Open to all</th></tr></thead>
              <tbody>{preview.sample.map((r, i) => <tr key={i}><td>{r.college}</td><td>{r.seatType}</td><td>{r.category}</td><td>{r.openingRank}</td><td>{r.closingRank}</td><td>{r.openToAll ? "yes" : "no"}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>

      {/* Leads */}
      <section className="rounded-2xl border border-ink/10 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Latest leads</h2>
          <button onClick={downloadLeads} className="text-sm underline">Download all (CSV)</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm mt-3">
            <thead><tr className="text-left text-xs text-ink/70 border-b"><th className="py-1">Date</th><th>Name</th><th>WhatsApp</th><th>AIR</th><th>Cat.</th><th>State</th><th>Course</th><th>Searches</th><th>Paid</th></tr></thead>
            <tbody>
              {leads.slice(0, 100).map((l) => (
                <tr key={l._id} className="border-b border-ink/5">
                  <td className="py-1.5">{new Date(l.createdAt).toLocaleDateString("en-IN")}</td><td>{l.name}</td>
                  <td>{l.phone}{l.verified ? " ✓" : ""}</td><td>{l.air?.toLocaleString("en-IN")}</td><td>{l.category}</td><td>{l.homeState}</td><td>{l.course}</td><td>{l.searches}</td><td>{l.paid ? "₹ yes" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminPredictor;
