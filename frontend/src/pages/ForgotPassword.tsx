import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";

const ForgotPassword = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const sendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/otp/send", { email, purpose: "reset" });
      toast.success("OTP sent to your email");
      setStep(2);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/otp/verify", { email, purpose: "reset", code });
      toast.success("OTP verified");
      setStep(3);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, newPassword });
      toast.success("Password reset! Please log in.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <h1 className="font-display text-3xl font-bold text-center">Reset Password</h1>
      <div className="mt-8 bg-white p-7 rounded-2xl border border-ink/10">
        {step === 1 && (
          <form onSubmit={sendOtp} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Registered Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-2.5 focus:border-gold outline-none"
              />
            </div>
            <button disabled={loading} className="w-full bg-gold text-ink font-semibold py-3 rounded-full hover:bg-gold-dark disabled:opacity-60">
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={verifyOtp} className="space-y-4">
            <p className="text-sm text-ink/60">Enter the 6-digit code sent to {email}</p>
            <input
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full text-center tracking-[0.5em] text-xl rounded-lg border border-ink/15 px-4 py-2.5 focus:border-gold outline-none"
            />
            <button disabled={loading} className="w-full bg-gold text-ink font-semibold py-3 rounded-full hover:bg-gold-dark disabled:opacity-60">
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={resetPassword} className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-2.5 focus:border-gold outline-none"
              />
            </div>
            <button disabled={loading} className="w-full bg-gold text-ink font-semibold py-3 rounded-full hover:bg-gold-dark disabled:opacity-60">
              {loading ? "Saving..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
