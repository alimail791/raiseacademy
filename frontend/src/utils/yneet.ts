import { isAppMode, isFramed, tellYneetApp } from "./appMode";

// Builds the SSO handoff URL to YNeet. YNeet reads the token from the URL,
// verifies it against Raise Academy's /api/auth/me, provisions/loads the
// matching local profile, and then routes the student to /pricing (if not
// subscribed) or /dashboard (if they already have an active plan).
export const getYneetRedirectUrl = () => {
  const base = import.meta.env.VITE_YNEET_URL || "http://localhost:5174";
  const token = localStorage.getItem("ra_token") || "";
  return `${base}/bridge?token=${encodeURIComponent(token)}${isAppMode() ? "&app=1" : ""}`;
};

export const goToYneet = () => {
  // Inside the Android app's login frame: hand the token to app.yneet.in,
  // which opens /bridge itself and stays full screen.
  if (isFramed()) {
    tellYneetApp({ type: "yneet-auth", token: localStorage.getItem("ra_token") || "" });
    return;
  }
  window.location.href = getYneetRedirectUrl();
};
