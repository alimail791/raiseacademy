import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowRight, X } from "lucide-react";
import GoogleSignIn, { googleSignInEnabled, OrDivider } from "./GoogleSignIn";
import { useAuth } from "../context/AuthContext";
import { goToYneet } from "../utils/yneet";

// Sign-up nudges for free SEO pages (chapter PYQs etc.). Visitors read the free
// answers and leave, so we ask them to sign up at the moment they're engaged:
// one-tap Google on the page itself, a sticky bar on phones, and a soft prompt
// after a few "Show answer" taps. Answers are never hidden (SEO-safe).

export const track = (event: string, params: Record<string, unknown> = {}) => {
  try { (window as any).gtag?.("event", event, params); } catch { /* analytics only */ }
};

// Instagram / Facebook / WhatsApp / YouTube etc. open links in a WebView where
// Google blocks sign-in (disallowed_useragent). There we lead with phone + email.
export const isInAppBrowser = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|Instagram|WhatsApp|Line\/|Snapchat|; wv\)|GSA\//i.test(ua);
};

// One-tap Google sign-up right on the page (no trip to /register), with a
// fallback link to the phone + email form.
export function QuickSignup({ place, dark }: { place: string; dark?: boolean }) {
  const { login } = useAuth();
  const [inApp, setInApp] = useState(false);
  const [google, setGoogle] = useState(false);
  useEffect(() => { setInApp(isInAppBrowser()); setGoogle(googleSignInEnabled()); }, []);

  const showGoogle = google && !inApp;
  return (
    <div className="mt-4 max-w-sm">
      {showGoogle && (
        <>
          <div className="bg-white rounded-full">
            <GoogleSignIn text="signup_with" onDone={(d) => {
              login(d.token, d.user);
              toast.success(d.isNew ? "Welcome to YNeet!" : `Welcome back, ${d.user.fullName.split(" ")[0]}!`);
              if (d.isNew) track("sign_up", { method: "google", plan: "trial_30d", place });
              setTimeout(goToYneet, d.isNew ? 800 : 0);
            }} />
          </div>
          <div className={dark ? "text-paper/70" : ""}><OrDivider label="or use phone + email" /></div>
        </>
      )}
      <Link to={`/register?from=${encodeURIComponent(place)}`} onClick={() => track("signup_nudge_click", { place, kind: "register_link" })}
        className={`inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full ${showGoogle ? (dark ? "border border-paper/40 text-paper" : "border border-ink/20") : "bg-gold text-ink hover:bg-gold-dark"}`}>
        {showGoogle ? "Register with phone" : "Start free for 30 days"} <ArrowRight size={16} />
      </Link>
    </div>
  );
}

// Thin bar fixed to the bottom of the screen on phones, shown once the visitor
// has scrolled into the content. Dismissable for the session.
export function StickySignupBar({ text, place }: { text: string; place: string }) {
  const [show, setShow] = useState(false);
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    try { if (sessionStorage.getItem("nudge_bar_closed")) { setClosed(true); return; } } catch { /* ignore */ }
    let seen = false;
    const onScroll = () => {
      const on = window.scrollY > 700;
      setShow(on);
      if (on && !seen) { seen = true; track("signup_nudge_view", { place, kind: "sticky_bar" }); }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [place]);
  if (closed || !show) return null;
  return (
    <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 bg-ink text-paper px-3 py-2.5 pr-20 shadow-[0_-4px_16px_rgba(0,0,0,0.2)] flex items-center gap-2">
      <button aria-label="Close" onClick={() => { setClosed(true); try { sessionStorage.setItem("nudge_bar_closed", "1"); } catch { /* ignore */ } }} className="p-1 text-paper/60"><X size={16} /></button>
      <Link to={`/register?from=${encodeURIComponent(place)}`} onClick={() => track("signup_nudge_click", { place, kind: "sticky_bar" })}
        className="flex-1 flex items-center justify-between gap-2 bg-gold text-ink font-semibold text-sm px-4 py-2.5 rounded-full">
        <span className="truncate">{text}</span> <ArrowRight size={16} className="shrink-0" />
      </Link>
    </div>
  );
}

// Count "Show answer" taps; after `after` taps, open a bottom sheet once per session.
export function useRevealNudge(after = 5) {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const onReveal = () => setCount((c) => {
    const n = c + 1;
    if (n === after) {
      let shown = false;
      try { shown = !!sessionStorage.getItem("nudge_sheet_shown"); sessionStorage.setItem("nudge_sheet_shown", "1"); } catch { /* ignore */ }
      if (!shown) setOpen(true);
    }
    return n;
  });
  return { count, open, close: () => setOpen(false), onReveal };
}

export function RevealNudgeSheet({ open, onClose, title, place }: { open: boolean; onClose: () => void; title: string; place: string }) {
  useEffect(() => { if (open) track("signup_nudge_view", { place, kind: "reveal_sheet" }); }, [open, place]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-ink/50" onClick={onClose}>
      <div role="dialog" aria-modal="true" className="w-full sm:max-w-md bg-paper dark:bg-ink text-ink dark:text-paper rounded-t-3xl sm:rounded-3xl p-6 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <p className="font-display text-xl font-bold">{title}</p>
          <button aria-label="Close" onClick={() => { track("signup_nudge_dismiss", { place }); onClose(); }} className="p-1 text-ink/50 dark:text-paper/50"><X size={20} /></button>
        </div>
        <p className="text-sm text-ink/70 dark:text-paper/70 mt-2">You're on a roll. Sign up free to get a timed test on this chapter, your score and your weak topics. 30 days free, no payment.</p>
        <QuickSignup place={`${place}_sheet`} />
        <button onClick={() => { track("signup_nudge_dismiss", { place }); onClose(); }} className="mt-4 text-sm text-ink/60 dark:text-paper/60 underline">Keep reading answers</button>
      </div>
    </div>
  );
}
