import { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { signupAttribution } from "../utils/attribution";
import { useAuth } from "../context/AuthContext";
import { goToYneet } from "../utils/yneet";

// Sign up / log in with just a WhatsApp number + OTP (no email, no password).
// Works inside Instagram / YouTube / WhatsApp in-app browsers, where Google
// sign-in is blocked. Backend: POST /api/auth/wa/send and /api/auth/wa/verify.

const CLASSES = ["6", "7", "8", "9", "10", "11", "12", "Dropper"];
const track = (event: string, params: Record<string, unknown> = {}) => {
  try { (window as any).gtag?.("event", event, params); } catch { /* analytics only */ }
};
const input = "mt-1 w-full rounded-lg border border-ink/15 bg-white text-ink px-4 py-2.5 focus:border-gold outline-none";

type Props = {
  mode?: "signup" | "login";
  place: string;
  referredByCode?: string;
  onDone?: (d: { token: string; user: any; isNew: boolean }) => void;
};

export default function WhatsAppSignup({ mode = "signup", place, referredByCode, onDone }: Props) {
  const { login } = useAuth();
  const [step, setStep] = useState<"form" | "code">("form");
  const [needDetails, setNeedDetails] = useState(mode === "signup");
  const [f, setF] = useState({ fullName: "", currentClass: "", phone: "", parentOk: false });
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const junior = ["6", "7", "8"].includes(f.currentClass);

  const send = async () => {
    const phone = f.phone.replace(/\D/g, "").slice(-10);
    if (needDetails) {
      if (!f.fullName.trim()) return toast.error(junior ? "Enter the student's name" : "Enter your name");
      if (!f.currentClass) return toast.error("Choose the class");
      if (junior && !f.parentOk) return toast.error("A parent needs to tick the box");
    }
    if (!/^[6-9]\d{9}$/.test(phone)) return toast.error("Enter a 10-digit WhatsApp number");
    setBusy(true);
    try {
      await api.post("/auth/wa/send", { phone });
      setStep("code");
      track("reg_start", { method: "whatsapp", place });
      toast.success("Code sent on WhatsApp");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Couldn't send the code. Try again.");
    } finally { setBusy(false); }
  };

  const verify = async () => {
    if (!/^\d{6}$/.test(code.trim())) return toast.error("Enter the 6-digit code");
    setBusy(true);
    try {
      const r = await api.post("/auth/wa/verify", {
        phone: f.phone.replace(/\D/g, "").slice(-10), code: code.trim(),
        ...(needDetails ? { fullName: f.fullName.trim(), currentClass: f.currentClass, parentOk: f.parentOk } : {}),
        referredByCode,
        signup: signupAttribution(place),
      });
      const d = r.data;
      login(d.token, d.user);
      toast.success(d.isNew ? "Welcome to YNeet!" : `Welcome back, ${String(d.user.fullName || "").split(" ")[0]}!`);
      if (d.isNew) {
        try { (window as any).fbq?.("track", "CompleteRegistration", { content_name: "YNeet WhatsApp sign-up", status: true }); } catch { /* analytics */ }
        track("sign_up", { method: "whatsapp", plan: junior ? "junior_free" : "trial_30d", place });
      }
      if (onDone) onDone(d); else setTimeout(goToYneet, d.isNew ? 800 : 0);
    } catch (e: any) {
      if (e?.response?.status === 404 && e?.response?.data?.needsDetails) {
        // Logging in with a number that has no account: ask for name + class, same code.
        setNeedDetails(true); setStep("form");
        toast("No account on this number yet. Add your name and class to sign up.");
      } else toast.error(e?.response?.data?.message || "That didn't work. Try again.");
    } finally { setBusy(false); }
  };

  if (step === "code") {
    return (
      <div className="space-y-3 text-ink">
        <p className="text-sm">Enter the 6-digit code we sent on WhatsApp to <b>{f.phone}</b>.</p>
        <input className={input} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="123456" />
        <button type="button" onClick={verify} disabled={busy} className="w-full bg-[#25D366] text-white font-bold py-3 rounded-full disabled:opacity-60">
          {busy ? "Checking…" : needDetails ? "Verify & start free" : "Verify & log in"}
        </button>
        <button type="button" onClick={() => { setStep("form"); setCode(""); }} className="text-sm underline text-ink/70">Change number / resend code</button>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-ink">
      {needDetails && (
        <>
          <div>
            <label className="text-sm font-medium">{junior ? "Student's name" : "Your name"}</label>
            <input className={input} value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} placeholder="Riya Kumar" />
          </div>
          <div>
            <label className="text-sm font-medium">Class</label>
            <div className="mt-1 grid grid-cols-4 gap-2">
              {CLASSES.map((c) => (
                <button type="button" key={c} onClick={() => setF({ ...f, currentClass: c })}
                  className={`py-2 rounded-lg border text-sm font-semibold ${f.currentClass === c ? "bg-ink text-paper border-ink" : "border-ink/15 bg-white"}`}>{c === "Dropper" ? "Drop" : c}</button>
              ))}
            </div>
          </div>
        </>
      )}
      <div>
        <label className="text-sm font-medium">{junior ? "Parent's WhatsApp number" : "WhatsApp number"}</label>
        <input className={input} inputMode="numeric" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="98765 43210" />
      </div>
      {needDetails && junior && (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={f.parentOk} onChange={(e) => setF({ ...f, parentOk: e.target.checked })} />
          I'm the parent/guardian and agree to the Terms and Privacy Policy. Class 6–8 is free.
        </label>
      )}
      <button type="button" onClick={send} disabled={busy} className="w-full bg-[#25D366] text-white font-bold py-3 rounded-full disabled:opacity-60">
        {busy ? "Sending…" : "Get code on WhatsApp"}
      </button>
      {needDetails && <p className="text-xs text-ink/60">No email or password needed. {junior ? "Free for Class 6–8." : "30 days free, no payment."}</p>}
    </div>
  );
}
