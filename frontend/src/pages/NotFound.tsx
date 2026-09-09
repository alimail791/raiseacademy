import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
    <p className="font-display text-6xl font-bold text-gold">404</p>
    <h1 className="font-display text-2xl font-bold mt-3">Page not found</h1>
    <p className="text-ink/60 mt-2">The page you're looking for doesn't exist or has moved.</p>
    <Link to="/" className="mt-6 bg-ink text-paper font-semibold px-6 py-2.5 rounded-full">
      Back to Home
    </Link>
  </div>
);

export default NotFound;
