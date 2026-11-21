import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { signupAttribution } from "../utils/attribution";

// "Continue with Google" for Class 9–Dropper (Register and Login pages).
// Google gives us a verified name + email in one tap. A brand-new student is then
// asked for just two things the account needs: class and WhatsApp number.
// Hidden when VITE_GOOGLE_CLIENT_ID isn't set. Works in the YNeet Android app too:
// it is a Trusted Web Activity (real Chrome), and app.yneet.in's account frame
// allows Google sign-in (allow="identity-credentials-get").

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const CLASSES = ["9", "10", "11", "12", "Dropper"];

let scriptPromise: Promise<void> | null = null;
function loadGsi(): Promise<void> {
  if ((window as any).google?.accounts?.id) return Promise.resolve();
  scriptPromise ||= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { scriptPromise = null; reject(new Error("Google script failed to load")); };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

// Saved while the details form is open, so switching apps (e.g. to copy the
// WhatsApp number) or a page reload doesn't throw the student back to step one.
// Google's credential is valid for ~1 hour, so we keep it for 50 minutes.
const PENDING_KEY = "yn_google_pending";
const PENDING_MS = 50 * 60 * 1000;
type Pending = { credential: string; email: string; fullName: string };
const savePending = (p: Pending | null) => {
  try { p ? sessionStorage.setItem(PENDING_KEY, JSON.stringify({ ...p, at: Date.now() })) : sessionStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
};
const loadPending = (): Pending | null => {
  try {
    const p = JSON.parse(sessionStorage.getItem(PENDING_KEY) || "null");
    if (p && p.credential && p.email && Date.now() - p.at < PENDING_MS) return { credential: p.credential, email: p.email, fullName: p.fullName || "" };
  } catch { /* ignore */ }
  return null;
};

// Funnel tracking for the details form: Railway logs + the GoogleLead record
// (POST /api/auth/google/step) and a GA4 event. sendBeacon survives the page closing.
const STEP_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/google/step`;
const trackStep = (email: string, step: string) => {
  try { (window as any).gtag?.("event", "google_signup_step", { step }); } catch { /* analytics only */ }
  try {
    const body = JSON.stringify({ email, step });
    if (navigator.sendBeacon?.(STEP_URL, new Blob([body], { type: "text/plain" }))) return;
    fetch(STEP_URL, { method: "POST", body, headers: { "Content-Type": "text/plain" }, keepalive: true }).catch(() => {});
  } catch { /* tracking only */ }
};

// Phones often autofill or paste "+91 98765 43210" or "098765 43210"; keep the 10-digit number.
const cleanPhone = (v: string) => {
  let d = v.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  else if (d.length > 10) d = d.slice(-10);
  return d;
};

export const googleSignInEnabled = () => !!CLIENT_ID && typeof window !== "undefined";

type Props = {
  text?: "signup_with" | "continue_with" | "signin_with";
  referredByCode?: string;
  // Which button/form this is, saved on new accounts (e.g. "question_page_gate").
  place?: string;
  // Called after login/registration succeeds with the API's { token, user, isNew }.
  onDone: (data: { token: string; user: any; isNew: boolean }) => void;
};

export default function GoogleSignIn({ text = "continue_with", referredByCode, place, onDone }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const done = useRef(new Set<string>());
  const once = (email: string, step: string) => {
    if (done.current.has(step)) return;
    done.current.add(step);
    trackStep(email, step);
  };
  const [details, setDetails] = useState({ fullName: "", phone: "", currentClass: "" });
  const [loading, setLoading] = useState(false);

  const send = async (credential: string, extra: Record<string, string> = {}) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/google", { credential, referredByCode, signup: signupAttribution(place), ...extra });
      if (res.data.needsDetails) {
        const p = { credential, email: res.data.email, fullName: res.data.fullName || "" };
        setPending(p);
        savePending(p);
        once(p.email, "form_shown");
        setDetails((d) => ({ ...d, fullName: d.fullName || res.data.fullName || "" }));
        try { (window as any).gtag?.("event", "reg_start", { method: "google" }); } catch { /* analytics only */ }
        return;
      }
      savePending(null);
      onDone(res.data);
    } catch (err: any) {
      if (pending) {
        trackStep(pending.email, "submit_error");
        if (err?.response?.status === 401) {
          // The Google credential expired (left the form open too long): start again.
          savePending(null);
          setPending(null);
          toast.error("Your Google sign-in timed out. Tap Continue with Google once more.");
          return;
        }
      }
      toast.error(err?.response?.data?.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setEnabled(googleSignInEnabled());
    const p = loadPending();
    if (p) {
      setPending(p);
      setDetails((d) => ({ ...d, fullName: d.fullName || p.fullName }));
      once(p.email, "form_restored");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Left the page with the form still open (closed tab, went back, switched away for good).
  useEffect(() => {
    if (!pending) return;
    const onHide = () => trackStep(pending.email, "left_page");
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [pending]);

  useEffect(() => {
    if (!enabled || pending) return;
    let alive = true;
    loadGsi().then(() => {
      const g = (window as any).google;
      if (!alive || !box.current || !g) return;
      g.accounts.id.initialize({ client_id: CLIENT_ID, callback: (r: { credential: string }) => send(r.credential) });
      g.accounts.id.renderButton(box.current, { theme: "outline", size: "large", shape: "pill", text, width: Math.min(box.current.offsetWidth || 320, 400) });
    }).catch(() => alive && setEnabled(false));
    return () => { alive = false; };
  }, [enabled, pending]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!enabled) return null;

  if (pending) {
    const finish = () => {
      trackStep(pending.email, "submit_click");
      if (!details.fullName.trim()) { trackStep(pending.email, "blocked_name"); return toast.error("Enter your name"); }
      if (!details.currentClass) { trackStep(pending.email, "blocked_class"); return toast.error("Choose your class"); }
      if (!/^[6-9]\d{9}$/.test(details.phone)) { trackStep(pending.email, "blocked_phone"); return toast.error("Enter your 10-digit WhatsApp number (starts with 6, 7, 8 or 9)"); }
      send(pending.credential, { fullName: details.fullName.trim(), phone: details.phone, currentClass: details.currentClass });
    };
    return (
      <div className="rounded-2xl border-2 border-gold bg-gold/10 p-5 space-y-4">
        <p className="text-sm">Signed in as <b>{pending.email}</b>. Two quick details and you're in:</p>
        <div>
          <label className="text-sm font-medium">Your name</label>
          <input className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-2.5 bg-white focus:border-gold outline-none"
            value={details.fullName} onChange={(e) => { once(pending.email, "name_edited"); setDetails({ ...details, fullName: e.target.value }); }} />
        </div>
        <div>
          <label className="text-sm font-medium">Class</label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {CLASSES.map((c) => (
              <button type="button" key={c} onClick={() => { once(pending.email, "class_picked"); setDetails({ ...details, currentClass: c }); }}
                className={`py-2.5 rounded-lg border font-semibold text-sm ${details.currentClass === c ? "bg-gold text-ink border-gold" : "bg-white border-ink/15 hover:border-gold"}`}>
                {c === "Dropper" ? "Dropper" : `Class ${c}`}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">WhatsApp number <span className="text-ink/70 font-normal">(for doubt support)</span></label>
          <p className="text-xs text-ink/70 mt-0.5">Only for test reminders and doubt replies. No spam calls.</p>
          <div className="mt-1 flex rounded-lg border border-ink/15 bg-white focus-within:border-gold overflow-hidden">
            <span className="px-3 flex items-center bg-ink/5 text-ink/70 text-sm">+91</span>
            <input className="flex-1 px-4 py-2.5 outline-none" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={16} placeholder="98765 43210"
              value={details.phone} onChange={(e) => {
                const raw = e.target.value;
                once(pending.email, raw.length - details.phone.length > 1 ? "phone_autofilled" : "phone_typing");
                setDetails({ ...details, phone: cleanPhone(raw) });
              }} />
          </div>
        </div>
        <button type="button" onClick={finish} disabled={loading}
          className="w-full bg-gold text-ink font-bold text-lg py-3.5 rounded-full hover:brightness-95 disabled:opacity-60">
          {loading ? "Creating account…" : "Start My Free 30 Days →"}
        </button>
        <p className="text-center text-xs text-ink/70">✓ 30 days free · ✓ No payment or card · ✓ No auto-charge</p>
      </div>
    );
  }

  return (
    <div>
      <div ref={box} className="flex justify-center min-h-[44px]" />
      {loading && <p className="text-center text-xs text-ink/70 mt-2">Signing you in…</p>}
    </div>
  );
}

export function OrDivider({ label = "or sign up with email" }: { label?: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => { setOn(googleSignInEnabled()); }, []);
  if (!on) return null;
  return (
    <div className="flex items-center gap-3 text-xs text-ink/45 my-1">
      <span className="flex-1 h-px bg-ink/10" /> {label} <span className="flex-1 h-px bg-ink/10" />
    </div>
  );
}
