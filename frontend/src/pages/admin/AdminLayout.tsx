import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, LogOut, ExternalLink } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { goToYneet } from "../../utils/yneet";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/students", label: "Registrations", icon: Users },
];

const AdminLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-[220px_1fr] gap-8">
      <aside className="space-y-1">
        <p className="text-xs uppercase tracking-widest text-ink/40 font-semibold mb-3 px-3">
          Admin · {user?.fullName?.split(" ")[0]}
        </p>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-gold text-ink" : "text-ink/70 hover:bg-ink/5"
              }`
            }
          >
            <l.icon size={17} />
            {l.label}
          </NavLink>
        ))}
        <button
          onClick={goToYneet}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-ink/70 hover:bg-ink/5 w-full"
        >
          <ExternalLink size={17} />
          YNeet Admin Panel
        </button>
        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-ink/70 hover:bg-ink/5 w-full"
        >
          <LogOut size={17} />
          Logout
        </button>
      </aside>
      <div>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
