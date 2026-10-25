import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Check } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { goToYneet } from "../utils/yneet";

const boards = ["CBSE", "Tamil Nadu State Board"];
const courses = ["NEET Foundation", "NEET Coaching"];
// NEET Foundation = classes 6-10 (early foundation building).
// NEET Coaching = classes 11, 12, or Dropper/Repeater (full NEET prep intensity).
const foundationClasses = ["9", "10"]; // Class 6–8 use the short free form
const coachingClasses = ["11", "12", "Dropper"];
const neetYears = [2027, 2028, 2029, 2030];

interface FormState {
  fullName: string;
  gender: string;
  phone: string;
  email: string;
  place: string;
  password: string;
  board: string;
  course: string;
  currentClass: string;
  neetExamYear: string;
}

const initial: FormState = {
  fullName: "",
  gender: "",
  phone: "",
  email: "",
  place: "",
  password: "",
  board: "",
  course: "",
  currentClass: "",
  neetExamYear: "",
};

const steps = ["Personal Details", "Academic Details", "Verify Email", "Review & Submit"];

const inputClass =
  "mt-1 w-full rounded-lg border border-ink/15 px-4 py-2.5 focus:border-gold outline-none";

const Register = () => {
  const [step, setStep] = useState(0);
  const [searchParams] = useSearchParams();
  const referredByCode = searchParams.get("ref") || undefined;
  // Name and phone can arrive pre-filled from YNeet Daily (play.yneet.in), where the
  // student has already verified this number on WhatsApp.
  const [form, setForm] = useState<FormState>(() => ({
    ...initial,
    fullName: (searchParams.get("name") || "").slice(0, 60),
    phone: (searchParams.get("phone") || "").replace(/\D/g, "").slice(-10),
  }));
  // Class 6–8 is free and gets a one-screen form (plus email OTP) with the
  // parent's WhatsApp instead of gender/place. Links can open it with ?junior=1.
  const [junior, setJunior] = useState(searchParams.get("junior") === "1");
  const [jr, setJr] = useState({ currentClass: "", parentPhone: "", board: "CBSE" });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const set = (key: keyof FormState, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const validateStep = (s: number) => {
    if (s === 0) {
      if (!form.fullName || !form.gender || !form.phone || !form.email || !form.place || !form.password) {
        toast.error("Please fill in every field");
        return false;
      }
      if (form.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return false;
      }
    }
    if (s === 1) {
      if (!form.board || !form.course) {
        toast.error("Please select board and course");
        return false;
      }
      if (!form.currentClass) {
        toast.error("Please select your class");
        return false;
      }
      if (form.course === "NEET Coaching" && !form.neetExamYear) {
        toast.error("Please select your expected NEET year");
        return false;
      }
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const sendOtp = async () => {
    setLoading(true);
    try {
      await api.post("/otp/send", { email: form.email, purpose: "register" });
      setOtpSent(true);
      toast.success("OTP sent to your email");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      await api.post("/otp/verify", { email: form.email, purpose: "register", code: otp });
      setOtpVerified(true);
      toast.success("Email verified!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
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
    if (!otpVerified) { toast.error("Please verify your email OTP first"); return; }
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
      try { (window as any).gtag?.("event", "sign_up", { method: "email", plan: "junior_free", transport_type: "beacon" }); } catch { /* analytics only */ }
      try { (window as any).fbq?.("track", "CompleteRegistration", { content_name: "YNeet Junior free", status: true }); } catch { /* analytics only */ }
      toast.success("Welcome to YNeet!");
      goToYneet();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!otpVerified) {
      toast.error("Please verify your email OTP first");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        neetExamYear: form.neetExamYear ? Number(form.neetExamYear) : undefined,
        referredByCode,
      };
      const res = await api.post("/auth/register", payload);
      login(res.data.token, res.data.user);
      // Google Analytics / Ads conversion: a completed registration.
      try { (window as any).gtag?.("event", "sign_up", { method: "email", transport_type: "beacon" }); } catch { /* analytics must never block sign-up */ }
      // Meta (Instagram/Facebook ads) conversion: a completed registration.
      try { (window as any).fbq?.("track", "CompleteRegistration", { content_name: "YNeet free trial", status: true }); } catch { /* analytics only */ }
      toast.success("Welcome to YNeet!");
      // Straight into YNeet — see the same change in Login.tsx for why.
      goToYneet();
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
        <p className="font-semibold text-ink">{junior ? "🎁 Free for Class 6–8 — daily puzzles, quiz and Shorts" : "🎁 Your first 30 days are FREE — full access to every NEET test"}</p>
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
          <p className="text-sm text-ink/60">30 days free, then from ₹299/month</p>
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
              <input type="email" className={inputClass} value={form.email} disabled={otpSent} onChange={(e) => set("email", e.target.value)} placeholder="name@gmail.com" />
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

          <div className="rounded-xl bg-ink/[0.03] p-4 text-center space-y-3">
            {!otpSent && (
              <button type="button" disabled={loading} onClick={() => validateJunior() && sendOtp()}
                className="w-full bg-gold text-ink font-semibold py-3 rounded-full hover:bg-gold-dark disabled:opacity-60">
                {loading ? "Sending…" : "Send code to email"}
              </button>
            )}
            {otpSent && !otpVerified && (
              <>
                <p className="text-sm text-ink/70">Enter the 6-digit code sent to <b>{form.email}</b></p>
                <input maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)}
                  className="w-full max-w-xs mx-auto block text-center tracking-[0.5em] text-xl rounded-lg border border-ink/15 px-4 py-2.5 focus:border-gold outline-none" />
                <button type="button" onClick={verifyOtp} disabled={loading} className="w-full max-w-xs bg-gold text-ink font-semibold py-2.5 rounded-full hover:bg-gold-dark disabled:opacity-60">
                  {loading ? "Verifying…" : "Verify code"}
                </button>
                <button type="button" onClick={sendOtp} className="block mx-auto text-sm text-rise-dark hover:underline">Resend code</button>
              </>
            )}
            {otpVerified && (
              <>
                <p className="text-rise-dark font-semibold flex items-center justify-center gap-2"><Check size={18} /> Email verified</p>
                <button type="button" onClick={() => validateJunior() && submitJunior()} disabled={loading}
                  className="w-full bg-rise text-white font-semibold py-3 rounded-full hover:bg-rise-dark disabled:opacity-60">
                  {loading ? "Creating account…" : "Create free account"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {!junior && <>
      {/* Stepper */}
      <div className="flex items-center justify-between mt-8 mb-10">
        {steps.map((label, i) => (
          <div key={label} className="flex-1 flex items-center">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                i < step ? "bg-rise text-white" : i === step ? "bg-gold text-ink" : "bg-ink/10 text-ink/40"
              }`}
            >
              {i < step ? <Check size={16} /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 ${i < step ? "bg-rise" : "bg-ink/10"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white p-7 rounded-2xl border border-ink/10 min-h-[320px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <input className={inputClass} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Gender</label>
                  <select className={inputClass} value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone Number</label>
                  <input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input type="email" className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Place</label>
                  <input className={inputClass} value={form.place} onChange={(e) => set("place", e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Password</label>
                  <input type="password" className={inputClass} value={form.password} onChange={(e) => set("password", e.target.value)} />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Board</label>
                  <select className={inputClass} value={form.board} onChange={(e) => set("board", e.target.value)}>
                    <option value="">Select</option>
                    {boards.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Course</label>
                  <select
                    className={inputClass}
                    value={form.course}
                    onChange={(e) => {
                      set("course", e.target.value);
                      set("currentClass", ""); // options differ per course, so clear any stale pick
                    }}
                  >
                    <option value="">Select</option>
                    {courses.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>

                {form.course === "NEET Foundation" && (
                  <div>
                    <label className="text-sm font-medium">Class</label>
                    <select className={inputClass} value={form.currentClass} onChange={(e) => set("currentClass", e.target.value)}>
                      <option value="">Select</option>
                      {foundationClasses.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                )}

                {form.course === "NEET Coaching" && (
                  <>
                    <div>
                      <label className="text-sm font-medium">Current Class</label>
                      <select className={inputClass} value={form.currentClass} onChange={(e) => set("currentClass", e.target.value)}>
                        <option value="">Select</option>
                        {coachingClasses.map((c) => <option key={c} value={c}>{c === "Dropper" ? "Dropper / Repeater" : c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Expected NEET Exam Year</label>
                      <select className={inputClass} value={form.neetExamYear} onChange={(e) => set("neetExamYear", e.target.value)}>
                        <option value="">Select</option>
                        {neetYears.map((y) => <option key={y}>{y}</option>)}
                      </select>
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 text-center">
                <p className="text-ink/70">
                  We'll send a 6-digit code to <span className="font-semibold text-ink">{form.email}</span> to verify your email.
                </p>
                {!otpSent && (
                  <button onClick={sendOtp} disabled={loading} className="bg-gold text-ink font-semibold px-6 py-2.5 rounded-full hover:bg-gold-dark disabled:opacity-60">
                    {loading ? "Sending..." : "Send OTP"}
                  </button>
                )}
                {otpSent && !otpVerified && (
                  <div className="space-y-3 max-w-xs mx-auto">
                    <input
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full text-center tracking-[0.5em] text-xl rounded-lg border border-ink/15 px-4 py-2.5 focus:border-gold outline-none"
                    />
                    <button onClick={verifyOtp} disabled={loading} className="w-full bg-gold text-ink font-semibold py-2.5 rounded-full hover:bg-gold-dark disabled:opacity-60">
                      {loading ? "Verifying..." : "Verify OTP"}
                    </button>
                    <button onClick={sendOtp} className="text-sm text-rise-dark hover:underline">Resend OTP</button>
                  </div>
                )}
                {otpVerified && (
                  <p className="text-rise-dark font-semibold flex items-center justify-center gap-2">
                    <Check size={18} /> Email verified
                  </p>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-2 text-sm text-ink/80">
                <p><span className="font-semibold">Name:</span> {form.fullName}</p>
                <p><span className="font-semibold">Email:</span> {form.email}</p>
                <p><span className="font-semibold">Phone:</span> {form.phone}</p>
                <p><span className="font-semibold">Board:</span> {form.board}</p>
                <p><span className="font-semibold">Course:</span> {form.course}</p>
                {form.currentClass && <p><span className="font-semibold">Class:</span> {form.currentClass === "Dropper" ? "Dropper / Repeater" : form.currentClass}</p>}
                {form.neetExamYear && <p><span className="font-semibold">Expected NEET Year:</span> {form.neetExamYear}</p>}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={goBack}
          disabled={step === 0}
          className="px-5 py-2.5 rounded-full border border-ink/15 font-semibold disabled:opacity-30"
        >
          Back
        </button>
        {step < steps.length - 1 ? (
          <button onClick={goNext} className="px-6 py-2.5 rounded-full bg-ink text-paper font-semibold">
            Next
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={loading || !otpVerified}
            className="px-6 py-2.5 rounded-full bg-gold text-ink font-semibold disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Complete Registration"}
          </button>
        )}
      </div>
      </>}
    </div>
  );
};

export default Register;
