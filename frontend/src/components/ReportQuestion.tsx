import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Flag } from "lucide-react";
import api from "../api/axios";
import { track } from "./SignupNudge";

// "Report an error" under a question: wrong answer key, wrong explanation, a typo…
// Sends POST /api/question-reports (saved for the admin + an email alert).
// No login needed; the WhatsApp number is optional (to say thanks when fixed).

const REASONS: [string, string][] = [
  ["wrong_answer", "The answer is wrong"],
  ["wrong_explanation", "The explanation is wrong or unclear"],
  ["question_error", "Mistake in the question"],
  ["options_error", "Mistake in the options"],
  ["other", "Something else"],
];

export default function ReportQuestion({ questionId, slug, questionText, place }: { questionId?: string; slug?: string; questionText?: string; place: string }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    setState("sending");
    try {
      await api.post("/question-reports", { questionId, slug, questionText: (questionText || "").slice(0, 300), page: pathname, reason, note, phone });
      setState("done");
      track("question_report", { place, reason });
    } catch (err: any) {
      setState("error");
      setMsg(err?.response?.data?.message || "Couldn't send. Please try again.");
    }
  };

  if (state === "done") return <p className="mt-3 text-sm text-rise-dark font-semibold">Thanks! We'll check this question and fix it.</p>;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink/55 dark:text-paper/55 hover:text-red-600 underline-offset-2 hover:underline">
        <Flag size={12} /> Report an error in this question
      </button>
    );
  }

  return (
    <form onSubmit={send} className="mt-3 rounded-xl border border-ink/15 dark:border-paper/20 p-4 text-sm space-y-3">
      <p className="font-semibold">What's wrong with this question?</p>
      <div className="grid gap-1.5">
        {REASONS.map(([k, l]) => (
          <label key={k} className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name={`rq-${questionId || slug}`} value={k} checked={reason === k} onChange={() => setReason(k)} /> {l}
          </label>
        ))}
      </div>
      <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 1000))} rows={2} placeholder="Tell us more (optional), e.g. the correct answer is (C) because…" className="cp-in !mt-0" />
      <input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value.slice(0, 15))} placeholder="WhatsApp number (optional, we'll tell you when it's fixed)" className="cp-in !mt-0" />
      {state === "error" && <p className="text-red-600">{msg}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={!reason || state === "sending"} className="bg-ink text-paper dark:bg-paper dark:text-ink font-semibold px-4 py-2 rounded-full disabled:opacity-50">{state === "sending" ? "Sending…" : "Send report"}</button>
        <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 underline">Cancel</button>
      </div>
    </form>
  );
}
