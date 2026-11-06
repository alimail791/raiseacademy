// "App mode" = this page is open inside the YNeet Android app (Play Store).
// The app opens these pages with ?app=1 for login and sign-up only.
//
// The Android app is "consumption only" under Google Play's payments policy:
// no prices, plans or payment links inside it. So in app mode this site shows
// only Login, Create account, Forgot password, Privacy and Delete account,
// with no menu, footer or prices.
//
// sessionStorage (not localStorage) on purpose: the app shares Chrome's storage
// with the phone's normal browser, and the website must keep showing prices there.
const KEY = "yneet_app_mode";

export function isAppMode(): boolean {
  if (typeof window === "undefined") return false; // prerender / SSR
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get("app") === "1" || (document.referrer || "").startsWith("android-app://")) {
      sessionStorage.setItem(KEY, "1");
      return true;
    }
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

// "Framed" = this page is shown inside app.yneet.in/account, the YNeet Android
// app's own login screen. The app only trusts app.yneet.in for full screen, so it
// shows login / sign-up / logout from here inside a frame instead of leaving
// app.yneet.in (which would bring back the browser address bar).
export const YNEET_ORIGIN = (import.meta.env.VITE_YNEET_URL || "https://app.yneet.in").replace(/\/$/, "");

export function isFramed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true; // reading window.top across origins can throw: we are framed
  }
}

// Tell the YNeet app frame what happened, so it can move on by itself.
export function tellYneetApp(msg: { type: "yneet-auth"; token: string } | { type: "yneet-logged-out" }) {
  try {
    window.parent.postMessage(msg, YNEET_ORIGIN);
  } catch {
    /* not framed */
  }
}

export const APP_MODE_PATHS = ["/login", "/register", "/forgot-password", "/logout", "/privacy", "/terms", "/delete-account"];
