// Builds the SSO handoff URL to YNeet. YNeet reads the token from the URL,
// verifies it against Raise Academy's /api/auth/me, provisions/loads the
// matching local profile, and then routes the student to /pricing (if not
// subscribed) or /dashboard (if they already have an active plan).
export const getYneetRedirectUrl = () => {
  const base = import.meta.env.VITE_YNEET_URL || "http://localhost:5174";
  const token = localStorage.getItem("ra_token") || "";
  return `${base}/bridge?token=${encodeURIComponent(token)}`;
};

export const goToYneet = () => {
  window.location.href = getYneetRedirectUrl();
};
