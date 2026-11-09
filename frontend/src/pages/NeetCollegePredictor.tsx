import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, GraduationCap, Lock, MessageCircle, Share2, FileText, ShieldCheck } from "lucide-react";
import api from "../api/axios";
import { payWithRazorpay, trackPurchase } from "../utils/razorpay";
import { isAppMode } from "../utils/appMode";

// Free NEET College Predictor. Results unlock after the student confirms a WhatsApp
// number (lead). Optional ₹299 choice-filling report. Data = last year's official
// closing ranks, loaded by admin per quota (AIQ + 10 states).

type Quota = { code: string; name: string; live: boolean; year?: number; round?: number; rankType?: "AIR" | "STATE" | "SCORE"; categories?: string[]; courses?: string[] };
type Result = {
  college: string; collegeState: string; collegeType: string; course: string; quota: string; quotaName: string;
  seatType: string; category: string; closingRank: number; openingRank?: number; strayClosingRank?: number; strayOnly?: boolean; eligibility?: string; rankType: "AIR" | "STATE" | "SCORE";
  seats?: number; annualFee?: number; year: number; round: number; band: "safe" | "likely" | "reach";
};
type Resp = {
  counts: { safe: number; likely: number; reach: number }; total: number; locked: boolean; paid?: boolean;
  results?: Result[]; more?: number; preview?: { college: string; quotaName: string; band: string }[];
  used: { quota: string; name: string; year: number; round: number; home: boolean }[]; notes: string[]; reportPrice: number;
};

