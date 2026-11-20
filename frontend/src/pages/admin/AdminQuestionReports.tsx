import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";

// Admin: "Report an error" submissions from public question pages
// (www.yneet.in/neet-question/<slug> and chapter practice pages).
// Fix the question in the YNeet admin panel, then mark the report fixed here.

type Report = { _id: string; createdAt: string; questionId: string; slug: string; page: string; questionText: string; reason: string; note: string; phone: string; resolved: boolean };
const REASONS: Record<string, string> = {
  wrong_answer: "Wrong answer",
  wrong_explanation: "Wrong / unclear explanation",
  question_error: "Mistake in question",
  options_error: "Mistake in options",
  other: "Other",
};
const when = (d: string) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export default function AdminQuestionReports() {
  const [all, setAll] = useState(false);
  const [reports, setReports] = useState<Report[] | null>(null);

  const load = () => {
    setReports(null);
    api.get("/question-reports", { params: all ? { all: 1 } : {} })
      .then((r) => setReports(r.data.reports || []))
      .catch(() => { setReports([]); toast.error("Couldn't load reports"); });
  };
  useEffect(load, [all]);

  const setResolved = async (id: string, resolved: boolean) => {
    try {
      await api.patch(`/question-reports/${id}`, { resolved });
      setReports((rs) => (rs || []).flatMap((r) => (r._id !== id ? [r] : all ? [{ ...r, resolved }] : [])));
      toast.success(resolved ? "Marked fixed" : "Reopened");
    } catch { toast.error("Couldn't update"); }
  };

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Question error reports</h1>
          <p className="text-sm text-ink/60 mt-1">Students report mistakes from the free question pages. Fix the question in the YNeet admin panel, then mark it fixed.</p>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> Show fixed too</label>
      </div>

      {reports === null && <p className="mt-6 text-ink/60">Loading…</p>}
      {reports && reports.length === 0 && <p className="mt-6 text-ink/60">{all ? "No reports yet." : "No open reports. 🎉"}</p>}

      <div className="mt-6 space-y-3">
        {reports?.map((r) => (
          <div key={r._id} className={`rounded-xl border p-4 ${r.resolved ? "border-ink/10 opacity-60" : "border-ink/15"}`}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 font-semibold">{REASONS[r.reason] || r.reason}</span>
              <span className="text-ink/50">{when(r.createdAt)}</span>
              {r.questionId && <span className="text-ink/50">ID: <code>{r.questionId}</code></span>}
            </div>
            <p className="mt-2 text-sm">{r.questionText || <span className="text-ink/50">(no question text)</span>}</p>
            {r.note && <p className="mt-2 text-sm bg-gold/15 rounded-lg p-2"><b>Student's note:</b> {r.note}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              {r.page && <a href={r.page} target="_blank" rel="noreferrer" className="underline text-rise-dark">Open page</a>}
              {r.phone && <a href={`https://wa.me/${r.phone.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")}?text=${encodeURIComponent("Hi! Thanks for reporting the mistake in a YNeet question. We've fixed it.")}`} target="_blank" rel="noreferrer" className="underline text-rise-dark">WhatsApp {r.phone}</a>}
              <button onClick={() => setResolved(r._id, !r.resolved)} className={`ml-auto px-4 py-1.5 rounded-full font-semibold ${r.resolved ? "border border-ink/20" : "bg-gold text-ink"}`}>
                {r.resolved ? "Reopen" : "Mark fixed"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
