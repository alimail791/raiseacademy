import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Download, RefreshCw, X, TrendingUp, TrendingDown, MessageCircle, UserPlus } from "lucide-react";
import instituteApi from "../../api/instituteApi";

interface Weak { subject: string; chapter: string; wrong: number; }
interface Progress {
  joined: boolean; testsTotal?: number; tests7?: number; tests30?: number; avgPct30?: number | null; accuracy30?: number | null;
  latestMock?: { score: number; physics: number; chemistry: number; biology: number; date: string } | null;
  bestMock30?: number | null; mockTrend?: number | null; activeDays7?: number; practice7?: number; practiceTotal?: number;
  streak?: number; lastActive?: string | null; weakChapters?: Weak[];
}
interface Row { id: string; fullName: string; email: string; phone: string; currentClass?: string; parentEmail?: string; parentPhone?: string; progress: Progress; }
interface Summary { students: number; joined: number; notJoined: number; active7: number; inactive7: number; tests7: number; avgPct30: number | null; topWeakChapters: Weak[]; }
interface TestRow { title: string; date: string; score: number; total: number; pct: number; accuracy: number; physics: number; chemistry: number; biology: number; minutes: number; }
interface Detail { joined: boolean; classLevel?: string; targetScore?: number; streak?: number; longestStreak?: number; subjectAvg?: { physics: number | null; chemistry: number | null; biology: number | null; fullMocks: number }; tests?: TestRow[]; weakChapters?: Weak[]; }

type Filter = "all" | "attention" | "notstarted" | "top";
type Sort = "name" | "score" | "tests" | "recent";

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—");
const ago = (d?: string | null) => {
  if (!d) return "Never";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  return days <= 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;
};
const status = (p: Progress) => {
  if (!p.joined) return { label: "Not started", cls: "bg-ink/10 text-ink/60" };
  const d = p.activeDays7 || 0;
  if (d === 0) return { label: "Inactive", cls: "bg-red-100 text-red-700" };
  if (d <= 2) return { label: "Low", cls: "bg-amber-100 text-amber-800" };
  return { label: "Active", cls: "bg-rise/15 text-rise-dark" };
};
const waLink = (phone: string, name: string) => {
  const d = String(phone || "").replace(/\D/g, "");
  const num = d.length === 10 ? `91${d}` : d;
  const msg = `Hi ${name.split(" ")[0]}, this is from your NEET coaching. We noticed you haven't practised on YNeet this week. Please take today's quiz and one mock test at www.yneet.in/login – regular practice is the key to a good NEET score! 💪`;
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
};

const Tile = ({ label, value, sub, tone = "" }: { label: string; value: string | number; sub?: string; tone?: string }) => (
  <div className="bg-white rounded-2xl border border-ink/10 p-4">
    <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">{label}</p>
    <p className={`font-display text-2xl sm:text-3xl font-bold mt-1 ${tone}`}>{value}</p>
    {sub && <p className="text-xs text-ink/50 mt-0.5">{sub}</p>}
  </div>
);

