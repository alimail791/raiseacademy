import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import instituteApi, { INST_TOKEN } from "../../api/instituteApi";

const input = "mt-1 w-full rounded-lg border border-ink/15 px-4 py-2.5 focus:border-gold outline-none";

const InstituteForgot = () => {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const { data } = await instituteApi.post("/forgot", { email });
      toast.success(data.message);
      setStep("reset");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not send the code");
    } finally { setLoading(false); }
  };

  const reset = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    setLoading(true);
    try {
      const { data } = await instituteApi.post("/reset-password", { email, code, newPassword: password });
      localStorage.setItem(INST_TOKEN, data.token);
      toast.success("Password changed. You're logged in.");
      navigate("/institute");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not reset password");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <h1 className="font-display text-3xl font-bold text-center">Reset Institute Password</h1>
      {step === "email" ? (
        <form onSubmit={sendCode} className="mt-8 space-y-4 bg-white p-7 rounded-2xl border border-ink/10">
          <p className="text-sm text-ink/60">Enter your institute's login email. We'll email you a 6-digit code.</p>
          <div>
            <label className="text-sm font-medium">Institute email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          </div>
          <button disabled={loading} className="w-full bg-gold text-ink font-semibold py-3 rounded-full hover:bg-gold-dark transition-colors disabled:opacity-60">
            {loading ? "Sending..." : "Send code"}
          </button>
          <p className="text-sm text-center"><Link to="/institute/login" className="text-rise-dark hover:underline">Back to login</Link></p>
        </form>
      ) : (
        <form onSubmit={reset} className="mt-8 space-y-4 bg-white p-7 rounded-2xl border border-ink/10">
          <p className="text-sm text-ink/60">Check <b>{email}</b> for the 6-digit code (also check Spam). It is valid for 10 minutes.</p>
          <div>
            <label className="text-sm font-medium">6-digit code</label>
            <input required inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className={`${input} tracking-[0.4em] text-lg`} />
          </div>
          <div>
            <label className="text-sm font-medium">New password (6+ characters)</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
          </div>
          <div>
            <label className="text-sm font-medium">Confirm new password</label>
            <input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
          </div>
          <button disabled={loading} className="w-full bg-gold text-ink font-semibold py-3 rounded-full hover:bg-gold-dark transition-colors disabled:opacity-60">
            {loading ? "Saving..." : "Set new password"}
          </button>
          <div className="flex justify-between text-sm">
            <button type="button" onClick={() => setStep("email")} className="text-rise-dark hover:underline">Change email</button>
            <button type="button" disabled={loading} onClick={() => sendCode()} className="text-rise-dark hover:underline">Resend code</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default InstituteForgot;
