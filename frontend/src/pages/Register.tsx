import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { goToYneet } from "../utils/yneet";
import { isAppMode } from "../utils/appMode";

const boards = ["CBSE", "Tamil Nadu State Board"];
// Class 9–Dropper. Course (Foundation/Coaching), board and NEET year are worked
// out on the server, so the form only asks for what's needed to start a trial.
const seniorClasses = ["9", "10", "11", "12", "Dropper"];

// Fire an Analytics event once per page visit (e.g. reg_start, so we can see how many start vs finish).
const fired = new Set<string>();
const trackOnce = (name: string) => {
  if (fired.has(name)) return;
  fired.add(name);
  try { (window as any).gtag?.("event", name); } catch { /* analytics only */ }
};

interface FormState {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  currentClass: string;
}

const initial: FormState = { fullName: "", phone: "", email: "", password: "", currentClass: "" };

const inputClass =
  "mt-1 w-full rounded-lg border border-ink/15 px-4 py-2.5 focus:border-gold outline-none";

// Report a completed registration to Google (Analytics + Ads) and Meta, then
// continue. The browser leaves for app.yneet.in right after, which used to cut
// the sign_up hit off before it was sent — so wait for Google's callback
// (max ~1.2 s) before redirecting.
function trackSignUpThen(next: () => void, plan: string, contentName: string) {
  let done = false;
  const go = () => { if (!done) { done = true; next(); } };
  try { (window as any).fbq?.("track", "CompleteRegistration", { content_name: contentName, status: true }); } catch { /* analytics only */ }
  try {
    const g = (window as any).gtag;
    if (typeof g === "function") {
      g("event", "sign_up", { method: "email", plan, transport_type: "beacon", event_callback: go, event_timeout: 1200 });
    } else go();
  } catch { go(); }
  setTimeout(go, 1500);
}

