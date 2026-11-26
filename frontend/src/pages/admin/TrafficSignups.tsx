import { useEffect, useState } from "react";
import api from "../../api/axios";

// Admin → "Traffic & signups": new visitors → opened a sign-up form → started
// → completed (account created) → paid, by where they came from.
// Data: backend/controllers/trackController.js (first-party, no third-party scripts).

type Src = { name: string; visitors: number; signupViews: number; started: number; completed: number; paid: number };
type Day = { day: string; visitors: number; signupViews: number; started: number; completed: number };
type Open = { id: string; name: string; phone: string; email: string; currentClass: string; method: string; channel: string; place: string; tries: number; at: string;
  followups: number; followupAt: string | null; optOut: boolean };
type Report = {
  days: number; since: string | null; totals: Omit<Src, "name">; sources: Src[]; daily: Day[];
  landings: { page: string; n: number }[]; devices: Record<string, number>; incomplete: Open[];
  followup?: Followup;
};

type FEmail = { subject: string; heading: string; body: string; button: string };
type Followup = { enabled: boolean; max: number; emails: FEmail[]; defaults: FEmail[] };

// Admin edits the wording of the two automatic "finish your sign-up" emails.
function FollowupEditor({ f, onSaved }: { f: Followup; onSaved: (f: Followup) => void }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<FEmail[]>(f.emails);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const e = draft[step];
  const set = (k: keyof FEmail, v: string) => { setDraft(draft.map((d, i) => (i === step ? { ...d, [k]: v } : d))); setPreview(null); setMsg(""); };
  const changed = JSON.stringify(draft) !== JSON.stringify(f.emails);
  const save = async () => {
    setSaving(true); setMsg("");
    try { const x = await api.put("/track/followup", { emails: draft }); onSaved(x.data); setDraft(x.data.emails); setMsg("Saved. New emails will use this wording."); }
    catch { setMsg("Couldn't save."); }
    setSaving(false);
  };
  const showPreview = async () => {
    try { const x = await api.post("/track/followup/preview", { step: step + 1, email: e }); setPreview(x.data); } catch { setMsg("Couldn't load the preview."); }
  };
  const inp = "w-full mt-1 rounded-lg border border-ink/15 px-3 py-2 text-sm bg-white";
  return (
    <details className="mt-3 rounded-xl border border-ink/10 bg-white p-3">
      <summary className="cursor-pointer text-sm font-semibold">Edit the email wording</summary>
      <div className="flex gap-2 mt-3">
        {draft.map((_, i) => (
          <button key={i} onClick={() => { setStep(i); setPreview(null); }}
            className={`px-4 py-1.5 rounded-lg border text-sm ${step === i ? "bg-ink text-paper border-ink" : "border-ink/15"}`}>
            Email {i + 1}{i === 0 ? " · after 1 hour" : " · 2 days later"}
          </button>
        ))}
      </div>
      <p className="text-xs text-ink/60 mt-2">Write <b>{"{name}"}</b> for their first name. Leave a blank line for a new paragraph; start a line with "- " for a bullet point. The button links to the sign-up page.</p>
      <label className="block mt-3 text-sm">Subject<input className={inp} value={e.subject} onChange={(x) => set("subject", x.target.value)} maxLength={150} /></label>
      <label className="block mt-3 text-sm">Heading<input className={inp} value={e.heading} onChange={(x) => set("heading", x.target.value)} maxLength={150} /></label>
      <label className="block mt-3 text-sm">Message<textarea className={`${inp} min-h-[180px]`} value={e.body} onChange={(x) => set("body", x.target.value)} maxLength={3000} /></label>
      <label className="block mt-3 text-sm">Button text<input className={inp} value={e.button} onChange={(x) => set("button", x.target.value)} maxLength={40} /></label>
      <div className="flex flex-wrap gap-2 mt-3">
        <button onClick={save} disabled={saving || !changed} className="bg-ink text-paper font-semibold px-4 py-2 rounded-full text-sm disabled:opacity-40">{saving ? "Saving…" : "Save"}</button>
        <button onClick={showPreview} className="border border-ink/15 font-semibold px-4 py-2 rounded-full text-sm">Preview</button>
        <button onClick={() => { setDraft(draft.map((d, i) => (i === step ? { ...f.defaults[step] } : d))); setPreview(null); setMsg(""); }}
          className="text-sm text-ink/60 underline px-2">Reset to original</button>
      </div>
      {msg && <p className="mt-2 text-sm text-ink/70">{msg}</p>}
      {preview && (
        <div className="mt-3 rounded-lg border border-ink/10">
          <p className="text-sm px-3 py-2 border-b border-ink/10"><b>Subject:</b> {preview.subject} <span className="text-ink/50">(sample name: Arvind)</span></p>
          <iframe title="Email preview" srcDoc={preview.html} sandbox="" className="w-full h-[460px] bg-white" />
        </div>
      )}
    </details>
  );
}