const InstituteProgress = ({ onAddStudents }: { onAddStudents: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("score");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<Row | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const { data } = await instituteApi.get("/progress");
      setSummary(data.summary); setRows(data.students || []);
    } catch (err: any) { setError(err?.response?.data?.message || "Couldn't load progress."); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openStudent = async (r: Row) => {
    setOpen(r); setDetail(null);
    if (!r.progress.joined) { setDetail({ joined: false }); return; }
    try { const { data } = await instituteApi.get(`/progress/${r.id}`); setDetail(data.detail); }
    catch (err: any) { toast.error(err?.response?.data?.message || "Couldn't load details"); setOpen(null); }
  };

  const shareWithParent = async (r: Row) => {
    const win = window.open("", "_blank");
    try {
      const { data } = await instituteApi.get(`/students/${r.id}/parent-report`);
      const d = String(data.parentPhone || r.parentPhone || "").replace(/\D/g, "");
      const url = `https://wa.me/${d.length === 10 ? "91" + d : d}?text=${encodeURIComponent(data.text)}`;
      if (win) win.location.href = url; else window.location.href = url;
    } catch (err: any) { win?.close(); toast.error(err?.response?.data?.message || "Could not build the report"); }
  };

  const exportCsv = async () => {
    try {
      const r = await instituteApi.get("/progress.csv", { responseType: "blob" });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url; a.download = `student_progress_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch { toast.error("Export failed"); }
  };

  const shown = useMemo(() => {
    let list = rows.filter((r) => !search || `${r.fullName} ${r.email} ${r.phone}`.toLowerCase().includes(search.toLowerCase()));
    if (filter === "attention") list = list.filter((r) => r.progress.joined && (r.progress.activeDays7 || 0) <= 2);
    if (filter === "notstarted") list = list.filter((r) => !r.progress.joined || !r.progress.testsTotal);
    if (filter === "top") list = list.filter((r) => r.progress.avgPct30 != null).sort((a, b) => (b.progress.avgPct30 || 0) - (a.progress.avgPct30 || 0)).slice(0, 10);
    const key: Record<Sort, (r: Row) => number | string> = {
      name: (r) => r.fullName.toLowerCase(),
      score: (r) => -(r.progress.avgPct30 ?? -1),
      tests: (r) => -(r.progress.tests30 ?? -1),
      recent: (r) => -(r.progress.lastActive ? new Date(r.progress.lastActive).getTime() : 0),
    };
    if (filter !== "top") list = [...list].sort((a, b) => (key[sort](a) < key[sort](b) ? -1 : key[sort](a) > key[sort](b) ? 1 : 0));
    return list;
  }, [rows, filter, sort, search]);

  if (loading) return <div className="py-16 flex justify-center"><div className="h-8 w-8 border-4 border-gold border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return (
    <div className="bg-white rounded-2xl border border-ink/10 p-6 text-center">
      <p className="text-ink/70">{error}</p>
      <button onClick={load} className="mt-3 inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-full border border-ink/15"><RefreshCw size={15} /> Try again</button>
    </div>
  );
  if (!rows.length || !summary) return (
    <div className="bg-white rounded-2xl border border-ink/10 p-8 text-center">
      <p className="font-semibold">No students yet</p>
      <p className="text-sm text-ink/60 mt-1">Add your students and their test scores, practice and weak chapters will show up here.</p>
      <button onClick={onAddStudents} className="mt-4 inline-flex items-center gap-1.5 bg-gold text-ink font-semibold px-5 py-2 rounded-full"><UserPlus size={16} /> Add students</button>
    </div>
  );

  const attention = rows.filter((r) => r.progress.joined && (r.progress.activeDays7 || 0) <= 2).length;
  const notStarted = rows.filter((r) => !r.progress.joined || !r.progress.testsTotal).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label="Active this week" value={`${summary.active7}/${summary.students}`} sub="practised on 1+ day" tone="text-rise-dark" />
        <Tile label="Tests this week" value={summary.tests7} sub="by all students" />
        <Tile label="Average score" value={summary.avgPct30 != null ? `${summary.avgPct30}%` : "—"} sub="last 30 days" />
        <Tile label="Need attention" value={summary.inactive7 + summary.notJoined} sub={`${summary.inactive7} inactive · ${summary.notJoined} not started`} tone={summary.inactive7 + summary.notJoined ? "text-red-700" : ""} />
      </div>

      {summary.topWeakChapters.length > 0 && (
        <div className="bg-white rounded-2xl border border-ink/10 p-5">
          <h3 className="font-semibold">Weakest chapters across your students <span className="text-ink/50 font-normal text-sm">(last 30 days)</span></h3>
          <p className="text-sm text-ink/60">Most wrong answers in YNeet tests. Good topics to revise in class.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {summary.topWeakChapters.map((w, i) => (
              <span key={i} className="text-sm px-3 py-1.5 rounded-full bg-red-50 text-red-800 border border-red-100">
                {w.chapter} <span className="text-red-800/60">· {w.subject} · {w.wrong} wrong</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-ink/10">
        <div className="p-4 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {([["all", `All (${rows.length})`], ["attention", `Need attention (${attention})`], ["notstarted", `No tests yet (${notStarted})`], ["top", "Top 10"]] as const).map(([k, label]) => (
              <button key={k} onClick={() => setFilter(k)} className={`text-sm px-3 py-1.5 rounded-full border ${filter === k ? "bg-ink text-paper border-ink" : "border-ink/15 hover:bg-ink/5"}`}>{label}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-1.5 text-sm w-36 focus:border-gold outline-none" />
            {filter !== "top" && (
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-lg border border-ink/15 px-2 py-1.5 text-sm bg-white">
                <option value="score">Sort: score</option><option value="tests">Sort: tests</option><option value="recent">Sort: last active</option><option value="name">Sort: name</option>
              </select>
            )}
            <button onClick={load} title="Refresh" className="p-2 rounded-lg border border-ink/15 hover:bg-ink/5"><RefreshCw size={15} /></button>
            <button onClick={exportCsv} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-ink text-paper"><Download size={15} /> Excel/CSV</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-ink/5 text-left text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-2.5">Student</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5 hidden sm:table-cell">Days active (7d)</th>
                <th className="px-3 py-2.5 hidden md:table-cell">Tests 7d / 30d</th><th className="px-3 py-2.5">Avg score</th><th className="px-3 py-2.5">Latest mock</th>
                <th className="px-3 py-2.5 hidden sm:table-cell">Last active</th><th className="px-3 py-2.5 hidden lg:table-cell">Weak chapters</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-ink/50">No students match.</td></tr>}
              {shown.map((r) => {
                const p = r.progress, st = status(p), d7 = p.activeDays7 || 0;
                return (
                  <tr key={r.id} onClick={() => openStudent(r)} className="border-t border-ink/5 hover:bg-gold-light/30 cursor-pointer">
                    <td className="px-4 py-2.5"><div className="font-medium">{r.fullName}</div><div className="text-xs text-ink/50">{r.currentClass ? (r.currentClass === "Dropper" ? "Dropper" : `Class ${r.currentClass}`) : ""}</div></td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                      {st.label !== "Active" && r.phone && (
                        <a href={waLink(r.phone, r.fullName)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} title="Remind on WhatsApp"
                          className="mt-1 flex w-fit items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#25D366] text-white"><MessageCircle size={12} /> Remind</a>
                      )}
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell">
                      <div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-ink/10 rounded-full overflow-hidden"><div className="h-full bg-rise" style={{ width: `${(d7 / 7) * 100}%` }} /></div><span>{p.joined ? `${d7}/7` : "—"}</span></div>
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell">{p.joined ? `${p.tests7} / ${p.tests30}` : "—"}</td>
                    <td className="px-3 py-2.5 font-semibold">{p.avgPct30 != null ? `${p.avgPct30}%` : "—"}</td>
                    <td className="px-3 py-2.5">
                      {p.latestMock ? (
                        <span className="inline-flex items-center gap-1">{p.latestMock.score}<span className="text-ink/40">/720</span>
                          {p.mockTrend != null && p.mockTrend !== 0 && (p.mockTrend > 0
                            ? <span className="text-rise-dark text-xs inline-flex items-center"><TrendingUp size={13} />+{p.mockTrend}</span>
                            : <span className="text-red-700 text-xs inline-flex items-center"><TrendingDown size={13} />{p.mockTrend}</span>)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell">{p.joined ? ago(p.lastActive) : "Never logged in"}</td>
                    <td className="px-3 py-2.5 hidden lg:table-cell text-xs text-ink/70 max-w-[220px] truncate">{(p.weakChapters || []).slice(0, 2).map((w) => w.chapter).join(", ") || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-3 text-xs text-ink/50 border-t border-ink/5">Tap a student for full test history, weak chapters and subject scores. "Active" = practised on 3+ of the last 7 days.</p>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex justify-end" onClick={() => setOpen(null)}>
          <div className="w-full max-w-xl h-full bg-paper overflow-y-auto p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-xl font-bold">{open.fullName}</h3>
                <p className="text-sm text-ink/60">{open.email} · {open.phone}</p>
                <p className="text-xs text-ink/50 mt-1">
                  Parent: {open.parentEmail || open.parentPhone ? [open.parentEmail, open.parentPhone].filter(Boolean).join(" · ") + " — weekly report on" : "not added (add in Manage students)"}
                </p>
                <button onClick={() => shareWithParent(open)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#25D366] text-white">
                  <MessageCircle size={13} /> {open.parentPhone ? "Send this week's report to parent" : "Share this week's report on WhatsApp"}
                </button>
              </div>
              <button onClick={() => setOpen(null)} className="p-2 rounded-lg hover:bg-ink/5"><X size={18} /></button>
            </div>

            {!detail && <div className="py-12 flex justify-center"><div className="h-7 w-7 border-4 border-gold border-t-transparent rounded-full animate-spin" /></div>}
            {detail && !detail.joined && (
              <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
                {open.fullName.split(" ")[0]} hasn't opened YNeet yet. Their login was emailed when you added them; you can resend it from Manage students, or remind them on WhatsApp.
                {open.phone && <a href={waLink(open.phone, open.fullName)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#25D366] text-white"><MessageCircle size={14} /> Remind on WhatsApp</a>}
              </div>
            )}
            {detail?.joined && (
              <div className="mt-5 space-y-5">
                <div className="grid grid-cols-3 gap-2">
                  <Tile label="Days active (7d)" value={`${open.progress.activeDays7}/7`} />
                  <Tile label="Total tests" value={open.progress.testsTotal ?? 0} />
                  <Tile label="Practice Qs" value={open.progress.practiceTotal ?? 0} />
                </div>
                {detail.subjectAvg && detail.subjectAvg.fullMocks > 0 && (
                  <div className="bg-white rounded-2xl border border-ink/10 p-4">
                    <p className="font-semibold text-sm">Average in full mocks <span className="text-ink/50 font-normal">({detail.subjectAvg.fullMocks} mocks)</span></p>
                    {([["Physics", detail.subjectAvg.physics], ["Chemistry", detail.subjectAvg.chemistry], ["Biology", detail.subjectAvg.biology]] as const).map(([name, v]) => {
                      const max = name === "Biology" ? 360 : 180;
                      return (
                        <div key={name} className="mt-3">
                          <div className="flex justify-between text-sm"><span>{name}</span><span className="font-semibold">{v ?? 0}<span className="text-ink/40">/{max}</span></span></div>
                          <div className="mt-1 h-2 bg-ink/10 rounded-full overflow-hidden"><div className="h-full bg-gold" style={{ width: `${Math.max(0, Math.min(100, ((v || 0) / max) * 100))}%` }} /></div>
                        </div>
                      );
                    })}
                    {detail.targetScore ? <p className="text-xs text-ink/50 mt-3">Student's target: {detail.targetScore}/720</p> : null}
                  </div>
                )}
                {detail.weakChapters && detail.weakChapters.length > 0 && (
                  <div className="bg-white rounded-2xl border border-ink/10 p-4">
                    <p className="font-semibold text-sm">Weak chapters <span className="text-ink/50 font-normal">(last 90 days)</span></p>
                    <ul className="mt-2 text-sm space-y-1">
                      {detail.weakChapters.map((w, i) => <li key={i} className="flex justify-between"><span>{w.chapter} <span className="text-ink/50">· {w.subject}</span></span><span className="text-red-700">{w.wrong} wrong</span></li>)}
                    </ul>
                  </div>
                )}
                <div className="bg-white rounded-2xl border border-ink/10">
                  <p className="font-semibold text-sm p-4 pb-2">Recent tests</p>
                  {(!detail.tests || !detail.tests.length) ? <p className="px-4 pb-4 text-sm text-ink/50">No tests taken yet.</p> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm whitespace-nowrap">
                        <thead className="bg-ink/5 text-left text-xs text-ink/60"><tr><th className="px-4 py-2">Date</th><th className="px-3 py-2">Test</th><th className="px-3 py-2">Score</th><th className="px-3 py-2">P · C · B</th><th className="px-3 py-2">Accuracy</th></tr></thead>
                        <tbody>
                          {detail.tests.map((t, i) => (
                            <tr key={i} className="border-t border-ink/5">
                              <td className="px-4 py-2">{fmtDate(t.date)}</td>
                              <td className="px-3 py-2 max-w-[180px] truncate">{t.title}</td>
                              <td className="px-3 py-2 font-semibold">{t.score}<span className="text-ink/40 font-normal">/{t.total}</span></td>
                              <td className="px-3 py-2 text-ink/70">{t.total >= 600 ? `${t.physics} · ${t.chemistry} · ${t.biology}` : "—"}</td>
                              <td className="px-3 py-2">{t.accuracy}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstituteProgress;
