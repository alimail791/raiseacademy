import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { isAppMode } from "../utils/appMode";

// "Continue with Google" for Class 9–Dropper (Register and Login pages).
// Google gives us a verified name + email in one tap. A brand-new student is then
// asked for just two things the account needs: class and WhatsApp number.
// Hidden when VITE_GOOGLE_CLIENT_ID isn't set, and inside the Android app
// (Google blocks its sign-in inside app WebViews).

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

export const googleSignInEnabled = () => !!CLIENT_ID && typeof window !== "undefined" && !isAppMode();

type Props = {
  text?: "signup_with" | "continue_with" | "signin_with";
  referredByCode?: string;
  // Called after login/registration succeeds with the API's { token, user, isNew }.
  onDone: (data: { token: string; user: any; isNew: boolean }) => void;
};

export default function GoogleSignIn({ text = "continue_with", referredByCode, onDone }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [pending, setPending] = useState<{ credential: string; email: string; fullName: string } | null>(null);
  const [details, setDetails] = useState({ fullName: "", phone: "", currentClass: "" });
  const [loading, setLoading] = useState(false);

  const send = async (credential: string, extra: Record<string, string> = {}) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/google", { credential, referredByCode, ...extra });
      if (res.data.needsDetails) {
        setPending({ credential, email: res.data.email, fullName: res.data.fullName || "" });
        setDetails((d) => ({ ...d, fullName: d.fullName || res.data.fullName || "" }));
        try { (window as any).gtag?.("event", "reg_start", { method: "google" }); } catch { /* analytics only */ }
        return;
      }
      onDone(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setEnabled(googleSignInEnabled()); }, []);

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
      if (!details.fullName.trim()) return toast.error("Enter your name");
      if (!details.currentClass) return toast.error("Choose your class");
      if (!/^[6-9]\d{9}$/.test(details.phone)) return toast.error("Enter your 10-digit WhatsApp number");
      send(pending.credential, { fullName: details.fullName.trim(), phone: details.phone, currentClass: details.currentClass });
    };
    return (
      <div className="rounded-2xl border-2 border-gold bg-gold/10 p-5 space-y-4">
        <p className="text-sm">Signed in as <b>{pending.email}</b>. Two quick details and you're in:</p>
        <div>
          <label className="text-sm font-medium">Your name</label>
          <input className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-2.5 bg-white focus:border-gold outline-none"
            value={details.fullName} onChange={(e) => setDetails({ ...details, fullName: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium">Class</label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {CLASSES.map((c) => (
              <button type="button" key={c} onClick={() => setDetails({ ...details, currentClass: c })}
                className={`py-2.5 rounded-lg border font-semibold text-sm ${details.currentClass === c ? "bg-gold text-ink border-gold" : "bg-white border-ink/15 hover:border-gold"}`}>
                {c === "Dropper" ? "Dropper" : `Class ${c}`}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">WhatsApp number <span className="text-ink/50 font-normal">(for doubt support)</span></label>
          <div className="mt-1 flex rounded-lg border border-ink/15 bg-white focus-within:border-gold overflow-hidden">
            <span className="px-3 flex items-center bg-ink/5 text-ink/60 text-sm">+91</span>
            <input className="flex-1 px-4 py-2.5 outline-none" type="tel" inputMode="numeric" maxLength={10} placeholder="98765 43210"
              value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} />
          </div>
        </div>
        <button type="button" onClick={finish} disabled={loading}
          className="w-full bg-gold text-ink font-bold text-lg py-3.5 rounded-full hover:brightness-95 disabled:opacity-60">
          {loading ? "Creating account…" : "Start My Free 30 Days →"}
        </button>
        <p className="text-center text-xs text-ink/55">✓ 30 days free · ✓ No payment or card · ✓ No auto-charge</p>
      </div>
    );
  }

  return (
    <div>
      <div ref={box} className="flex justify-center min-h-[44px]" />
      {loading && <p className="text-center text-xs text-ink/55 mt-2">Signing you in…</p>}
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