const pct = (a: number, b: number) => (b ? `${Math.round((a * 100) / b)}%` : "–");
const when = (d: string) => new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const dayName = (d: string) => new Date(`${d}T00:00:00+05:30`).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short" });
const METHOD: Record<string, string> = { whatsapp: "WhatsApp", google: "Google", email: "Email" };
const waLink = (o: Open) =>
  `https://wa.me/91${o.phone}?text=${encodeURIComponent(`Hi ${o.name.split(" ")[0] || ""}, this is YNeet. You started signing up but didn't finish. Your 30-day free trial is waiting: https://www.yneet.in/register`)}`;

function Stat({ label, value, sub }: { label: string; value: number | string; sub: string }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-6">
      <p className="text-ink/60">{label}</p>
      <p className="font-display text-5xl mt-2">{value}</p>
      <p className="text-ink/75 mt-3 text-sm">{sub}</p>
    </div>
  );
}

// Status of the automatic "finish your sign-up" emails for one person.
function followupStatus(o: Open, max: number) {
  if (!o.email) return null;
  if (o.optOut) return { text: "Unsubscribed", cls: "bg-ink/5 text-ink/60" };
  if (o.followups >= max) return { text: `Both emails sent${o.followupAt ? ` · last ${when(o.followupAt)}` : ""}`, cls: "bg-green-50 text-green-700" };
  if (o.followups === 1) return { text: `Email 1 sent ${o.followupAt ? when(o.followupAt) : ""} · email 2 in 2 days`, cls: "bg-amber-50 text-amber-700" };
  return { text: "Email 1 goes ~1 hour after they stopped", cls: "bg-ink/5 text-ink/60" };
}

const th = "py-3 px-3 text-left font-medium text-ink/60 whitespace-nowrap";
const td = "py-3 px-3 whitespace-nowrap";

