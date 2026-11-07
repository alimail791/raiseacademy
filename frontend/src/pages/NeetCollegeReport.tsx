import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Printer } from "lucide-react";
import api from "../api/axios";
import { payWithRazorpay, trackPurchase } from "../utils/razorpay";
import { BAND, TOKEN_KEY } from "./NeetCollegePredictor";

// ₹299 choice-filling report from the NEET College Predictor. Printable (Save as PDF).

type Item = {
  college: string; collegeState: string; collegeType: string; quota: string; quotaName: string; seatType: string;
  category: string; closingRank: number; openingRank?: number; strayClosingRank?: number; strayOnly?: boolean; rankType: "AIR" | "STATE"; annualFee?: number;
  year: number; round: number; band: "safe" | "likely" | "reach";
};
type Report = {
  student: { name: string; phone: string; air?: number; stateRank?: number; score?: number; category: string; homeState: string; homeStateName: string; course: string };
  counts: { safe: number; likely: number; reach: number }; total: number;
  used: { quota: string; name: string; year: number; round: number }[]; notes: string[];
  sections: { quota: string; name: string; items: Item[] }[]; generatedAt: string;
};

const fmt = (n?: number) => (n ? n.toLocaleString("en-IN") : "—");

const NeetCollegeReport = () => {
  const [token, setToken] = useState("");
  const [data, setData] = useState<Report | null>(null);
  const [state, setState] = useState<"loading" | "nolead" | "unpaid" | "ok" | "error">("loading");
  const [price, setPrice] = useState(299);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = async (tok: string) => {
    if (!tok) { setState("nolead"); return; }
    try {
      const r = await api.get("/predictor/report", { params: { token: tok } });
      setData(r.data); setState("ok");
    } catch (e: any) {
      const s = e?.response?.status;
      if (s === 402) { setPrice(e.response.data.price || 299); setState("unpaid"); }
      else if (s === 401) setState("nolead");
      else setState("error");
    }
  };

  useEffect(() => {
    let t = "";
    try { t = localStorage.getItem(TOKEN_KEY) || ""; } catch { /* storage blocked */ }
    setToken(t); load(t);
  }, []);

  const buy = async () => {
    setBusy(true); setErr("");
    try {
      const o = await api.post("/predictor/report/order", { token });
      if (!o.data.paid) {
        const p = await payWithRazorpay({ keyId: o.data.keyId, orderId: o.data.orderId, amount: o.data.amount, description: "NEET choice-filling report", prefill: o.data.prefill });
        await api.post("/predictor/report/verify", { token, ...p });
        trackPurchase(price, "NEET College Predictor report");
      }
      await load(token);
    } catch (e: any) {
      if (e?.message !== "cancelled") setErr(e?.response?.data?.message || e?.message || "Payment didn't go through.");
    } finally { setBusy(false); }
  };

  if (state === "loading") return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-ink/60 dark:text-paper/60">Loading your report…</div>;
  if (state === "nolead" || state === "error") {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-bold">Your college report</h1>
        <p className="mt-3 text-ink/70 dark:text-paper/70">{state === "error" ? "Couldn't load the report right now. Please try again in a minute." : "Check your colleges first, then confirm your WhatsApp number to open your report on this device."}</p>
        <Link to="/neet-college-predictor" className="mt-6 inline-flex items-center gap-2 bg-gold text-ink font-bold px-6 py-3 rounded-full">Go to the College Predictor <ArrowRight size={16} /></Link>
      </div>
    );
  }
  if (state === "unpaid") {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-bold">Choice-filling report: ₹{price}</h1>
        <p className="mt-3 text-ink/70 dark:text-paper/70">Every college you can get, in the order to fill your choices, separately for AIQ and your state quota, with closing ranks and a printable PDF.</p>
        <button onClick={buy} disabled={busy} className="mt-6 inline-flex items-center gap-2 bg-ink text-paper dark:bg-gold dark:text-ink font-bold px-6 py-3 rounded-full disabled:opacity-60">
          {busy ? "Opening payment…" : <>Get my report for ₹{price} <ArrowRight size={16} /></>}
        </button>
        {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
      </div>
    );
  }

  const d = data!;
  const s = d.student;
  let n = 0;
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 print:py-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-rise-dark">YNeet · NEET College Predictor</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">Choice-filling report{s.name ? ` for ${s.name}` : ""}</h1>
          <p className="text-sm text-ink/60 dark:text-paper/60 mt-2">
            AIR {fmt(s.air)}{s.stateRank ? ` · ${s.homeStateName} rank ${fmt(s.stateRank)}` : ""}{s.score ? ` · Score ${s.score}` : ""} · {s.category} · {s.course}{s.homeStateName ? ` · Home state ${s.homeStateName}` : ""}
          </p>
          <p className="text-xs text-ink/50 dark:text-paper/50 mt-1">Based on {d.used.map((u) => `${u.name} ${u.year} round ${u.round}`).join(", ")} · made {new Date(d.generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
        <button onClick={() => window.print()} className="no-print shrink-0 inline-flex items-center gap-2 border border-ink/20 dark:border-paper/20 font-semibold px-4 py-2 rounded-full"><Printer size={16} /> Save PDF</button>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 max-w-lg">
        {(["reach", "likely", "safe"] as const).map((b) => (
          <div key={b} className={`rounded-xl border p-3 ${BAND[b].cls}`}>
            <p className="text-xs font-semibold">{BAND[b].label}</p>
            <p className="text-2xl font-bold">{d.counts[b]}</p>
          </div>
        ))}
      </div>
      {d.notes.map((x) => <p key={x} className="mt-3 text-sm">ℹ️ {x}</p>)}

      <section className="mt-8 p-5 rounded-2xl bg-gold/10 border border-gold/30 text-sm space-y-1.5">
        <p className="font-display text-lg font-bold">How to use this list</p>
        <p>1. Fill choices in the order below. Borderline colleges come first: filling them costs nothing, and if they don't come through you move down to the next choice.</p>
        <p>2. Never leave out the "Safe" colleges at the end. They are your safety net in round 1.</p>
        <p>3. AIQ (MCC) and state counselling are separate. Fill both, and follow each one's round dates and rules on upgrades and resigning.</p>
        <p>4. Check fees, bond rules and the latest seat matrix on the official websites before locking choices.</p>
      </section>

      {d.sections.map((sec) => (
        <section key={sec.quota} className="mt-10 break-inside-avoid-page">
          <h2 className="font-display text-2xl font-bold">{sec.name} <span className="text-base font-normal text-ink/50 dark:text-paper/50">({sec.items.length})</span></h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink/55 dark:text-paper/55 border-b border-ink/10 dark:border-paper/15">
                  <th className="py-2 pr-2">#</th><th className="py-2 pr-2">College</th><th className="py-2 pr-2">Seat</th>
                  <th className="py-2 pr-2 text-right">Closing rank (R1–2)</th><th className="py-2 pr-2">Chance</th>
                </tr>
              </thead>
              <tbody>
                {sec.items.map((r, i) => {
                  n++;
                  return (
                    <tr key={i} className="border-b border-ink/5 dark:border-paper/10 align-top">
                      <td className="py-2 pr-2 text-ink/50 dark:text-paper/50">{i + 1}</td>
                      <td className="py-2 pr-2">
                        <p className="font-semibold">{r.college}</p>
                        <p className="text-xs text-ink/50 dark:text-paper/50">{[r.collegeType, r.collegeState, r.annualFee ? `₹${fmt(r.annualFee)}/yr` : ""].filter(Boolean).join(" · ")}</p>
                      </td>
                      <td className="py-2 pr-2 text-xs">{[r.seatType, r.category].filter(Boolean).join(" · ")}</td>
                      <td className="py-2 pr-2 text-right font-semibold">
                        {fmt(r.closingRank)}{r.rankType === "STATE" && <span className="text-xs font-normal"> (state)</span>}
                        {r.strayOnly ? <p className="text-xs font-normal text-ink/50 dark:text-paper/50">round 3 / stray only</p> : r.strayClosingRank && r.strayClosingRank > r.closingRank ? <p className="text-xs font-normal text-ink/50 dark:text-paper/50">R3 / stray: {fmt(r.strayClosingRank)}</p> : null}
                      </td>
                      <td className="py-2 pr-2"><span className={`text-xs font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${BAND[r.band].cls}`}>{BAND[r.band].label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      {n === 0 && <p className="mt-8">No college in the loaded data closed near your rank last year.</p>}

      <p className="mt-10 text-xs text-ink/55 dark:text-paper/55">
        Built from last year's official counselling allotments. Closing ranks change every year, so this is a guide, not a guarantee. YNeet is not connected with MCC or any state counselling authority. Questions? Message us on WhatsApp from www.yneet.in.
      </p>
      <div className="no-print mt-8 rounded-3xl border border-ink/10 dark:border-paper/15 p-6">
        <p className="font-display text-xl font-bold">Want a better college next year?</p>
        <p className="text-sm text-ink/65 dark:text-paper/65 mt-1">Prepare for NEET 2027 with full mocks, PYQs and daily practice on YNeet. 30 days free.</p>
        <Link to="/register" className="mt-3 inline-flex items-center gap-2 font-semibold text-rise-dark">Start free <ArrowRight size={16} /></Link>
      </div>
    </div>
  );
};

export default NeetCollegeReport;
