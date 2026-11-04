import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { RefreshCw, MessageCircle, Copy, Lightbulb, UserPlus, EyeOff, TrendingUp, TrendingDown, BellRing } from "lucide-react";
import instituteApi from "../../api/instituteApi";

type Status = "critical" | "needs_work" | "satisfactory" | "strong" | null;
interface Topic { topic: string; answered: number; accuracy: number; status: Status; }
interface Chapter {
  subject: string; chapter: string; answered: number; students: number; accuracy: number; prevAccuracy: number | null; change: number | null;
  skippedPct: number | null; avgTimeSec: number | null; status: Status; weakestTopic: Topic | null; topics: Topic[];
}
interface Rec { priority: string; subject?: string; chapter?: string; title: string; body: string; steps: string[]; next: { subject: string; chapter: string; accuracy: number }[]; }
interface GridStudent { userId: string; name: string; accuracy: number | null; answered: number; cells: (number | null)[]; }
interface Change { subject: string; chapter: string; before: number; after: number; change: number; }
interface Insights {
  empty?: boolean; enough?: boolean; text?: string;
  summary: { days: number; students: number; testedStudents: number; participationPct: number | null; answers: number; accuracy: number | null; criticalChapters: number; fullMockStudents: number; needsSupport: number };
  recommendation: Rec | null; chapters: Chapter[]; subjects: { subject: string; answered: number; accuracy: number; status: Status }[];
  grid: { chapters: { subject: string; chapter: string }[]; students: GridStudent[] };
  distribution: { band: string; count: number }[]; readiness: { key: string; label: string; count: number }[];
  revision: { improved: Change[]; declined: Change[] };
}

// Orange → blue scale: readable for colour-blind teachers, and the steps differ in lightness too.
const STATUS: Record<string, { label: string; pill: string; bar: string; cell: string; cellText: string }> = {
  critical: { label: "Critical", pill: "bg-orange-100 text-orange-900", bar: "#C2410C", cell: "#F7B58C", cellText: "#4A1804" },
  needs_work: { label: "Needs work", pill: "bg-amber-100 text-amber-900", bar: "#D97706", cell: "#FCE3A6", cellText: "#4A3000" },
  satisfactory: { label: "Satisfactory", pill: "bg-sky-100 text-sky-900", bar: "#3B82F6", cell: "#BFD7F5", cellText: "#0F2F5A" },
  strong: { label: "Strong", pill: "bg-ink text-white", bar: "#14213D", cell: "#2F5DA8", cellText: "#FFFFFF" },
};
const statusOf = (a: number | null): Status => (a == null ? null : a < 40 ? "critical" : a < 60 ? "needs_work" : a < 75 ? "satisfactory" : "strong");
const READY_COLORS: Record<string, string> = { strong: "#14213D", good: "#3B82F6", moderate: "#F2C14E", support: "#C2410C" };

