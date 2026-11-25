import { useEffect, useState } from "react";
import { Users, Hourglass, Stethoscope, Sparkles } from "lucide-react";
import api from "../../api/axios";
import SignupSources from "./SignupSources";
import TrafficSignups from "./TrafficSignups";
import TrialsEnding, { type Trial } from "./TrialsEnding";

const AdminDashboard = () => {
  const [counts, setCounts] = useState({ total: 0, neetCoaching: 0, yneetSubscribed: 0 });
  // null = loading, false = couldn't load
  const [trials, setTrials] = useState<Trial[] | null | false>(null);

  useEffect(() => {
    api.get("/content/trials-ending?days=7").then((r) => setTrials(r.data.trials || [])).catch(() => setTrials(false));
  }, []);

  useEffect(() => {
    api
      .get("/content/students")
      .then((res) => {
        const students = res.data.students || [];
        setCounts({
          total: students.length,
          neetCoaching: students.filter((s: any) => s.course === "NEET Coaching").length,
          yneetSubscribed: students.filter((s: any) => s.yneetSubscribed).length,
        });
      })
      .catch(() => {});
  }, []);

  const cards: { label: string; value: number | string; icon: typeof Users; href?: string }[] = [
    { label: "Total Registrations", value: counts.total, icon: Users },
    { label: "Trials ending this week", value: trials === null ? "…" : trials === false ? "—" : trials.length, icon: Hourglass, href: "#trials-ending" },
    { label: "NEET Coaching", value: counts.neetCoaching, icon: Stethoscope },
    { label: "Active YNeet Subscribers", value: counts.yneetSubscribed, icon: Sparkles },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
      <p className="text-ink/70 text-sm mt-1">Overview of everything happening at YNeet.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
        {cards.map((c) => {
          const body = (
            <>
              <c.icon className="text-rise-dark" size={22} />
              <p className="font-display text-3xl font-bold mt-3">{c.value}</p>
              <p className="text-ink/70 text-sm mt-1">{c.label}</p>
            </>
          );
          return c.href ? (
            <a key={c.label} href={c.href} className="block p-6 rounded-2xl border border-gold/60 bg-gold/5 hover:bg-gold/10">{body}</a>
          ) : (
            <div key={c.label} className="p-6 rounded-2xl border border-ink/10">{body}</div>
          );
        })}
      </div>
      <TrafficSignups />
      <TrialsEnding trials={trials} />
      <SignupSources />
    </div>
  );
};

export default AdminDashboard;
