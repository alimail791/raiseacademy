import { useEffect, useState } from "react";
import { Users, GraduationCap, Stethoscope, Sparkles } from "lucide-react";
import api from "../../api/axios";

const AdminDashboard = () => {
  const [counts, setCounts] = useState({ total: 0, schoolTuition: 0, neetCoaching: 0, yneetSubscribed: 0 });

  useEffect(() => {
    api
      .get("/content/students")
      .then((res) => {
        const students = res.data.students || [];
        setCounts({
          total: students.length,
          schoolTuition: students.filter((s: any) => s.course === "School Tuition").length,
          neetCoaching: students.filter((s: any) => s.course === "NEET Coaching").length,
          yneetSubscribed: students.filter((s: any) => s.yneetSubscribed).length,
        });
      })
      .catch(() => {});
  }, []);

  const cards = [
    { label: "Total Registrations", value: counts.total, icon: Users },
    { label: "School Tuition", value: counts.schoolTuition, icon: GraduationCap },
    { label: "NEET Coaching", value: counts.neetCoaching, icon: Stethoscope },
    { label: "Active YNeet Subscribers", value: counts.yneetSubscribed, icon: Sparkles },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
      <p className="text-ink/60 text-sm mt-1">Overview of everything happening at YNeet.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
        {cards.map((c) => (
          <div key={c.label} className="p-6 rounded-2xl border border-ink/10">
            <c.icon className="text-rise-dark" size={22} />
            <p className="font-display text-3xl font-bold mt-3">{c.value}</p>
            <p className="text-ink/60 text-sm mt-1">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
