import { useEffect, useState } from "react";
import api from "../../api/axios";

// Admin dashboard: new accounts by where they came from (channel), which button
// they used (place) and sign-up method. Recorded from 19 Nov 2026
// (backend/utils/signupSource.js); older accounts show as "Not recorded".

type Row = { name: string; count: number };
type Latest = { _id: string; fullName: string; currentClass?: string; createdAt: string; signup?: { channel?: string; place?: string; method?: string; landing?: string } };
type Report = { days: number; total: number; byChannel: Row[]; byPlace: Row[]; byMethod: Row[]; byDay: Row[]; latest: Latest[] };

const PLACE_NAMES: Record<string, string> = {
  question_page_gate: "Question page: after 3 free answers",
  question_answer: "Question page: under the answer",
  question_page: "Question page: bottom box",
  question_page_bar: "Question page: phone bar",
  practice_chapter_sheet: "Chapter practice: pop-up",
  register_page: "Register page (direct)",
  login_page: "Login page",
  institute_bulk: "Added by an institute",
};
const nice = (p: string) => PLACE_NAMES[p] || p;
const METHODS: Record<string, string> = { email: "Email", google: "Google", whatsapp: "WhatsApp", institute: "Institute" };
const method = (m: string) => METHODS[m] || m;
const when = (d: string) => new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

function Bars({ title, rows, total, label = (s: string) => s }: { title: string; rows: Row[]; total: number; label?: (s: string) => string }) {
  return (
    <div className="rounded-2xl border border-ink/10 p-5">
      <h3 className="font-semibold">{title}</h3>
      {rows.length === 0 && <p className="text-sm text-ink/60 mt-3">No sign-ups yet.</p>}
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li key={r.name} className="text-sm">
            <div className="flex justify-between gap-3"><span className="truncate">{label(r.name)}</span><b>{r.count}</b></div>
            <div className="h-1.5 rounded-full bg-ink/5 mt-1"><div className="h-1.5 rounded-full bg-gold" style={{ width: `${total ? Math.max(4, (r.count / total) * 100) : 0}%` }} /></div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SignupSources() {
  const [days, setDays] = useState(7);
  const [r, setR] = useState<Report | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    setR(null); setErr(false);
    api.get(`/content/signup-sources?days=${days}`).then((x) => setR(x.data)).catch(() => setErr(true));
  }, [days]);

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Sign-ups by source</h2>
          <p className="text-sm text-ink/60 mt-1">Where new students came from. Tracking started 19 Nov 2026.</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)} className={`px-3 py-1.5 rounded-full text-sm border ${days === d ? "bg-ink text-paper border-ink" : "border-ink/15"}`}>{d} days</button>
          ))}
        </div>
      </div>

      {err && <p className="mt-4 text-sm text-red-600">Couldn't load the report.</p>}
      {!r && !err && <p className="mt-4 text-sm text-ink/60">Loading…</p>}
      {r && (
        <>
          <p className="mt-4"><span className="font-display text-3xl font-bold">{r.total}</span> <span className="text-ink/70">new accounts in the last {r.days} days ({(r.total / r.days).toFixed(1)} a day)</span></p>
          <div className="grid lg:grid-cols-3 gap-5 mt-5">
            <Bars title="Came from" rows={r.byChannel} total={r.total} />
            <Bars title="Signed up using" rows={r.byPlace} total={r.total} label={nice} />
            <Bars title="Method" rows={r.byMethod} total={r.total} label={method} />
          </div>

          {r.latest.length > 0 && (
            <div className="mt-6 overflow-x-auto">
              <h3 className="font-semibold mb-2">Latest sign-ups</h3>
              <table className="w-full text-sm">
                <thead><tr className="text-left border-b border-ink/15"><th className="py-2 pr-3">When</th><th className="py-2 pr-3">Name</th><th className="py-2 pr-3">Class</th><th className="py-2 pr-3">Came from</th><th className="py-2 pr-3">Signed up using</th><th className="py-2">First page</th></tr></thead>
                <tbody>
                  {r.latest.map((s) => (
                    <tr key={s._id} className="border-b border-ink/5">
                      <td className="py-2 pr-3 whitespace-nowrap">{when(s.createdAt)}</td>
                      <td className="py-2 pr-3">{s.fullName}</td>
                      <td className="py-2 pr-3">{s.currentClass || "—"}</td>
                      <td className="py-2 pr-3">{s.signup?.channel || "Not recorded"}</td>
                      <td className="py-2 pr-3">{s.signup?.place ? nice(s.signup.place) : "—"}{s.signup?.method ? ` · ${method(s.signup.method)}` : ""}</td>
                      <td className="py-2 max-w-[220px] truncate">{s.signup?.landing || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
