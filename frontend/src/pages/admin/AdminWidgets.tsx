import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";

// Admin: institutes that made a free NEET tools page (www.yneet.in/i/<slug>)
// from the widgets page. Each one is a lead for YNeet institute plans.

type Partner = { _id: string; createdAt: string; name: string; slug: string; phone: string; city: string; kind: string; views: number; hidden: boolean };
const errMsg = (e: any) => e?.response?.data?.message || "Something went wrong.";

const AdminWidgets = () => {
  const [list, setList] = useState<Partner[] | null>(null);
  const load = () => api.get("/widgets/admin/partners").then((r) => setList(r.data.partners || [])).catch((e) => { toast.error(errMsg(e)); setList([]); });
  useEffect(() => { load(); }, []);

  const toggle = async (p: Partner) => {
    try { await api.put(`/widgets/admin/partners/${p._id}`, { hidden: !p.hidden }); load(); }
    catch (e) { toast.error(errMsg(e)); }
  };

  const csv = () => {
    const rows = [["Date", "Name", "City", "Type", "WhatsApp", "Page", "Views"], ...(list || []).map((p) => [new Date(p.createdAt).toLocaleDateString("en-IN"), p.name, p.city, p.kind, p.phone, `https://www.yneet.in/i/${p.slug}`, String(p.views)])];
    const blob = new Blob([rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "widget-partners.csv"; a.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-display text-2xl font-bold">Widget partners</h1>
        <button onClick={csv} disabled={!list?.length} className="bg-gold text-ink font-semibold px-4 py-2 rounded-full disabled:opacity-50">Download CSV</button>
      </div>
      <p className="text-sm text-ink/60 mt-1">Institutes and schools that made a free tools page at /i/… from the <a href="/neet-question-widget" className="underline">widgets page</a>.</p>
      {list === null && <p className="mt-6 text-ink/60">Loading…</p>}
      {list && !list.length && <p className="mt-6 text-ink/60">None yet.</p>}
      {list && list.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b border-ink/15"><th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Name</th><th className="py-2 pr-3">City</th><th className="py-2 pr-3">Type</th><th className="py-2 pr-3">WhatsApp</th><th className="py-2 pr-3">Views</th><th className="py-2"></th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p._id} className={`border-b border-ink/5 ${p.hidden ? "opacity-50" : ""}`}>
                  <td className="py-2 pr-3 whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="py-2 pr-3"><a href={`/i/${p.slug}`} target="_blank" rel="noopener" className="underline">{p.name}</a></td>
                  <td className="py-2 pr-3">{p.city}</td>
                  <td className="py-2 pr-3">{p.kind}</td>
                  <td className="py-2 pr-3"><a href={`https://wa.me/91${p.phone}`} target="_blank" rel="noopener" className="underline">{p.phone}</a></td>
                  <td className="py-2 pr-3">{p.views}</td>
                  <td className="py-2"><button onClick={() => toggle(p)} className="text-xs underline">{p.hidden ? "Show page" : "Hide page"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminWidgets;
