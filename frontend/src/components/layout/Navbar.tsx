import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Sun, Moon, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { SITE } from "../../utils/siteInfo";
import { goToYneet } from "../../utils/yneet";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/courses", label: "Courses" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-50 bg-paper/90 dark:bg-ink/95 backdrop-blur border-b border-ink/10">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={SITE.logoUrl} alt={SITE.name} className="h-9 w-9 rounded-lg object-cover" />
          <span className="font-display font-bold text-lg text-ink dark:text-paper">
            {SITE.name}
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-6">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? "text-gold-dark"
                    : "text-ink/70 dark:text-paper/70 hover:text-ink dark:hover:text-paper"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <button
            aria-label="Toggle dark mode"
            onClick={() => setDark((d) => !d)}
            className="p-2 rounded-full hover:bg-ink/5 dark:hover:bg-paper/10"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {!user && (
            <>
              <Link
                to="/login"
                className="text-sm font-semibold px-4 py-2 rounded-full border border-ink/15 hover:border-ink/30 transition-colors"
              >
                Student Login
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold px-4 py-2 rounded-full bg-gold text-ink hover:bg-gold-dark transition-colors"
              >
                Enroll Now
              </Link>
            </>
          )}

          {user && (
            <>
              <Link
                to={user.role === "admin" ? "/admin" : "/dashboard"}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full border border-ink/15 hover:border-ink/30 transition-colors"
              >
                <LayoutDashboard size={16} />
                {user.role === "admin" ? "Admin" : "Dashboard"}
              </Link>
              {user.role !== "admin" && (
                <button
                  onClick={goToYneet}
                  className="text-sm font-semibold px-4 py-2 rounded-full bg-gold text-ink hover:bg-gold-dark transition-colors"
                >
                  YNeet
                </button>
              )}
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full bg-ink text-paper hover:bg-ink-light transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          )}
        </div>

        <button className="lg:hidden p-2" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {open && (
        <div className="lg:hidden border-t border-ink/10 bg-paper dark:bg-ink px-4 py-4 space-y-3">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block text-sm font-medium py-1.5"
            >
              {l.label}
            </NavLink>
          ))}
          <div className="flex gap-3 pt-2">
            {!user ? (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="flex-1 text-center text-sm font-semibold px-4 py-2 rounded-full border border-ink/15">
                  Login
                </Link>
                <Link to="/register" onClick={() => setOpen(false)} className="flex-1 text-center text-sm font-semibold px-4 py-2 rounded-full bg-gold text-ink">
                  Enroll Now
                </Link>
              </>
            ) : (
              <div className="flex-1 flex flex-col gap-2">
                <Link
                  to={user.role === "admin" ? "/admin" : "/dashboard"}
                  onClick={() => setOpen(false)}
                  className="text-center text-sm font-semibold px-4 py-2 rounded-full bg-ink text-paper"
                >
                  {user.role === "admin" ? "Admin" : "Dashboard"}
                </Link>
                {user.role !== "admin" && (
                  <button
                    onClick={() => { setOpen(false); goToYneet(); }}
                    className="text-center text-sm font-semibold px-4 py-2 rounded-full bg-gold text-ink"
                  >
                    YNeet
                  </button>
                )}
                <button
                  onClick={() => {
                    setOpen(false);
                    logout();
                    navigate("/");
                  }}
                  className="flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full border border-ink/15"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