export default function TrafficSignups() {
  const [days, setDays] = useState(30);
  const [r, setR] = useState<Report | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    setR(null); setErr(false);
    api.get(`/track/report?days=${days}`).then((x) => setR(x.data)).catch(() => setErr(true));
  }, [days]);

  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const toggleFollowup = async () => {
    if (!r?.followup) return;
    setBusy("toggle");
    try {
      const x = await api.put("/track/followup", { enabled: !r.followup.enabled });
      setR({ ...r, followup: x.data });
    } catch { setNote("Couldn't change the setting."); }
    setBusy("");
  };
  const sendNow = async (o: Open) => {
    if (!r) return;
    setBusy(o.id); setNote("");
    try {
      const x = await api.post(`/track/followup/${o.id}/send`);
      setR({ ...r, incomplete: r.incomplete.map((i) => (i.id === o.id ? { ...i, followups: x.data.followups, followupAt: x.data.followupAt } : i)) });
      setNote(x.data.result === "done" ? `${o.name || o.email} already has an account, so no email was sent.` : `Email sent to ${o.email}.`);
    } catch (e: any) { setNote(e?.response?.data?.message || "Couldn't send the email."); }
    setBusy("");
  };

  const t = r?.totals;
  const dev = r ? Object.values(r.devices).reduce((a, b) => a + b, 0) : 0;

  return (
    <section id="traffic" className="mt-12 scroll-mt-20">
      <h2 className="font-display text-2xl">Traffic &amp; signups · last {days} days</h2>
      <div className="flex gap-2 mt-4">
        {[7, 30, 90].map((d) => (
          <button key={d} onClick={() => setDays(d)}
            className={`px-5 py-2 rounded-xl border text-sm font-medium ${days === d ? "bg-ink text-paper border-ink" : "border-ink/15 bg-white"}`}>{d} days</button>
        ))}
      </div>

      {err && <p className="mt-4 text-sm text-red-600">Couldn't load the report.</p>}
      {!r && !err && <p className="mt-4 text-sm text-ink/60">Loading…</p>}
      {r && t && (
        <>
          {r.since && new Date(r.since).getTime() > Date.now() - days * 864e5 && (
            <p className="mt-3 text-xs text-ink/60">Counting started {dayName(r.since.slice(0, 10))}, so the first days are partial.</p>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
            <Stat label="New visitors" value={t.visitors} sub="people, bots filtered out" />
            <Stat label="Opened sign-up" value={t.signupViews} sub={`${pct(t.signupViews, t.visitors)} of visitors`} />
            <Stat label="Started sign-up" value={t.started} sub={`${pct(t.started, t.signupViews)} of sign-up views`} />
            <Stat label="Completed (account made)" value={t.completed} sub={`${r.incomplete.length} incomplete · ${t.paid} paid`} />
          </div>

          <div className="mt-5 rounded-2xl border border-ink/10 bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-ink/10">
                <tr><th className={th}>Where they came from</th><th className={th}>Visitors</th><th className={th}>Sign-up opened</th><th className={th}>Started</th><th className={th}>Completed</th><th className={th}>Visitor → sign-up</th><th className={th}>Paid</th></tr>
              </thead>
              <tbody>
                {r.sources.length === 0 && <tr><td className={td} colSpan={7}>No visitors recorded yet.</td></tr>}
                {r.sources.map((s) => (
                  <tr key={s.name} className="border-b border-ink/5">
                    <td className={`${td} font-medium max-w-[220px] truncate`}>{s.name}</td>
                    <td className={td}>{s.visitors}</td>
                    <td className={td}>{s.signupViews}</td>
                    <td className={td}>{s.started}</td>
                    <td className={`${td} font-semibold`}>{s.completed}</td>
                    <td className={td}>{pct(s.completed, s.visitors)}</td>
                    <td className={td}>{s.paid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-ink/60 mt-2">Sign-ups are counted by when they happened, so a source can show sign-ups from visitors who came before this period.</p>

          {(r.incomplete.length > 0 || r.followup) && (
            <div className="mt-8">
              <h3 className="font-semibold">Started but didn't finish ({r.incomplete.length})</h3>
              <p className="text-sm text-ink/60">Message them on WhatsApp, or let the automatic emails below do it. People who later made an account another way are left out.</p>
              {r.followup && (
                <div className="mt-3 rounded-xl border border-ink/10 bg-white p-3 flex items-center justify-between gap-3">
                  <div className="text-sm">
                    <p className="font-semibold">Automatic follow-up emails: {r.followup.enabled ? "On" : "Off"}</p>
                    <p className="text-ink/60">Email 1 about 1 hour after they stop, email 2 two days later. Stops when they sign up or unsubscribe.</p>
                  </div>
                  <button onClick={toggleFollowup} disabled={busy === "toggle"} role="switch" aria-checked={r.followup.enabled}
                    className={`shrink-0 w-12 h-7 rounded-full relative transition ${r.followup.enabled ? "bg-[#25D366]" : "bg-ink/20"}`}>
                    <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${r.followup.enabled ? "left-6" : "left-1"}`} />
                  </button>
                </div>
              )}
              {r.followup && <FollowupEditor f={r.followup} onSaved={(f) => setR({ ...r, followup: f })} />}
              {note && <p className="mt-2 text-sm text-ink/70">{note}</p>}
              <ul className="mt-3 divide-y divide-ink/10 border-y border-ink/10">
                {r.incomplete.map((o) => (
                  <li key={o.id} className="py-3 text-sm flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{o.name || o.email || o.phone || "—"}{o.currentClass ? <span className="font-normal text-ink/60"> · Class {o.currentClass}</span> : null}</p>
                      <p className="text-ink/60 truncate">{METHOD[o.method] || o.method} · {o.channel || "—"} · {when(o.at)}{o.tries > 1 ? ` · ${o.tries} tries` : ""}</p>
                      {o.email && <p className="text-ink/50 text-xs truncate">{o.email}</p>}
                      {(() => {
                        const st = r.followup && followupStatus(o, r.followup.max);
                        return st ? <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${st.cls}`}>{st.text}</span> : null;
                      })()}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      {o.phone && (
                        <a href={waLink(o)} target="_blank" rel="noreferrer" className="bg-[#25D366] text-white font-semibold px-3 py-1.5 rounded-full">WhatsApp</a>
                      )}
                      {o.email && !o.optOut && r.followup && o.followups < r.followup.max && (
                        <button onClick={() => sendNow(o)} disabled={busy === o.id}
                          className="border border-ink/15 font-semibold px-3 py-1.5 rounded-full disabled:opacity-50">
                          {busy === o.id ? "Sending…" : `Send email ${o.followups + 1} now`}
                        </button>
                      )}
                      {o.email && (
                        <a href={`mailto:${o.email}`} className="text-xs text-ink/60 underline">Write my own</a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-5 mt-8">
            <div className="rounded-2xl border border-ink/10 bg-white overflow-x-auto">
              <h3 className="font-semibold px-4 pt-4">Day by day</h3>
              <table className="w-full text-sm mt-2">
                <thead className="border-b border-ink/10"><tr><th className={th}>Day</th><th className={th}>Visitors</th><th className={th}>Opened</th><th className={th}>Started</th><th className={th}>Done</th></tr></thead>
                <tbody>
                  {r.daily.map((d) => (
                    <tr key={d.day} className="border-b border-ink/5">
                      <td className={td}>{dayName(d.day)}</td><td className={td}>{d.visitors}</td><td className={td}>{d.signupViews}</td><td className={td}>{d.started}</td><td className={`${td} font-semibold`}>{d.completed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-white p-4">
              <h3 className="font-semibold">First page they landed on</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {r.landings.length === 0 && <li className="text-ink/60">Nothing yet.</li>}
                {r.landings.map((l) => (
                  <li key={l.page}>
                    <div className="flex justify-between gap-3"><span className="truncate">{l.page}</span><b>{l.n}</b></div>
                    <div className="h-1.5 rounded-full bg-ink/5 mt-1"><div className="h-1.5 rounded-full bg-gold" style={{ width: `${t.visitors ? Math.max(3, (l.n / t.visitors) * 100) : 0}%` }} /></div>
                  </li>
                ))}
              </ul>
              {dev > 0 && (
                <p className="text-sm text-ink/70 mt-5">Devices: {Object.entries(r.devices).map(([k, n]) => `${k} ${pct(n, dev)}`).join(" · ")}</p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
