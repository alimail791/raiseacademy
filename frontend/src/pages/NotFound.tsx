import { Link, Navigate, useLocation } from "react-router-dom";

// Some in-app browsers open the address "null" (or "undefined") after a page
// loads, which lands on e.g. /neet-practice/chemistry/null. Send those
// visitors to the section's main page instead of showing a 404.
const BROKEN_TAIL = /\/(null|undefined)\/?$/i;

const NotFound = () => {
  const { pathname } = useLocation();
  if (BROKEN_TAIL.test(pathname)) {
    const section = pathname.split("/").filter(Boolean)[0];
    const to = section && !/^(null|undefined)$/i.test(section) ? `/${section}` : "/";
    return <Navigate to={to} replace />;
  }
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <p className="font-display text-6xl font-bold text-gold">404</p>
      <h1 className="font-display text-2xl font-bold mt-3">Page not found</h1>
      <p className="text-ink/60 mt-2">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="mt-6 bg-ink text-paper font-semibold px-6 py-2.5 rounded-full">
        Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
