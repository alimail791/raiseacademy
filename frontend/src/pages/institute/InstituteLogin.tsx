import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import instituteApi, { INST_TOKEN } from "../../api/instituteApi";
import { SITE } from "../../utils/siteInfo";

const InstituteLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await instituteApi.post("/login", { email, password });
      localStorage.setItem(INST_TOKEN, data.token);
      navigate("/institute");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <h1 className="font-display text-3xl font-bold text-center">Institute Login</h1>
      <p className="text-center text-ink/60 text-sm mt-2">For schools and coaching centres with a YNeet student pack.</p>
      <form onSubmit={submit} className="mt-8 space-y-4 bg-white p-7 rounded-2xl border border-ink/10">
        <div>
          <label className="text-sm font-medium">Institute email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-2.5 focus:border-gold outline-none" />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-2.5 focus:border-gold outline-none" />
        </div>
        <button disabled={loading}
          className="w-full bg-gold text-ink font-semibold py-3 rounded-full hover:bg-gold-dark transition-colors disabled:opacity-60">
          {loading ? "Logging in..." : "Login"}
        </button>
        <div className="text-sm text-center">
          <Link to="/institute/forgot" className="text-rise-dark hover:underline">Forgot password?</Link>
        </div>
        <p className="text-xs text-ink/50 text-center pt-1">
          Want a student pack for your institute?{" "}
          <a className="text-rise-dark hover:underline" target="_blank" rel="noreferrer"
            href={`https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent("Hi YNeet, I'm asking about the institute student pack.")}`}>
            WhatsApp us
          </a>
        </p>
      </form>
    </div>
  );
};

export default InstituteLogin;
