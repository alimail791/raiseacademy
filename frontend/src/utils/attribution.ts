// Sign-up attribution: where a student first came from, sent with every
// sign-up request and saved on their account (backend/utils/signupSource.js).
//
// First touch (landing page, referrer, UTM tags) is saved once, on the first
// page of the first visit, and kept for 30 days — so a student who finds a
// question on Google today and signs up next week still counts for Google.

import api from "../api/axios";
import { isAppMode } from "./appMode";

const KEY = "yn_first_touch";
const VID = "yn_vid"; // random visitor id for Admin → Traffic & signups
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
    app: isAppMode(),
    vid: visitorId(),
  };
}

// ---- Admin → "Traffic & signups" (backend/controllers/trackController.js) ----
// First-party and tiny: one request on a visitor's very first page, and one
// a day when they open a sign-up form. Nothing is sent for signed-in students,
// admin/institute/partner pages, or widgets embedded on other sites.

const NOT_COUNTED = /^\/(admin|institute|dashboard|login|logout|delete-account|embed|partner\/(login|dashboard))(\/|$)|^\/i\/[^/]+\/(poster|status)/;

function visitorId() {
  try { return localStorage.getItem(VID) || ""; } catch { return ""; }
}

function beacon(path: string, body: Record<string, unknown>) {
  try {
    const base = String(api.defaults.baseURL || "").replace(/\/$/, "");
    fetch(`${base}/track/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: true }).catch(() => {});
  } catch { /* analytics only */ }
}

// Call once when the app starts (main.tsx), after captureFirstTouch().
export function trackVisit() {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(VID)) return; // already counted
    const vid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem(VID, vid);
    if (localStorage.getItem("ra_token") || NOT_COUNTED.test(window.location.pathname)) return; // existing student / not a public page
    beacon("visit", signupAttribution());
  } catch { /* private mode */ }
}

// A sign-up form was shown (register page, sign-up sheet, WhatsApp form).
export function trackSignupView(place?: string) {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem("ra_token")) return;
    const day = new Date().toDateString();
    if (localStorage.getItem("yn_sv") === day) return; // once a day is enough
    localStorage.setItem("yn_sv", day);
    beacon("event", { ...signupAttribution(place), event: "signup_view" });
  } catch { /* analytics only */ }
}
