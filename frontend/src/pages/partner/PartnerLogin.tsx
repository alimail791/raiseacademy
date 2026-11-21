import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import partnerApi, { SP_TOKEN } from "../../api/partnerApi";

const box = "mt-1 w-full rounded-lg border border-ink/15 px-4 py-2.5 focus:border-gold outline-none";

export default function PartnerLogin() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [forgot, setForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (forgot) {
        const { data } = await partnerApi.post("/forgot", { login });
        toast.success(data.message);
        setForgot(false);
      } else {
        const { data } = await partnerApi.post("/login", { login, password });
        localStorage.setItem(SP_TOKEN, data.token);
        navigate("/partner/dashboard");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <h1 className="font-display text-3xl font-bold text-center">{forgot ? "Reset password" : "Partner Login"}</h1>
      <p className="text-center text-ink/70 text-sm mt-2">{forgot ? "We'll email you a new password." : "For YNeet sales partners."}</p>
      <form onSubmit={submit} className="mt-8 space-y-4 bg-white p-7 rounded-2xl border border-ink/10">
        <div>
          <label className="text-sm font-medium">WhatsApp number or email</label>
          <input required value={login} onChange={(e) => setLogin(e.target.value)} className={box} />
        </div>
        {!forgot && (
          <div>
            <label className="text-sm font-medium">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={box} />
          </div>
        )}
        <button disabled={loading} className="w-full bg-gold text-ink font-semibold py-3 rounded-full hover:bg-gold-dark transition-colors disabled:opacity-60">
          {loading ? "Please wait..." : forgot ? "Email me a new password" : "Login"}
        </button>
        <div className="text-sm text-center">
          <button type="button" onClick={() => setForgot(!forgot)} className="text-rise-dark hover:underline">{forgot ? "Back to login" : "Forgot password?"}</button>
        </div>
        <p className="text-xs text-ink/70 text-center pt-1">Not a partner yet? <Link to="/partner#join" className="text-rise-dark hover:underline">Join free</Link></p>
      </form>
    </div>
  );
}
