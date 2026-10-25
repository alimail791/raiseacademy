import { Link, useLocation } from "react-router-dom";
import { Gift, ArrowRight } from "lucide-react";

// Site-wide offer strip: 30 days free from Class 9; Class 6–8 is always free.
// Hidden on the logged-in / staff areas and on the register page itself.
const HIDE = [/^\/register/, /^\/dashboard/, /^\/admin/, /^\/institute(\/|$)/];

export default function TrialBar() {
  const { pathname } = useLocation();
  if (HIDE.some((r) => r.test(pathname))) return null;
  return (
    <Link
      to="/register"
      className="group block bg-gradient-to-r from-gold via-[#ffd27a] to-gold text-ink text-center text-sm font-semibold px-4 py-2 hover:brightness-105 transition"
    >
      <span className="inline-flex items-center gap-x-2 gap-y-0.5 flex-wrap justify-center">
        <Gift size={16} className="animate-bounce shrink-0" />
        <span>
          <b className="uppercase tracking-wide">30 days FREE</b> from Class 9 to Dropper<span className="hidden sm:inline"> · Class 6–8 free forever · no payment, no card</span>
        </span>
        <span className="inline-flex items-center gap-1 underline underline-offset-2">
          Register free <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </span>
      </span>
    </Link>
  );
}