export const TOKEN_KEY = "cp_token";
const PAGE_URL = "www.yneet.in/neet-college-predictor";
const CATEGORIES = [["OPEN", "General / UR"], ["EWS", "EWS"], ["OBC", "OBC (NCL)"], ["SC", "SC"], ["ST", "ST"]];
// Extra seat groups a student can claim in their home state (tick boxes).
const STATE_GROUPS: Record<string, { key: string; label: string }[]> = {
  TN: [{ key: "TN_GOVT_SCHOOL", label: "I studied Class 6 to 12 in a Tamil Nadu government school (includes the 7.5% reserved seats)" }],
  KA: [
    { key: "KA_KANNADA", label: "I studied Class 1 to 10 in Kannada medium" },
    { key: "KA_RURAL", label: "I studied Class 1 to 10 in a rural area (rural quota)" },
    { key: "KA_KK", label: "I am a Kalyana-Karnataka (Hyderabad-Karnataka, Article 371J) candidate" },
  ],
  AP: [
    { key: "AP_AU", label: "My local area is Andhra University (AU) region" },
    { key: "AP_SVU", label: "My local area is Sri Venkateswara University (SVU) region" },
    { key: "FEMALE", label: "I am a female candidate (includes women-only seats)" },
  ],
  GJ: [
    { key: "GJ_AMD_LOCAL", label: "I live in the Ahmedabad Municipal Corporation area (NHL local quota)" },
    { key: "GJ_SURAT_LOCAL", label: "I live in the Surat Municipal Corporation area (SMIMER local quota)" },
  ],
  PB: [
    { key: "PB_BACKWARD", label: "I am a Backward Area candidate (Punjab)" },
    { key: "PB_BORDER", label: "I am a Border Area candidate (Punjab)" },
  ],
  TS: [{ key: "FEMALE", label: "I am a female candidate (includes women's reserved seats)" }],
  RJ: [
    { key: "FEMALE", label: "I am a female candidate (includes girls' reserved seats)" },
    { key: "RJ_TSP", label: "I am a Scheduled Area (TSP) resident" },
  ],
  BR: [{ key: "FEMALE", label: "I am a female candidate (includes women's reserved seats)" }],
  MH: [
    { key: "FEMALE", label: "I am a female candidate (includes women's reserved seats)" },
    { key: "MH_HILLY", label: "I am a Hilly Area candidate" },
  ],
};
const STATE_CAT_LABEL: Record<string, string> = {
  OPEN: "General / OC / GM", "CAT-1": "Category-1", S1: "SC (S1)", S2: "SC (S2)", S3: "SC (S3)", S4: "SC (S4)",
  EZ: "Ezhava (EZ)", MU: "Muslim (MU)", BH: "OBC Hindu (BH)", LA: "Latin Catholic & Anglo-Indian (LA)", DV: "Dheevara (DV)",
  VK: "Viswakarma (VK)", BX: "OBC Christian (BX)", KN: "Kusavan (KN)", KU: "Kudumbi (KU)",
  EBC: "EBC (Extremely Backward Class)", MBC: "MBC (More Backward Class)",
  "VJ-A": "VJ-A (VJNT)", "NT-B": "NT-B", "NT-C": "NT-C", "NT-D": "NT-D", SEBC: "SEBC",
  "BC-A": "BC-A", "BC-B": "BC-B", "BC-C": "BC-C", "BC-D": "BC-D", "BC-E": "BC-E", "SC-1": "SC Group I", "SC-2": "SC Group II", "SC-3": "SC Group III",
};
const STATE_RANK_LABEL: Record<string, string> = { KL: "KEAM rank" };
export const BAND = {
  safe: { label: "Safe", cls: "bg-rise/15 text-rise-dark border-rise/40", note: "Your rank is well inside last year's closing rank" },
  likely: { label: "Good chance", cls: "bg-gold/20 text-ink dark:text-paper border-gold/50", note: "Your rank is within last year's closing rank" },
  reach: { label: "Borderline", cls: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800", note: "Just past last year's cutoff in the main rounds, but seats like this went in later or stray rounds" },
} as const;

// How a cutoff is shown: rank-based quotas (AIQ, most states) vs mark-based (Tamil Nadu).
export const cutoffLabel = (r: { rankType: string; strayOnly?: boolean }) =>
  r.rankType === "SCORE" ? (r.strayOnly ? "Lowest mark, later rounds" : "Lowest mark") : r.strayOnly ? "Filled in later rounds" : "Closing rank";
export const cutoffValue = (r: { rankType: string }, n?: number) =>
  !n ? "—" : r.rankType === "SCORE" ? `${n} marks` : `${n.toLocaleString("en-IN")}${r.rankType === "STATE" ? " (state)" : ""}`;
export const laterBetter = (r: { rankType: string; closingRank: number; strayClosingRank?: number; strayOnly?: boolean }) =>
  !r.strayOnly && !!r.strayClosingRank && (r.rankType === "SCORE" ? r.strayClosingRank < r.closingRank : r.strayClosingRank > r.closingRank);

const track = (event: string, params: Record<string, unknown> = {}) => {
  try { (window as any).gtag?.("event", event, params); } catch { /* analytics only */ }
};
const errMsg = (e: any, fallback: string) => e?.response?.data?.message || fallback;
const fmt = (n?: number) => (n ? n.toLocaleString("en-IN") : "—");

const NeetCollegePredictor = () => {
  const nav = useNavigate();
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [price, setPrice] = useState(299);
  const [form, setForm] = useState({ air: "", score: "", category: "OPEN", homeState: "", stateRank: "", stateCategory: "", course: "MBBS" });
  const [groups, setGroups] = useState<string[]>([]); // home-state seat groups the student ticked
  const [res, setRes] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [filter, setFilter] = useState<"all" | "safe" | "likely" | "reach">("all");
  // WhatsApp gate
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [gateBusy, setGateBusy] = useState(false);
  const [gateErr, setGateErr] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    try { setToken(localStorage.getItem(TOKEN_KEY) || ""); } catch { /* storage blocked */ }
    api.get("/predictor/meta").then((r) => { setQuotas(r.data.quotas || []); setPrice(r.data.reportPrice || 299); }).catch(() => {});
  }, []);

  const live = quotas.filter((q) => q.live);
  const homeQuota = quotas.find((q) => q.code === form.homeState);
  const stateCats = homeQuota?.categories?.filter((c) => !c.endsWith("-PWD")) || [];
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const run = async (tok = token) => {
    if (!form.air && !form.stateRank && !form.score) { setError("Enter your NEET All India Rank or NEET score"); return; }
    setLoading(true); setError("");
    try {
      const allowed = (STATE_GROUPS[form.homeState] || []).map((g) => g.key);
      const eligibility = groups.filter((g) => allowed.includes(g));
      const r = await api.post("/predictor/predict", { ...form, eligibility, token: tok || undefined });
      setRes(r.data); setFilter("all");
      track("predictor_search", { locked: r.data.locked, total: r.data.total, category: form.category, state: form.homeState });
      setTimeout(() => document.getElementById("cp-results")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) { setError(errMsg(e, "Couldn't check right now. Please try again.")); }
    finally { setLoading(false); }
  };

  const unlocked = (tok: string) => {
    try { localStorage.setItem(TOKEN_KEY, tok); } catch { /* storage blocked */ }
    setToken(tok);
    track("predictor_lead");
    try { (window as any).fbq?.("track", "Lead", { content_name: "NEET College Predictor" }); } catch { /* analytics only */ }
    run(tok);
  };

  const sendCode = async () => {
    setGateErr(""); setGateBusy(true);
    try {
      const utm = typeof window !== "undefined" ? window.location.search.slice(1, 120) : "";
      const r = await api.post("/predictor/otp/send", { phone, name, utm });
      if (r.data.verified && r.data.token) unlocked(r.data.token);
      else setOtpSent(true);
    } catch (e) { setGateErr(errMsg(e, "Couldn't send the code. Check the number.")); }
    finally { setGateBusy(false); }
  };
  const verifyCode = async () => {
    setGateErr(""); setGateBusy(true);
    try {
      const r = await api.post("/predictor/otp/verify", { phone, code });
      unlocked(r.data.token);
    } catch (e) { setGateErr(errMsg(e, "Wrong code")); }
    finally { setGateBusy(false); }
  };

  const buyReport = async () => {
    if (!token) return;
    setPaying(true); setError("");
    track("predictor_report_click");
    try {
      const o = await api.post("/predictor/report/order", { token });
      if (!o.data.paid) {
        const p = await payWithRazorpay({ keyId: o.data.keyId, orderId: o.data.orderId, amount: o.data.amount, description: "NEET choice-filling report", prefill: o.data.prefill });
        await api.post("/predictor/report/verify", { token, ...p });
        trackPurchase(price, "NEET College Predictor report");
      }
      nav("/neet-college-predictor/report");
    } catch (e: any) {
      if (e?.message !== "cancelled") setError(errMsg(e, e?.message || "Payment didn't go through."));
    } finally { setPaying(false); }
  };

  const shown = useMemo(() => (res?.results || []).filter((r) => filter === "all" || r.band === filter), [res, filter]);
  const shareText = `Free NEET College Predictor: enter your NEET rank and see which MBBS/BDS colleges you can get (AIQ + state quota), based on last year's official closing ranks. Try it: https://${PAGE_URL}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <span className="inline-block text-xs font-bold uppercase tracking-wider bg-gold/20 text-ink dark:text-paper px-3 py-1 rounded-full">Free · AIQ + 12 states · MBBS & BDS</span>
      <h1 className="font-display text-3xl sm:text-5xl font-bold leading-tight mt-4">NEET College Predictor</h1>
      <p className="text-lg text-ink/70 dark:text-paper/70 mt-4">
        Enter your NEET rank and category to see the MBBS and BDS colleges you can get under the All India Quota and your state quota. Every result is based on last year's official closing ranks.
      </p>

      {/* ---------- Form ---------- */}
      <form onSubmit={(e) => { e.preventDefault(); run(); }} className="mt-8 p-5 sm:p-7 rounded-3xl border border-ink/10 dark:border-paper/15 grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-semibold">NEET All India Rank (AIR)</span>
          <input inputMode="numeric" value={form.air} onChange={set("air")} placeholder="e.g. 45000" className="cp-in" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">NEET score {homeQuota?.rankType === "SCORE" || form.homeState === "TN"
            ? <span className="font-normal text-rise-dark">(needed for {homeQuota?.name || "Tamil Nadu"} colleges)</span>
            : <span className="font-normal text-ink/50 dark:text-paper/50">(adds Tamil Nadu management seats)</span>}</span>
          <input inputMode="numeric" value={form.score} onChange={set("score")} placeholder="out of 720" className="cp-in" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Category</span>
          <select value={form.category} onChange={set("category")} className="cp-in">
            {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Course</span>
          <select value={form.course} onChange={set("course")} className="cp-in">
            <option value="MBBS">MBBS</option><option value="BDS">BDS</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Home state (domicile)</span>
          <select value={form.homeState} onChange={set("homeState")} className="cp-in">
            <option value="">Other / AIQ only</option>
            {quotas.filter((q) => q.code !== "AIQ").map((q) => <option key={q.code} value={q.code}>{q.name}{q.live ? "" : " (coming soon)"}</option>)}
          </select>
        </label>
        {homeQuota && homeQuota.rankType === "STATE" && (
          <label className="block">
            <span className="text-sm font-semibold">{STATE_RANK_LABEL[homeQuota.code] || `${homeQuota.name} state merit rank`}</span>
            <input inputMode="numeric" value={form.stateRank} onChange={set("stateRank")} placeholder="from your state rank list" className="cp-in" />
          </label>
        )}
        {homeQuota?.live && stateCats.length > 0 && (
          <label className="block">
            <span className="text-sm font-semibold">{homeQuota.name} state category</span>
            <select value={form.stateCategory} onChange={set("stateCategory")} className="cp-in">
              <option value="">{stateCats.includes(form.category) ? "Same as above" : "Choose your community"}</option>
              {stateCats.map((c) => <option key={c} value={c}>{STATE_CAT_LABEL[c] || c}</option>)}
            </select>
          </label>
        )}
        {(STATE_GROUPS[form.homeState] || []).map((g) => (
          <label key={g.key} className="sm:col-span-2 flex items-start gap-2 text-sm">
            <input type="checkbox" checked={groups.includes(g.key)} className="mt-1"
              onChange={(e) => setGroups((xs) => (e.target.checked ? [...xs, g.key] : xs.filter((x) => x !== g.key)))} />
            <span>{g.label}</span>
          </label>
        ))}
        <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={loading} className="inline-flex items-center gap-2 bg-gold text-ink font-bold text-lg px-8 py-4 rounded-full hover:bg-gold-dark disabled:opacity-60">
            {loading ? "Checking…" : <>Show my colleges <ArrowRight size={20} /></>}
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>
        {quotas.length > 0 && (
          <p className="sm:col-span-2 text-xs text-ink/55 dark:text-paper/55">
            Data loaded: {live.length ? live.map((q) => `${q.name} ${q.year} (round ${q.round})`).join(" · ") : "being updated, check back soon"}.
          </p>
        )}
      </form>

      {/* ---------- Results ---------- */}
      {res && (
        <section id="cp-results" className="mt-10 scroll-mt-24">
          <div className="rounded-3xl bg-rise-line text-paper p-6 sm:p-8">
            <p className="text-paper/70 font-semibold">{[form.air && `AIR ${fmt(Number(form.air))}`, form.score && `${form.score} marks`, form.category, form.course].filter(Boolean).join(" · ")}</p>
            <p className="font-display text-4xl sm:text-5xl font-bold mt-1">{res.total} colleges</p>
            <div className="mt-4 grid grid-cols-3 gap-3 max-w-lg">
              {(["safe", "likely", "reach"] as const).map((b) => (
                <div key={b} className="rounded-xl bg-paper/10 p-3">
                  <p className="text-xs text-paper/70">{BAND[b].label}</p>
                  <p className="text-2xl font-bold">{res.counts[b]}</p>
                </div>
              ))}
            </div>
            {res.used.length > 0 && <p className="text-xs text-paper/60 mt-4">Compared with: {res.used.map((u) => `${u.name} ${u.year} round ${u.round}`).join(" · ")}</p>}
          </div>
          {res.notes.map((n) => <p key={n} className="mt-3 text-sm text-ink/70 dark:text-paper/70">ℹ️ {n}</p>)}

          {res.locked ? (
            <div className="mt-6 rounded-3xl border-2 border-gold p-6 sm:p-8">
              {res.preview?.[0] && (
                <p className="text-sm text-ink/70 dark:text-paper/70">Your best match includes <b className="text-ink dark:text-paper">{res.preview[0].college}</b> ({res.preview[0].quotaName}).</p>
              )}
              <p className="font-display text-2xl font-bold mt-2 flex items-center gap-2"><Lock size={22} className="text-gold-dark" /> See the full list free</p>
              <p className="text-sm text-ink/65 dark:text-paper/65 mt-1">Confirm your WhatsApp number to unlock every college, closing rank and chance. We'll also send counselling round dates and alerts. No spam.</p>
              <div className="mt-4 grid sm:grid-cols-3 gap-3">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="cp-in !mt-0" />
                <input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp number" className="cp-in !mt-0" disabled={otpSent} />
                {!otpSent ? (
                  <button onClick={sendCode} disabled={gateBusy || phone.replace(/\D/g, "").length < 10} className="inline-flex justify-center items-center gap-2 bg-[#25D366] text-white font-bold px-5 py-3 rounded-full disabled:opacity-50">
                    <MessageCircle size={18} /> {gateBusy ? "Sending…" : "Send code"}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" className="cp-in !mt-0 flex-1 min-w-0" />
                    <button onClick={verifyCode} disabled={gateBusy || code.length < 4} className="bg-ink text-paper dark:bg-gold dark:text-ink font-bold px-4 rounded-full disabled:opacity-50">Unlock</button>
                  </div>
                )}
              </div>
              {otpSent && <p className="text-xs mt-2 text-ink/60 dark:text-paper/60">Code sent on WhatsApp to {phone}. <button className="underline" onClick={() => { setOtpSent(false); setCode(""); }}>Change number</button></p>}
              {gateErr && <p className="text-sm text-red-600 mt-2">{gateErr}</p>}
            </div>
          ) : (
            <>
              <div className="mt-6 flex flex-wrap gap-2">
                {(["all", "safe", "likely", "reach"] as const).map((b) => (
                  <button key={b} onClick={() => setFilter(b)} className={`px-4 py-2 rounded-full text-sm font-semibold border ${filter === b ? "bg-ink text-paper dark:bg-gold dark:text-ink border-transparent" : "border-ink/15 dark:border-paper/20"}`}>
                    {b === "all" ? `All (${res.results?.length || 0})` : `${BAND[b].label} (${(res.results || []).filter((r) => r.band === b).length})`}
                  </button>
                ))}
              </div>
              {res.total === 0 && (
                <p className="mt-6 p-5 rounded-2xl border border-ink/10 dark:border-paper/15">No college in the loaded data closed near this rank last year. Check your home state data, try BDS, or look at the options below.</p>
              )}
              <ul className="mt-4 space-y-3">
                {shown.map((r, i) => (
                  <li key={i} className="p-4 rounded-2xl border border-ink/10 dark:border-paper/15 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{r.college}</p>
                      <p className="text-xs text-ink/55 dark:text-paper/55 mt-0.5">
                        {[r.quotaName, r.seatType, r.collegeType, r.collegeState, r.annualFee ? `₹${r.annualFee.toLocaleString("en-IN")}/yr` : ""].filter(Boolean).join(" · ")} · {r.category === "OPEN" ? "Open" : r.category} {r.quota === "TN" && r.seatType !== "Management Quota" && r.category !== "OPEN" ? "community" : "seat"}
                      </p>
                    </div>
                    <div className="text-sm sm:text-right shrink-0">
                      <p className="text-ink/55 dark:text-paper/55 text-xs">{cutoffLabel(r)} {r.year}</p>
                      <p className="font-bold">{cutoffValue(r, r.closingRank)}</p>
                      {laterBetter(r) && <p className="text-xs text-ink/55 dark:text-paper/55">Later rounds: {cutoffValue(r, r.strayClosingRank)}</p>}
                    </div>
                    <span className={`shrink-0 self-start sm:self-center text-xs font-bold px-3 py-1 rounded-full border ${BAND[r.band].cls}`}>{BAND[r.band].label}</span>
                  </li>
                ))}
              </ul>

              {/* Paid report: website only. The Play Store app sells nothing (only a
                  report already bought on the website can be opened there). */}
              {(!isAppMode() || res.paid) && (
              <div className="mt-8 rounded-3xl bg-gold/15 border border-gold/40 p-6 sm:p-8">
                <p className="font-display text-2xl font-bold flex items-center gap-2"><FileText size={22} /> Your choice-filling report: ₹{price}</p>
                <p className="text-sm text-ink/70 dark:text-paper/70 mt-2">
                  {res.more ? <><b>{res.more} more colleges</b> aren't shown above. </> : null}
                  The report puts every college you can get in the right order to fill your choices (dream → good chance → safe), separately for AIQ and your state, with closing ranks, seat types and a printable PDF.
                </p>
                {res.paid ? (
                  <Link to="/neet-college-predictor/report" className="mt-4 inline-flex items-center gap-2 bg-ink text-paper dark:bg-gold dark:text-ink font-bold px-6 py-3 rounded-full">Open my report <ArrowRight size={16} /></Link>
                ) : (
                  <button onClick={buyReport} disabled={paying} className="mt-4 inline-flex items-center gap-2 bg-ink text-paper dark:bg-gold dark:text-ink font-bold px-6 py-3 rounded-full disabled:opacity-60">
                    {paying ? "Opening payment…" : <>Get my report for ₹{price} <ArrowRight size={16} /></>}
                  </button>
                )}
                <p className="text-xs text-ink/55 dark:text-paper/55 mt-2 flex items-center gap-1"><ShieldCheck size={14} /> One-time payment via Razorpay (UPI, cards, net banking).</p>
              </div>
              )}
            </>
          )}

          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl border border-ink/10 dark:border-paper/15">
              <p className="font-display text-xl font-bold flex items-center gap-2"><GraduationCap size={20} className="text-rise-dark" /> Not happy with these colleges?</p>
              <p className="text-sm text-ink/65 dark:text-paper/65 mt-1">A better rank next year opens far more government seats. Prepare for NEET 2027 as a dropper with full mocks, PYQs and daily practice. 30 days free.</p>
              <Link to="/register" onClick={() => track("predictor_dropper_click")} className="mt-3 inline-flex items-center gap-2 font-semibold text-rise-dark">Start free as a dropper <ArrowRight size={16} /></Link>
            </div>
            <div className="p-6 rounded-3xl border border-ink/10 dark:border-paper/15">
              <p className="font-display text-xl font-bold flex items-center gap-2"><Share2 size={20} className="text-rise-dark" /> Help a friend</p>
              <p className="text-sm text-ink/65 dark:text-paper/65 mt-1">Share the free predictor with friends and parents in your NEET groups.</p>
              <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" onClick={() => track("predictor_share")}
                className="mt-3 inline-flex items-center gap-2 bg-[#25D366] text-white font-bold px-5 py-2.5 rounded-full">Share on WhatsApp</a>
            </div>
          </div>
        </section>
      )}

      {/* ---------- Explainer (SEO) ---------- */}
      <section className="mt-14 text-ink/75 dark:text-paper/75 space-y-3">
        <h2 className="font-display text-2xl font-bold text-ink dark:text-paper">How the predictor works</h2>
        <p>We compare your rank with the closing rank of every college, category and seat type in last year's official counselling allotments: MCC for the 15% All India Quota, deemed universities and central institutes, and each state's counselling authority for the 85% state quota. For Tamil Nadu we compare your NEET score with the lowest mark admitted to each college, community-wise, including the 7.5% government-school seats and management quota.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Safe</b>: {BAND.safe.note.toLowerCase()}.</li>
          <li><b>Good chance</b>: {BAND.likely.note.toLowerCase()}.</li>
          <li><b>Borderline</b>: {BAND.reach.note.toLowerCase()}.</li>
        </ul>
        <p>State quota seats are shown only for your home state, and some states rank by their own state merit list, so add your state rank where asked. Reserved-category students are matched with both open and their own category seats.</p>
        <h2 className="font-display text-2xl font-bold text-ink dark:text-paper pt-4">Important</h2>
        <p>Closing ranks change every year with seat numbers and competition, so treat this as a guide, not a guarantee. Always check the official seat matrix and rules on mcc.nic.in and your state counselling website before choice filling. YNeet is not connected with MCC or any state counselling authority.</p>
        <p>Still preparing? Take the <Link to="/neet-readiness" className="text-rise-dark font-semibold underline">free NEET Readiness Test</Link> or practise <Link to="/neet-practice" className="text-rise-dark font-semibold underline">chapter-wise PYQs</Link>.</p>
      </section>
    </div>
  );
};

export default NeetCollegePredictor;