const Register = () => {
  const [showPw, setShowPw] = useState(false);
  const [searchParams] = useSearchParams();
  const referredByCode = searchParams.get("ref") || undefined;
  // Name and phone can arrive pre-filled from YNeet Daily (play.yneet.in), where the
  // student has already verified this number on WhatsApp.
  const [form, setForm] = useState<FormState>(() => ({
    ...initial,
    fullName: (searchParams.get("name") || "").slice(0, 60),
    phone: (searchParams.get("phone") || "").replace(/\D/g, "").slice(-10),
  }));
  // Class 6–8 is free and gets a one-screen form with the
  // parent's WhatsApp instead of gender/place. Links can open it with ?junior=1.
  const [junior, setJunior] = useState(searchParams.get("junior") === "1");
  const [jr, setJr] = useState({ currentClass: "", parentPhone: "", board: "CBSE" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const set = (key: keyof FormState, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const validateSenior = () => {
    if (!form.fullName.trim()) { toast.error("Enter your name"); return false; }
    if (!/^[6-9]\d{9}$/.test(form.phone)) { toast.error("Enter your 10-digit WhatsApp number"); return false; }
    if (!form.currentClass) { toast.error("Choose your class"); return false; }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) { toast.error("Enter a valid email"); return false; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return false; }
    return true;
  };

  const validateJunior = () => {
    if (!form.fullName.trim()) { toast.error("Enter the student's name"); return false; }
    if (!jr.currentClass) { toast.error("Choose the class"); return false; }
    if (jr.parentPhone.replace(/\D/g, "").length < 10) { toast.error("Enter your parent's 10-digit WhatsApp number"); return false; }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) { toast.error("Enter a valid email"); return false; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return false; }
    return true;
  };

  const submitJunior = async () => {
    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        fullName: form.fullName.trim(), email: form.email, password: form.password,
        board: jr.board, course: "NEET Foundation", currentClass: jr.currentClass,
        parentPhone: jr.parentPhone.replace(/\D/g, "").slice(-10),
        phone: form.phone.replace(/\D/g, "").slice(-10) || undefined,
        referredByCode,
      });
      login(res.data.token, res.data.user);
      toast.success("Welcome to YNeet!");
      trackSignUpThen(goToYneet, "junior_free", "YNeet Junior free");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    setLoading(true);
    try {
      const payload = { ...form, fullName: form.fullName.trim(), referredByCode };
      const res = await api.post("/auth/register", payload);
      login(res.data.token, res.data.user);
      toast.success("Welcome to YNeet!");
      // Google Analytics / Ads + Meta conversion, then straight into YNeet (see Login.tsx).
      trackSignUpThen(goToYneet, "trial_30d", "YNeet free trial");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-center">Register for YNeet</h1>
      <div className="mt-4 rounded-2xl bg-gold/15 border border-gold/40 px-4 py-3 text-center">
        <p className="font-semibold text-ink">{junior ? "🎁 Free for Class 6–8 — class tests, daily puzzles, quiz and Shorts" : "🎁 Your first 30 days are FREE — full access to every NEET test"}</p>
        <p className="text-sm text-ink/70 mt-0.5">{junior ? "No payment, ever." : "Starts automatically when you register. No payment, no card, no auto-charge."}</p>
      </div>

      {/* Which path? Class 6–8 get the short, free form. */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setJunior(true)}
          className={`rounded-2xl border-2 p-4 text-left transition-colors ${junior ? "border-rise bg-rise/10" : "border-ink/10 bg-white hover:border-rise/50"}`}>
          <p className="font-display font-bold">Class 6–8</p>
          <p className="text-sm text-rise-dark font-semibold">Free · 1-minute sign-up</p>
        </button>
        <button type="button" onClick={() => setJunior(false)}
          className={`rounded-2xl border-2 p-4 text-left transition-colors ${!junior ? "border-gold bg-gold/10" : "border-ink/10 bg-white hover:border-gold/50"}`}>
          <p className="font-display font-bold">Class 9 – Dropper</p>
          <p className="text-sm text-ink/60">{isAppMode() ? "30 days free · no payment needed" : "30 days free, then from ₹299/month"}</p>
        </button>
      </div>

      {junior && (
        <div className="mt-8 bg-white p-7 rounded-2xl border border-ink/10 space-y-4">
          <div>
            <label className="text-sm font-medium">Student's name</label>
            <input className={inputClass} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Riya Kumar" />
          </div>
          <div>
            <label className="text-sm font-medium">Class</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {["6", "7", "8"].map((c) => (
                <button type="button" key={c} onClick={() => setJr({ ...jr, currentClass: c })}
                  className={`py-2.5 rounded-lg border font-semibold ${jr.currentClass === c ? "bg-rise text-white border-rise" : "border-ink/15 hover:border-rise"}`}>Class {c}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Parent's WhatsApp number</label>
            <input className={inputClass} inputMode="numeric" value={jr.parentPhone} onChange={(e) => setJr({ ...jr, parentPhone: e.target.value })} placeholder="98765 43210" />
            <p className="text-xs text-ink/50 mt-1">Parents get a free weekly progress report on WhatsApp.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Email (student's or parent's)</label>
              <input type="email" className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@gmail.com" />
            </div>
            <div>
              <label className="text-sm font-medium">Create a password</label>
              <input type="password" className={inputClass} value={form.password} onChange={(e) => set("password", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Board</label>
            <select className={inputClass} value={jr.board} onChange={(e) => setJr({ ...jr, board: e.target.value })}>
              {boards.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>

          <button type="button" onClick={() => validateJunior() && submitJunior()} disabled={loading}
            className="w-full bg-rise text-white font-semibold py-3 rounded-full hover:bg-rise-dark disabled:opacity-60">
            {loading ? "Creating account…" : "Create free account"}
          </button>
        </div>
      )}

      {!junior && (
        <div className="mt-8 bg-white p-7 rounded-2xl border border-ink/10 space-y-4">
          <div>
            <label className="text-sm font-medium">Full name</label>
            <input className={inputClass} value={form.fullName} autoComplete="name"
              onFocus={() => trackOnce("reg_start")}
              onChange={(e) => set("fullName", e.target.value)} placeholder="Riya Kumar" />
          </div>
          <div>
            <label className="text-sm font-medium">WhatsApp number <span className="text-ink/50 font-normal">(for doubt support)</span></label>
            <div className="mt-1 flex rounded-lg border border-ink/15 focus-within:border-gold overflow-hidden">
              <span className="px-3 flex items-center bg-ink/5 text-ink/60 text-sm">+91</span>
              <input className="flex-1 px-4 py-2.5 outline-none" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10}
                value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="98765 43210" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Class</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {seniorClasses.map((c) => (
                <button type="button" key={c} onClick={() => set("currentClass", c)}
                  className={`py-2.5 rounded-lg border font-semibold text-sm ${form.currentClass === c ? "bg-gold text-ink border-gold" : "border-ink/15 hover:border-gold"}`}>
                  {c === "Dropper" ? "Dropper" : `Class ${c}`}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Email <span className="text-ink/50 font-normal">(you'll log in with this)</span></label>
            <input type="email" inputMode="email" autoComplete="email" className={inputClass} value={form.email}
              onChange={(e) => set("email", e.target.value.trim())} placeholder="name@gmail.com" />
          </div>
          <div>
            <label className="text-sm font-medium">Create a password</label>
            <div className="mt-1 flex rounded-lg border border-ink/15 focus-within:border-gold overflow-hidden">
              <input className="flex-1 px-4 py-2.5 outline-none" type={showPw ? "text" : "password"} autoComplete="new-password"
                value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="At least 6 characters" />
              <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"}
                className="px-3 text-ink/50 hover:text-ink">{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>

          <button type="button" onClick={() => validateSenior() && submit()} disabled={loading}
            className="w-full bg-gold text-ink font-bold text-lg py-3.5 rounded-full hover:brightness-95 disabled:opacity-60">
            {loading ? "Creating account…" : "Start My Free 30 Days →"}
          </button>
          <p className="text-center text-xs text-ink/55">No payment. No card. Confirm your WhatsApp inside YNeet within 3 days (takes 10 seconds).</p>
        </div>
      )}
    </div>
  );
};

export default Register;
