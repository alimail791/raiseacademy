import { useEffect, useState } from "react";
import { BellRing, CheckCircle2 } from "lucide-react";
import api from "../api/axios";
// Same key the College Predictor stores its confirmed-number token under.
const TOKEN_KEY = "cp_token";

// "Get NEET registration alerts on WhatsApp" — reuses the College Predictor's
// WhatsApp OTP lead flow; the lead is tagged alerts: ["neet-registration"].
// A number already confirmed on this browser (cp_token) signs up in one tap.
const ALERT = "neet-registration";
const DONE_KEY = "reg_alert_done";

const track = (event: string, params: Record<string, unknown> = {}) => {
  try { (window as any).gtag?.("event", event, params); } catch { /* analytics only */ }
};
const errMsg = (e: any, fallback: string) => e?.response?.data?.message || fallback;

export default function RegistrationAlert({ source, compact = false }: { source: string; compact?: boolean }) {
  const [token, setToken] = useState("");
  const [done, setDone] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    try {
      setToken(localStorage.getItem(TOKEN_KEY) || "");
      setDone(localStorage.getItem(DONE_KEY) === "1");
    } catch { /* storage blocked */ }
  }, []);

  const finish = (tok?: string) => {
    try {
      if (tok) localStorage.setItem(TOKEN_KEY, tok);
      localStorage.setItem(DONE_KEY, "1");
    } catch { /* storage blocked */ }
    setDone(true);
    track("registration_alert_lead", { source });
    try { (window as any).fbq?.("track", "Lead", { content_name: "NEET registration alert" }); } catch { /* analytics only */ }
  };

  const oneTap = async () => {
    setErr(""); setBusy(true);
    try { await api.post("/predictor/alerts", { token, alert: ALERT }); finish(); }
    catch { setToken(""); } // token no longer valid — fall back to the number form
    finally { setBusy(false); }
  };

  const send = async () => {
    setErr(""); setBusy(true);
    try {
      const utm = (`src=${source}&` + window.location.search.slice(1)).slice(0, 120);
      const r = await api.post("/predictor/otp/send", { phone, name, utm, alert: ALERT });
      if (r.data.verified && r.data.token) finish(r.data.token);
      else setOtpSent(true);
    } catch (e) { setErr(errMsg(e, "Couldn't send the code. Check the number.")); }
    finally { setBusy(false); }
  };

  const verify = async () => {
    setErr(""); setBusy(true);
    try {
      const r = await api.post("/predictor/otp/verify", { phone, code, alert: ALERT });
      finish(r.data.token);
    } catch (e) { setErr(errMsg(e, "Wrong code")); }
    finally { setBusy(false); }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-rise/40 bg-rise/10 p-5 flex gap-3 items-start">
        <CheckCircle2 className="text-rise shrink-0 mt-0.5" size={22} />
        <div>
          <p className="font-semibold">You're on the list.</p>
          <p className="text-sm text-ink/70 dark:text-paper/70 mt-1">We'll message you on WhatsApp when NEET 2027 registration opens, before the last date, and when the correction window opens.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-gold/50 bg-gold/10 ${compact ? "p-4" : "p-6"}`}>
      <div className="flex gap-3 items-start">
        <BellRing className="text-gold-deep dark:text-gold shrink-0 mt-1" size={22} />
        <div className="flex-1">
          <p className="font-display text-lg font-bold">Get NEET 2027 registration alerts on WhatsApp</p>
          <p className="text-sm text-ink/70 dark:text-paper/70 mt-1">A message when registration opens, a reminder before the last date, and the correction-window dates. Free, no spam.</p>
        </div>
      </div>

      {token ? (
        <button onClick={oneTap} disabled={busy} className="mt-4 bg-ink text-paper font-semibold px-5 py-3 rounded-full disabled:opacity-60">
          {busy ? "Adding..." : "Yes, alert me on my WhatsApp"}
        </button>
      ) : (
        <div className="mt-4">
          {!otpSent ? (
            <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="cp-in !mt-0" />
              <input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp number" className="cp-in !mt-0" />
              <button onClick={send} disabled={busy || phone.replace(/\D/g, "").length < 10} className="bg-ink text-paper font-semibold px-5 py-3 rounded-xl disabled:opacity-50">
                {busy ? "Sending..." : "Alert me"}
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-[1fr_auto] gap-2">
              <input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code from WhatsApp" className="cp-in !mt-0" />
              <button onClick={verify} disabled={busy || code.length < 6} className="bg-ink text-paper font-semibold px-5 py-3 rounded-xl disabled:opacity-50">
                {busy ? "Checking..." : "Confirm"}
              </button>
              <p className="text-xs text-ink/70 dark:text-paper/70 sm:col-span-2">Code sent on WhatsApp to {phone}. <button className="underline" onClick={() => { setOtpSent(false); setCode(""); }}>Change number</button></p>
            </div>
          )}
          {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
        </div>
      )}
    </div>
  );
}
