// Sign-up attribution: where a student first came from, sent with every
// sign-up request and saved on their account (backend/utils/signupSource.js).
//
// First touch (landing page, referrer, UTM tags) is saved once, on the first
// page of the first visit, and kept for 30 days — so a student who finds a
// question on Google today and signs up next week still counts for Google.

const KEY = "yn_first_touch";
// Same check as SignupNudge's isInAppBrowser (kept here to avoid an import cycle).
const inAppBrowser = () => typeof navigator !== "undefined" && /FBAN|FBAV|Instagram|WhatsApp|Line\/|Snapchat|; wv\)|GSA\//i.test(navigator.userAgent || "");
const KEEP_MS = 30 * 864e5;

type Touch = { landing: string; referrer: string; utmSource: string; utmMedium: string; utmCampaign: string; at: number };

const externalReferrer = () => {
  try {
    if (!document.referrer) return "";
    const h = new URL(document.referrer).hostname.replace(/^www\./, "");
    return /(^|\.)yneet\.in$/.test(h) && h !== "play.yneet.in" ? "" : h;
  } catch { return ""; }
};

// Call once when the app starts (main.tsx).
export function captureFirstTouch() {
  if (typeof window === "undefined") return;
  try {
    const old = JSON.parse(localStorage.getItem(KEY) || "null") as Touch | null;
    const p = new URLSearchParams(window.location.search);
    const utmSource = p.get("utm_source") || "";
    // A new tagged link (campaign, widget, extension) replaces an old first touch.
    if (old && Date.now() - old.at < KEEP_MS && !utmSource) return;
    const t: Touch = {
      landing: window.location.pathname.slice(0, 120),
      referrer: externalReferrer(),
      utmSource: utmSource.slice(0, 60),
      utmMedium: (p.get("utm_medium") || "").slice(0, 60),
      utmCampaign: (p.get("utm_campaign") || "").slice(0, 80),
      at: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(t));
  } catch { /* private mode: sign-up still works, just unattributed */ }
}

// Body field `signup` for /auth/register, /auth/google and /auth/wa/verify.
export function signupAttribution(place?: string) {
  let t: Partial<Touch> = {};
  try { t = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch { /* ignore */ }
  let from = "";
  try { from = new URLSearchParams(window.location.search).get("from") || ""; } catch { /* ignore */ }
  return {
    place: (place || from || "").slice(0, 60),
    page: typeof window !== "undefined" ? window.location.pathname.slice(0, 120) : "",
    landing: t.landing || "",
    referrer: t.referrer || "",
    utmSource: t.utmSource || "",
    utmMedium: t.utmMedium || "",
    utmCampaign: t.utmCampaign || "",
    inApp: inAppBrowser(),
  };
}
