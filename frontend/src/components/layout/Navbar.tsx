import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Sun, Moon, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { SITE, gamesLink } from "../../utils/siteInfo";
import { PRACTICE, STUDY, TOOLS, FREE_GROUPS, type NavGroup, type NavItem } from "../../utils/navLinks";
import { goToYneet } from "../../utils/yneet";

const links = [
  { to: "/courses", label: "Courses" },
  { to: "/blog", label: "Blog" },
  { to: "/institutes", label: "For Institutes" },
];

// Header dropdowns: "Free Practice" = practice + study material, "NEET Tools" = exam tools.
const MENUS: { key: string; label: string; groups: NavGroup[] }[] = [
  { key: "practice", label: "Free Practice", groups: [PRACTICE, STUDY] },
  { key: "tools", label: "NEET Tools", groups: [TOOLS] },
];

function MenuLink({ item, onClick, compact }: { item: NavItem; onClick?: () => void; compact?: boolean }) {
  const text = compact ? item.short || item.label : item.label;
  const cls = compact
    ? "flex items-center gap-1.5 text-sm font-medium py-1.5"
    : "flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-ink/80 dark:text-paper/80 hover:bg-gold/15";
  const badge = item.isNew && (
    <span className="text-[10px] font-bold uppercase tracking-wide bg-gold text-ink px-1.5 py-0.5 rounded">New</span>
  );
  return item.to ? (
    <Link to={item.to} onClick={onClick} className={cls}>{text}{badge}</Link>
  ) : (
    <a href={item.href} target="_blank" rel="noopener" onClick={onClick} className={cls}>{text}{badge}</a>
  );
}

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<string | null>(null); // open desktop dropdown
  const [section, setSection] = useState<string | null>(PRACTICE.title); // open phone-menu section
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
          <NavLink
            to="/courses"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive ? "text-gold-deep dark:text-gold" : "text-ink/70 dark:text-paper/70 hover:text-ink dark:hover:text-paper"
              }`
            }
          >
            Courses
          </NavLink>
          {MENUS.map((m) => (
            <div key={m.key} className="relative" onMouseLeave={() => setMenu(null)}>
              <button
                onClick={() => setMenu((v) => (v === m.key ? null : m.key))}
                onMouseEnter={() => setMenu(m.key)}
                aria-expanded={menu === m.key}
                className="text-sm font-medium text-ink/70 dark:text-paper/70 hover:text-ink dark:hover:text-paper inline-flex items-center gap-1"
              >
                {m.label} <ChevronDown size={14} className={`transition-transform ${menu === m.key ? "rotate-180" : ""}`} />
              </button>
              {menu === m.key && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 z-50">
                  <div className={`rounded-2xl border border-ink/10 bg-paper dark:bg-ink shadow-xl p-3 grid gap-2 ${m.groups.length > 1 ? "w-[30rem] grid-cols-2" : "w-64"}`}>
                    {m.groups.map((g) => (
                      <div key={g.title}>
                        <p className="px-3 pt-1 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-gold-deep dark:text-gold">{g.title}</p>
                        {g.items.map((i) => (
                          <MenuLink key={i.label} item={i} onClick={() => setMenu(null)} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {links.filter((l) => l.to !== "/courses").map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? "text-gold-deep dark:text-gold"
                    : "text-ink/70 dark:text-paper/70 hover:text-ink dark:hover:text-paper"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <a
            href={gamesLink("menu")}
            target="_blank"
            rel="noopener"
            className="text-sm font-semibold text-rise-dark dark:text-gold inline-flex items-center gap-1.5"
          >
            Free Games
            <span className="text-[10px] font-bold uppercase tracking-wide bg-gold text-ink px-1.5 py-0.5 rounded">New</span>
          </a>
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
                Start Free Trial
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
              <button
                onClick={goToYneet}
                className="text-sm font-semibold px-4 py-2 rounded-full bg-gold text-ink hover:bg-gold-dark transition-colors"
              >
                {user.role === "admin" ? "YNeet Admin" : "YNeet"}
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate("/", { replace: true });
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
        <div className="lg:hidden border-t border-ink/10 bg-paper dark:bg-ink px-4 py-4 space-y-3 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {/* Account actions first: the most important thing on a phone */}
          <div className="flex gap-3">
            {!user ? (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="flex-1 text-center text-sm font-semibold px-4 py-2 rounded-full border border-ink/15">
                  Login
                </Link>
                <Link to="/register" onClick={() => setOpen(false)} className="flex-1 text-center text-sm font-semibold px-4 py-2 rounded-full bg-gold text-ink">
                  Start Free Trial
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={user.role === "admin" ? "/admin" : "/dashboard"}
                  onClick={() => setOpen(false)}
                  className="flex-1 text-center text-sm font-semibold px-4 py-2 rounded-full bg-ink text-paper"
                >
                  {user.role === "admin" ? "Admin" : "Dashboard"}
                </Link>
                <button
                  onClick={() => { setOpen(false); goToYneet(); }}
                  className="flex-1 text-center text-sm font-semibold px-4 py-2 rounded-full bg-gold text-ink"
                >
                  {user.role === "admin" ? "YNeet Admin" : "YNeet"}
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-4">
            {[{ to: "/", label: "Home" }, ...links, { to: "/neet-parents", label: "For Parents" }].map((l) => (
              <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className="block text-sm font-medium py-1.5">
                {l.label}
              </NavLink>
            ))}
          </div>

          <p className="pt-2 border-t border-ink/10 text-xs font-bold uppercase tracking-wider text-ink/70 dark:text-paper/70">Free · no login needed</p>
          {FREE_GROUPS.map((g) => (
            <div key={g.title} className="rounded-xl border border-ink/10">
              <button
                onClick={() => setSection((v) => (v === g.title ? null : g.title))}
                aria-expanded={section === g.title}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-gold-deep dark:text-gold"
              >
                {g.title}
                <ChevronDown size={16} className={`transition-transform ${section === g.title ? "rotate-180" : ""}`} />
              </button>
              {section === g.title && (
                <div className="grid grid-cols-2 gap-x-4 px-3 pb-2">
                  {g.items.map((i) => (
                    <MenuLink key={i.label} item={i} compact onClick={() => setOpen(false)} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {user && (
            <button
              onClick={() => {
                setOpen(false);
                logout();
                navigate("/", { replace: true });
              }}
              className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full border border-ink/15"
            >
              <LogOut size={16} />
              Logout
            </button>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