const Pill = ({ s }: { s: Status }) => (s ? <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS[s].pill}`}>{STATUS[s].label}</span> : null);
const Bar = ({ value, status, h = "h-2" }: { value: number; status: Status; h?: string }) => (
  <div className={`${h} bg-ink/10 rounded-full overflow-hidden`}><div className="h-full rounded-full" style={{ width: `${Math.max(2, value)}%`, background: status ? STATUS[status].bar : "#94a3b8" }} /></div>
);
const Tile = ({ label, value, sub, tone = "" }: { label: string; value: string | number; sub?: string; tone?: string }) => (
  <div className="bg-white rounded-2xl border border-ink/10 p-4">
    <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">{label}</p>
    <p className={`font-display text-2xl sm:text-3xl font-bold mt-1 ${tone}`}>{value}</p>
    {sub && <p className="text-xs text-ink/50 mt-0.5">{sub}</p>}
  </div>
);
const Delta = ({ v }: { v: number | null }) =>
  v == null ? <span className="text-ink/40">—</span>
    : v > 0 ? <span className="inline-flex items-center gap-0.5 text-sky-800 font-semibold"><TrendingUp size={13} />+{v}</span>
    : v < 0 ? <span className="inline-flex items-center gap-0.5 text-orange-800 font-semibold"><TrendingDown size={13} />{v}</span>
    : <span className="text-ink/50">0</span>;

// Same rule as the server, for a single subject.
const recommendFor = (list: Chapter[]): Rec | null => {
  const pool = list.filter((c) => c.status === "critical" || c.status === "needs_work");
  if (!pool.length) return list.length ? { priority: "low", title: "No chapter here is below 60%", body: "Keep these chapters in weekly mixed tests so they stay strong.", steps: [], next: [] } : null;
  const w = pool[0], t = w.weakestTopic;
  return {
    priority: w.status === "critical" ? "high" : "medium", subject: w.subject, chapter: w.chapter,
    title: `${w.chapter} needs attention first`,
    body: `Batch accuracy is ${w.accuracy}% across ${w.students} student${w.students === 1 ? "" : "s"}.` + (t ? ` Most marks are lost on ${t.topic} (${t.accuracy}%).` : ""),
    steps: [t ? `Run a 45-minute concept class on ${t.topic}.` : `Run a 45-minute revision class on ${w.chapter}.`, `Ask students to take the ${w.chapter} chapter test and practise 20 more questions on YNeet.`, "Check this page again in 7 days to see if accuracy moved."],
    next: pool.slice(1, 3).map((c) => ({ subject: c.subject, chapter: c.chapter, accuracy: c.accuracy })),
  };
};

// Monday 8 am WhatsApp summary to the institute's own number.
const WeeklyWhatsApp = () => {
  const [st, setSt] = useState<{ enabled: boolean; phone: string; available: boolean; lastSent: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { instituteApi.get("/insights/weekly").then(({ data }) => setSt(data)).catch(() => {}); }, []);
  if (!st || !st.available) return null;
  const toggle = async () => {
    setBusy(true);
    try { const { data } = await instituteApi.put("/insights/weekly", { enabled: !st.enabled }); setSt({ ...st, enabled: data.enabled }); toast.success(data.enabled ? "Weekly WhatsApp report turned on" : "Weekly WhatsApp report turned off"); }
    catch { toast.error("Couldn't save"); }
    setBusy(false);
  };
  const sendNow = async () => {
    setBusy(true);
    try { const { data } = await instituteApi.post("/insights/weekly/send"); setSt({ ...st, lastSent: new Date().toISOString() }); toast.success(`Sent to ${data.sentTo} on WhatsApp`); }
    catch (err: any) { toast.error(err?.response?.data?.message || "Couldn't send"); }
    setBusy(false);
  };
  return (
    <div className="bg-white rounded-2xl border border-ink/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <BellRing size={18} className="mt-0.5 text-rise-dark flex-none" />
        <div className="text-sm">
          <p className="font-semibold">Weekly report on WhatsApp</p>
          <p className="text-ink/60">
            {!st.phone ? "Add your mobile number to your institute profile to get it." : st.enabled ? `Every Monday 8 am to ${st.phone}: participation, accuracy, chapters to fix and this week's plan.` : "Turned off."}
            {st.lastSent && <span className="text-ink/45"> · Last sent {new Date(st.lastSent).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
          </p>
        </div>
      </div>
      {st.phone && (
        <div className="flex gap-2">
          {st.enabled && <button disabled={busy} onClick={sendNow} className="text-sm px-3 py-2 rounded-lg border border-ink/15 disabled:opacity-50">Send this week's now</button>}
          <button disabled={busy} onClick={toggle} aria-pressed={st.enabled} className={`text-sm font-semibold px-3 py-2 rounded-lg disabled:opacity-50 ${st.enabled ? "border border-ink/15" : "bg-ink text-paper"}`}>{st.enabled ? "Turn off" : "Turn on"}</button>
        </div>
      )}
    </div>
  );
};

const InstituteInsights = ({ onAddStudents }: { onAddStudents: () => void }) => {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<Insights | null>(null);
  const [subject, setSubject] = useState("All");
  const [selKey, setSelKey] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [hideNames, setHideNames] = useState(false);
  const [onlyWeak, setOnlyWeak] = useState(false);

  const load = async (d = days) => {
    setLoading(true); setError("");
    try { const { data } = await instituteApi.get(`/insights?days=${d}`); setData(data); }
    catch (err: any) { setError(err?.response?.data?.message || "Couldn't load insights."); }
    setLoading(false);
  };
  useEffect(() => { load(days); }, [days]);

  const chapters = useMemo(() => (data?.chapters || []).filter((c) => subject === "All" || c.subject === subject), [data, subject]);
  const rec = subject === "All" ? data?.recommendation || null : recommendFor(chapters);
  const sel = chapters.find((c) => `${c.subject}|${c.chapter}` === selKey) || chapters[0];

  const grid = useMemo(() => {
    if (!data) return { cols: [] as { idx: number; chapter: string; subject: string }[], rows: [] as (GridStudent & { colAvg: number | null })[] };
    const order = new Map(chapters.map((c, i) => [`${c.subject}|${c.chapter}`, i]));
    const cols = data.grid.chapters
      .map((c, idx) => ({ ...c, idx, rank: order.get(`${c.subject}|${c.chapter}`) }))
      .filter((c) => c.rank !== undefined)
      .sort((a, b) => (a.rank as number) - (b.rank as number))
      .slice(0, 6);
    let rows = data.grid.students.map((s) => {
      const vals = cols.map((c) => s.cells[c.idx]).filter((v): v is number => v != null);
      return { ...s, colAvg: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null };
    });
    if (onlyWeak) rows = rows.filter((r) => r.colAvg != null && r.colAvg < 45);
    rows.sort((a, b) => (a.colAvg ?? 101) - (b.colAvg ?? 101));
    return { cols, rows };
  }, [data, chapters, onlyWeak]);

  const share = () => { if (data?.text) window.open(`https://wa.me/?text=${encodeURIComponent(data.text)}`, "_blank"); };
  const copy = async () => { try { await navigator.clipboard.writeText(data?.text || ""); toast.success("Summary copied"); } catch { toast.error("Couldn't copy"); } };

  if (loading) return <div className="py-16 flex justify-center"><div className="h-8 w-8 border-4 border-gold border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return (
    <div className="bg-white rounded-2xl border border-ink/10 p-6 text-center">
      <p className="text-ink/70">{error}</p>
      <button onClick={() => load()} className="mt-3 inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-full border border-ink/15"><RefreshCw size={15} /> Try again</button>
    </div>
  );
  if (!data || data.empty) return (
    <div className="bg-white rounded-2xl border border-ink/10 p-8 text-center">
      <p className="font-semibold">No students yet</p>
      <p className="text-sm text-ink/60 mt-1">Add your students. Once they take YNeet tests, chapter gaps and teaching suggestions appear here.</p>
      <button onClick={onAddStudents} className="mt-4 inline-flex items-center gap-1.5 bg-gold text-ink font-semibold px-5 py-2 rounded-full"><UserPlus size={16} /> Add students</button>
    </div>
  );

  const s = data.summary;
  const subjAcc = subject === "All" ? s.accuracy : data.subjects.find((x) => x.subject === subject)?.accuracy ?? null;
  const shownChapters = showAll ? chapters : chapters.slice(0, 10);
  const maxBand = Math.max(1, ...data.distribution.map((d) => d.count));
  const readyTotal = data.readiness.reduce((n, r) => n + r.count, 0);

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Subject">
          {["All", ...data.subjects.map((x) => x.subject).sort()].map((k) => (
            <button key={k} onClick={() => { setSubject(k); setSelKey(null); setShowAll(false); }} aria-pressed={subject === k}
              className={`text-sm px-3.5 py-2 rounded-full border font-semibold ${subject === k ? "bg-ink text-paper border-ink" : "bg-white border-ink/15 hover:bg-ink/5"}`}>
              {k === "All" ? "All subjects" : k}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-sm text-ink/60 flex items-center gap-1.5">Period
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-lg border border-ink/15 px-2 py-2 text-sm bg-white text-ink">
              <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
            </select>
          </label>
          <button onClick={() => load()} title="Refresh" aria-label="Refresh" className="p-2.5 rounded-lg border border-ink/15 bg-white hover:bg-ink/5"><RefreshCw size={15} /></button>
          <button onClick={copy} className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-ink/15 bg-white"><Copy size={15} /> Copy summary</button>
          <button onClick={share} className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg bg-[#25D366] text-white"><MessageCircle size={15} /> Share on WhatsApp</button>
        </div>
      </div>

      <WeeklyWhatsApp />

      {!data.enough ? (
        <div className="bg-white rounded-2xl border border-ink/10 p-8 text-center">
          <p className="font-semibold">Not enough test data yet</p>
          <p className="text-sm text-ink/60 mt-1">Insights appear once your students answer YNeet test questions in this period. Try "Last 90 days", or ask students to take a chapter test.</p>
        </div>
      ) : (<>
        {/* Recommendation */}
        {rec && (
          <div className="bg-white rounded-2xl border border-ink/10 p-5 sm:p-6 grid lg:grid-cols-[1fr_380px] gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-full ${rec.priority === "high" ? "bg-orange-100 text-orange-900" : rec.priority === "medium" ? "bg-amber-100 text-amber-900" : "bg-sky-100 text-sky-900"}`}>
                  {rec.priority === "low" ? "LOOKING GOOD" : "PRIORITY THIS WEEK"}
                </span>
                <span className="text-xs text-ink/50">Suggestion from {s.testedStudents} students' test answers · last {s.days} days</span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold mt-2">{rec.title}</h3>
              <p className="text-sm sm:text-[15px] text-ink/75 mt-1.5 leading-relaxed">{rec.body}</p>
              {rec.next.length > 0 && <p className="text-sm text-ink/55 mt-2">Next in line: {rec.next.map((n) => `${n.chapter} (${n.accuracy}%)`).join(", ")}</p>}
            </div>
            {rec.steps.length > 0 && (
              <div className="bg-ink/[0.03] rounded-xl p-4">
                <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide flex items-center gap-1.5"><Lightbulb size={14} /> Suggested plan</p>
                <ol className="mt-3 space-y-3">
                  {rec.steps.map((st, i) => (
                    <li key={i} className="flex gap-3 text-sm"><span className="flex-none h-6 w-6 rounded-full bg-ink text-white text-xs font-bold flex items-center justify-center">{i + 1}</span><span>{st}</span></li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Key numbers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Tile label="Took tests" value={`${s.testedStudents}/${s.students}`} sub={`${s.participationPct ?? 0}% participation`} />
          <Tile label="Accuracy" value={subjAcc != null ? `${subjAcc}%` : "—"} sub={subject === "All" ? "all answered questions" : subject} />
          <Tile label="Critical chapters" value={chapters.filter((c) => c.status === "critical").length} sub="below 40% accuracy" tone={chapters.some((c) => c.status === "critical") ? "text-orange-800" : ""} />
          <Tile label="Need support" value={s.needsSupport} sub="students below 45%" tone={s.needsSupport ? "text-orange-800" : ""} />
        </div>

        {/* Chapter gaps + concept breakdown */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
          <div className="bg-white rounded-2xl border border-ink/10">
            <div className="p-4 sm:p-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">Chapter learning gaps</h3>
                <p className="text-sm text-ink/60">Weakest first. Tap a chapter to see which topics cause it.</p>
              </div>
              <div className="flex flex-wrap gap-1.5">{(["critical", "needs_work", "satisfactory", "strong"] as const).map((k) => (
                <span key={k} className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS[k].pill}`}>{STATUS[k].label} {k === "critical" ? "<40" : k === "needs_work" ? "40–60" : k === "satisfactory" ? "60–75" : "75+"}</span>
              ))}</div>
            </div>
            {chapters.length === 0 ? <p className="px-5 pb-5 text-sm text-ink/50">No chapter has enough answers yet in this period.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm whitespace-nowrap">
                  <thead className="bg-ink/5 text-left text-xs uppercase tracking-wide text-ink/60">
                    <tr><th className="px-4 py-2.5">Chapter</th><th className="px-3 py-2.5 min-w-[150px]">Accuracy</th><th className="px-3 py-2.5">vs before</th><th className="px-3 py-2.5 hidden md:table-cell">Students</th><th className="px-3 py-2.5 hidden md:table-cell">Time / Q</th><th className="px-3 py-2.5 hidden lg:table-cell">Weakest topic</th><th className="px-3 py-2.5">Status</th></tr>
                  </thead>
                  <tbody>
                    {shownChapters.map((c) => {
                      const k = `${c.subject}|${c.chapter}`, on = sel && k === `${sel.subject}|${sel.chapter}`;
                      return (
                        <tr key={k} onClick={() => setSelKey(k)} className={`border-t border-ink/5 cursor-pointer ${on ? "bg-gold-light/40" : "hover:bg-ink/[0.03]"}`}>
                          <td className="px-4 py-2.5">
                            <button className="text-left font-medium hover:underline" aria-pressed={!!on} onClick={(e) => { e.stopPropagation(); setSelKey(k); }}>{c.chapter}</button>
                            <div className="text-xs text-ink/50">{c.subject}</div>
                          </td>
                          <td className="px-3 py-2.5"><div className="flex items-center gap-2"><div className="flex-1"><Bar value={c.accuracy} status={c.status} /></div><span className="font-semibold w-10 text-right">{c.accuracy}%</span></div></td>
                          <td className="px-3 py-2.5"><Delta v={c.change} /></td>
                          <td className="px-3 py-2.5 hidden md:table-cell">{c.students}</td>
                          <td className="px-3 py-2.5 hidden md:table-cell text-ink/70">{c.avgTimeSec != null ? `${c.avgTimeSec}s` : "—"}</td>
                          <td className="px-3 py-2.5 hidden lg:table-cell text-ink/70 max-w-[220px] truncate">{c.weakestTopic ? `${c.weakestTopic.topic} (${c.weakestTopic.accuracy}%)` : "—"}</td>
                          <td className="px-3 py-2.5"><Pill s={c.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {chapters.length > 10 && (
              <div className="px-4 py-3 border-t border-ink/5">
                <button onClick={() => setShowAll(!showAll)} className="text-sm font-semibold px-3 py-2 rounded-lg border border-ink/15">{showAll ? "Show weakest 10 only" : `Show all ${chapters.length} chapters`}</button>
              </div>
            )}
          </div>

          {sel && (
            <div className="bg-white rounded-2xl border border-ink/10 p-5 space-y-4 lg:sticky lg:top-4">
              <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Topic breakdown</p>
              <div className="flex items-start justify-between gap-2">
                <div><h3 className="font-display text-lg font-bold leading-snug">{sel.chapter}</h3><p className="text-xs text-ink/50">{sel.subject}</p></div>
                <Pill s={sel.status} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-ink/[0.04] p-2"><p className="text-[11px] text-ink/50">Accuracy</p><p className="font-bold text-lg">{sel.accuracy}%</p></div>
                <div className="rounded-xl bg-ink/[0.04] p-2"><p className="text-[11px] text-ink/50">Before</p><p className="font-bold text-lg">{sel.prevAccuracy != null ? `${sel.prevAccuracy}%` : "—"}</p></div>
                <div className="rounded-xl bg-ink/[0.04] p-2"><p className="text-[11px] text-ink/50">Skipped</p><p className="font-bold text-lg">{sel.skippedPct ?? 0}%</p></div>
              </div>
              {sel.topics.length === 0 ? <p className="text-sm text-ink/50">Not enough answers per topic yet.</p> : (
                <div className="space-y-3">
                  {sel.topics.map((t) => (
                    <div key={t.topic}>
                      <div className="flex justify-between text-sm gap-2"><span className="truncate">{t.topic}</span><span className="font-semibold">{t.accuracy}%</span></div>
                      <div className="mt-1"><Bar value={t.accuracy} status={t.status} /></div>
                      <p className="text-[11px] text-ink/40 mt-0.5">{t.answered} answers</p>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm rounded-xl bg-gold-light/50 p-3 text-ink/80">
                {sel.weakestTopic && sel.weakestTopic.accuracy < 60
                  ? `Focus on ${sel.weakestTopic.topic}. A short concept class followed by 15–20 targeted questions usually lifts this fastest.`
                  : "This chapter is in good shape. Keep it in weekly mixed tests so it stays strong."}
              </p>
            </div>
          )}
        </div>

        {/* Student × chapter grid */}
        {grid.cols.length > 0 && (
          <div className="bg-white rounded-2xl border border-ink/10">
            <div className="p-4 sm:p-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">Student × chapter accuracy</h3>
                <p className="text-sm text-ink/60">Your students on the {grid.cols.length} weakest chapters{subject === "All" ? "" : ` in ${subject}`}. Weakest students first.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setOnlyWeak(!onlyWeak)} aria-pressed={onlyWeak} className={`text-sm px-3 py-2 rounded-lg border font-semibold ${onlyWeak ? "bg-ink text-paper border-ink" : "border-ink/15"}`}>Only students below 45%</button>
                <button onClick={() => setHideNames(!hideNames)} aria-pressed={hideNames} className={`inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border font-semibold ${hideNames ? "bg-ink text-paper border-ink" : "border-ink/15"}`}><EyeOff size={15} /> Hide names (projector)</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="text-sm whitespace-nowrap">
                <thead className="text-xs text-ink/60">
                  <tr><th className="px-4 py-2 text-left">Student</th>{grid.cols.map((c) => <th key={c.idx} className="px-1 py-2 font-semibold text-center max-w-[110px] truncate" title={`${c.chapter} · ${c.subject}`}>{c.chapter.length > 16 ? c.chapter.slice(0, 15) + "…" : c.chapter}</th>)}<th className="px-2 py-2 text-center">Avg</th></tr>
                </thead>
                <tbody>
                  {grid.rows.length === 0 && <tr><td colSpan={grid.cols.length + 2} className="px-4 py-6 text-center text-ink/50">No students match.</td></tr>}
                  {grid.rows.map((r, i) => (
                    <tr key={r.userId}>
                      <td className="px-4 py-1 font-medium">{hideNames ? `Student ${String(i + 1).padStart(2, "0")}` : r.name}</td>
                      {grid.cols.map((c) => {
                        const v = r.cells[c.idx], st = statusOf(v);
                        return <td key={c.idx} className="px-1 py-1"><div className="min-w-[64px] text-center rounded-md py-2 text-xs font-bold" style={st ? { background: STATUS[st].cell, color: STATUS[st].cellText } : { background: "#F1F3F7", color: "#8A94A6" }}>{v != null ? `${v}%` : "—"}</div></td>;
                      })}
                      <td className="px-2 py-1"><div className="min-w-[56px] text-center rounded-md py-2 text-xs font-bold ring-2 ring-inset ring-ink/70" style={statusOf(r.colAvg) ? { background: STATUS[statusOf(r.colAvg)!].cell, color: STATUS[statusOf(r.colAvg)!].cellText } : {}}>{r.colAvg != null ? `${r.colAvg}%` : "—"}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-4 py-3 text-xs text-ink/50 border-t border-ink/5">"—" means fewer than 3 answers in that chapter this period.</p>
          </div>
        )}

        {/* Distribution · readiness · revision */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border border-ink/10 p-5">
            <h3 className="font-semibold">Full-mock score distribution</h3>
            <p className="text-sm text-ink/60">Latest full mock per student · out of 720</p>
            {s.fullMockStudents === 0 ? <p className="text-sm text-ink/50 mt-4">No full mocks taken in this period.</p> : (<>
              <div className="flex items-end gap-1.5 h-40 mt-4 border-b border-ink/10">
                {data.distribution.map((d) => (
                  <div key={d.band} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                    <span className="text-xs font-semibold">{d.count || ""}</span>
                    <div className="w-full rounded-t-md" style={{ height: `${(d.count / maxBand) * 120}px`, background: d.count === maxBand ? "#14213D" : "#9CB3D9" }} />
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5 mt-1">{data.distribution.map((d) => <span key={d.band} className="flex-1 text-center text-[10px] text-ink/50">{d.band}</span>)}</div>
            </>)}
          </div>

          <div className="bg-white rounded-2xl border border-ink/10 p-5">
            <h3 className="font-semibold">NEET readiness</h3>
            <p className="text-sm text-ink/60">By latest full-mock score</p>
            {readyTotal === 0 ? <p className="text-sm text-ink/50 mt-4">No full mocks taken in this period.</p> : (<>
              <div className="flex h-5 rounded-md overflow-hidden mt-4">{data.readiness.map((r) => r.count ? <div key={r.key} style={{ width: `${(r.count / readyTotal) * 100}%`, background: READY_COLORS[r.key] }} /> : null)}</div>
              <ul className="mt-4 space-y-2 text-sm">
                {data.readiness.map((r) => (
                  <li key={r.key} className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm flex-none" style={{ background: READY_COLORS[r.key] }} /><span className="flex-1">{r.label}</span><span className="font-semibold">{r.count}</span><span className="text-ink/50 w-10 text-right">{Math.round((r.count / readyTotal) * 100)}%</span></li>
                ))}
              </ul>
              <p className="text-xs text-ink/50 mt-3">{s.students - s.fullMockStudents} students didn't take a full mock in this period.</p>
            </>)}
          </div>

          <div className="bg-white rounded-2xl border border-ink/10 p-5">
            <h3 className="font-semibold">Did revision work?</h3>
            <p className="text-sm text-ink/60">Same chapters, last {s.days} days vs the {s.days} days before</p>
            {data.revision.improved.length + data.revision.declined.length === 0 ? <p className="text-sm text-ink/50 mt-4">Needs tests in both periods to compare.</p> : (
              <div className="mt-4 space-y-3">
                {[...data.revision.improved.slice(0, 3), ...data.revision.declined.slice(0, 2)].map((c) => (
                  <div key={`${c.subject}|${c.chapter}`}>
                    <div className="flex justify-between text-sm gap-2"><span className="font-medium truncate">{c.chapter}</span><Delta v={c.change} /></div>
                    <div className="relative h-2.5 bg-ink/10 rounded-full mt-1">
                      <div className="absolute inset-y-0 left-0 rounded-full bg-ink/25" style={{ width: `${c.before}%` }} />
                      <div className="absolute left-0 top-[3px] h-1 rounded-full" style={{ width: `${c.after}%`, background: c.change >= 0 ? "#2F5DA8" : "#C2410C" }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-ink/50 mt-0.5"><span>Before {c.before}%</span><span>Now {c.after}%</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-ink/50">Based on answered questions in YNeet tests. A chapter shows once it has 10+ answers in the period. Status: below 40% critical · 40–60 needs work · 60–75 satisfactory · 75+ strong.</p>
      </>)}
    </div>
  );
};

export default InstituteInsights;
