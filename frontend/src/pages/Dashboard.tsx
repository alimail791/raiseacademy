import { Link } from "react-router-dom";
import { GraduationCap, BookOpen, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { goToYneet } from "../utils/yneet";

const Dashboard = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
      <h1 className="font-display text-3xl font-bold">
        Welcome back, {user.fullName.split(" ")[0]} 👋
      </h1>
      <p className="text-ink/60 mt-1">
        {user.course}
        {user.currentClass ? ` · ${user.currentClass === "Dropper" ? "Dropper / Repeater" : `Class ${user.currentClass}`}` : ""}
      </p>

      <div className="grid sm:grid-cols-2 gap-5 mt-10">
        <div className="p-6 rounded-2xl border border-ink/10">
          <BookOpen className="text-rise-dark" size={22} />
          <p className="font-display text-3xl font-bold mt-3">{user.board}</p>
          <p className="text-ink/60 text-sm mt-1">Board</p>
        </div>
        <button
          onClick={goToYneet}
          className="p-6 rounded-2xl bg-gold text-ink hover:bg-gold-dark transition-colors flex flex-col justify-between text-left"
        >
          <GraduationCap size={22} />
          <div>
            <p className="font-display font-semibold mt-3">
              {user.yneetSubscribed ? "Continue on YNeet" : "Start NEET Prep on YNeet"}
            </p>
            <p className="text-ink/70 text-sm mt-1 flex items-center gap-1">
              Mock tests, quizzes & more <ArrowRight size={14} />
            </p>
          </div>
        </button>
      </div>

      <div className="mt-12 p-6 rounded-2xl border border-ink/10">
        <h3 className="font-display font-semibold text-lg">Quick Links</h3>
        <ul className="mt-4 space-y-2 text-sm">
          <li><button onClick={goToYneet} className="text-rise-dark hover:underline">Open YNeet — NEET Prep</button></li>
          <li><Link to="/courses" className="text-rise-dark hover:underline">Browse Courses</Link></li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
