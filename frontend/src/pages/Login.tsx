import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { goToYneet } from "../utils/yneet";
import GoogleSignIn, { OrDivider } from "../components/GoogleSignIn";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.fullName.split(" ")[0]}!`);
      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        // Students go straight into YNeet — Raise Academy's own dashboard is
        // skipped entirely, since the point of logging in here is to reach
        // YNeet's subscription/study tools, not to browse this site further.
        goToYneet();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <h1 className="font-display text-3xl font-bold text-center">Student Login</h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4 bg-white p-7 rounded-2xl border border-ink/10">
        <GoogleSignIn text="continue_with" onDone={(d) => {
          login(d.token, d.user);
          toast.success(d.isNew ? "Welcome to YNeet!" : `Welcome back, ${d.user.fullName.split(" ")[0]}!`);
          if (d.isNew) { try { (window as any).gtag?.("event", "sign_up", { method: "google", plan: "trial_30d" }); } catch { /* analytics only */ } }
          if (d.user.role === "admin") navigate("/admin"); else setTimeout(goToYneet, d.isNew ? 800 : 0);
        }} />
        <OrDivider label="or log in with email" />
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-2.5 focus:border-gold outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-2.5 focus:border-gold outline-none"
          />
        </div>
        <button
          disabled={loading}
          className="w-full bg-gold text-ink font-semibold py-3 rounded-full hover:bg-gold-dark transition-colors disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <div className="flex justify-between text-sm pt-1">
          <Link to="/forgot-password" className="text-rise-dark hover:underline">Forgot password?</Link>
          <Link to="/register" className="text-rise-dark hover:underline">Create account</Link>
        </div>
      </form>
    </div>
  );
};

export default Login;
