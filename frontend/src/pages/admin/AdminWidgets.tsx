import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";

// Admin: institutes that made a free NEET tools page (www.yneet.in/i/<slug>)
// from the widgets page. Each one is a lead for YNeet institute plans.

type Partner = { _id: string; createdAt: string; name: string; slug: string; phone: string; city: string; kind: string; views: number; hidden: boolean };
type Site = { _id: string; host: string; widget: string; page: string; by: string; views: number; firstSeen: string; lastSeen: string };
type Stats = { totalSites: number; perWidget: Record<string, { sites: number; active30d: number; views: number }>; sites: Site[] };
const NAMES: Record<string, string> = { countdown: "Countdown", qotd: "Question of the Day", predictor: "College Predictor", cutoff: "Cutoffs", weightage: "Weightage", pyq: "Chapter PYQs" };
const day = (d: string) => new Date(d).toLocaleDateString("en-IN");

function SitesUsingWidgets() {
  const [st, setSt] = useState<Stats | null>(null);
  useEffect(() => { api.get("/widgets/admin/sites").then((r) => setSt(r.data)).catch(() => setSt({ totalSites: 0, perWidget: {}, sites: [] })); }, []);
  if (!st) return <p className="mt-6 text-ink/60">Loading sites…</p>;
  return (
    <section className="mb-12">
      <h1 className="font-display text-2xl font-bold">Sites using widgets</h1>
      <p className="text-sm text-ink/60 mt-1">{st.totalSites} website{st.totalSites === 1 ? "" : "s"} show at least one widget. A site is counted the first time a visitor loads a widget there.</p>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.keys(NAMES).map((w) => {
          const x = st.perWidget[w] || { sites: 0, active30d: 0, views: 0 };
          return (
            <div key={w} className="rounded-xl border border-ink/10 p-3">
              <p className="text-xs text-ink/60">{NAMES[w]}</p>
              <p className="text-2xl font-bold">{x.sites}</p>
              <p className="text-xs text-ink/60">{x.active30d} active (30 days) · {x.views.toLocaleString("en-IN")} loads</p>
            </div>
          );
        })}
      </div>
      {st.sites.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b border-ink/15"><th className="py-2 pr-3">Website</th><th className="py-2 pr-3">Widget</th><th className="py-2 pr-3">Shared by</th><th className="py-2 pr-3">Loads</th><th className="py-2 pr-3">First seen</th><th className="py-2">Last seen</th></tr></thead>
            <tbody>
              {st.sites.map((x) => (
                <tr key={x._id} className="border-b border-ink/5">
                  <td className="py-2 pr-3"><a href={`https://${x.host}${x.page || ""}`} target="_blank" rel="noopener" className="underline">{x.host}</a></td>
                  <td className="py-2 pr-3">{NAMES[x.widget] || x.widget}</td>
                  <td className="py-2 pr-3">{x.by}</td>
                  <td className="py-2 pr-3">{x.views}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{day(x.firstSeen)}</td>
                  <td className="py-2 whitespace-nowrap">{day(x.lastSeen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// The two WhatsApp jobs to partners run by themselves once their templates are
// approved and set on Railway (see backend/utils/partnerWhatsApp.js).
function WhatsAppJobs() {
  const [out, setOut] = useState("");
  const run = async (job: "weekly" | "daily", dry: boolean) => {
    if (!dry && !window.confirm(`Send the ${job} WhatsApp message to partners now?`)) return;
    try { const r = await api.post(`/widgets/admin/run-${job}${dry ? "?dry=1" : ""}`); setOut(`${job}${dry ? " (test)" : ""}: ${JSON.stringify(r.data)}`); }
    catch (e: any) { setOut(e?.response?.data?.message || "Failed"); }
  };
  const b = "text-xs border border-ink/20 px-3 py-1.5 rounded-full hover:border-gold";
  return (
    <div className="mt-3 rounded-xl border border-ink/10 p-3 text-sm">
      <p><b>WhatsApp to partners:</b> daily status-image reminder (7:30 am) and Monday stats (11:30 am). They send automatically once WA_PARTNER_DAILY_TEMPLATE / WA_PARTNER_WEEKLY_TEMPLATE are set on Railway.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button className={b} onClick={() => run("weekly", true)}>Weekly: who would get it?</button>
        <button className={b} onClick={() => run("weekly", false)}>Send weekly now</button>
        <button className={b} onClick={() => run("daily", true)}>Daily: who would get it?</button>
        <button className={b} onClick={() => run("daily", false)}>Send daily now</button>
      </div>
      {out && <p className="mt-2 text-xs text-ink/70 break-all">{out}</p>}
    </div>
  );
}

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
      <SitesUsingWidgets />
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-display text-2xl font-bold">Widget partners</h1>
        <button onClick={csv} disabled={!list?.length} className="bg-gold text-ink font-semibold px-4 py-2 rounded-full disabled:opacity-50">Download CSV</button>
      </div>
      <WhatsAppJobs />
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
