// Where each new student came from, saved on their Student record so YNeet can
// see which channel actually brings sign-ups (Railway keeps logs ~7 days only).
//
// The browser sends `signup` with the sign-up request (frontend/src/utils/attribution.ts):
//   place    – which button/form they used (e.g. "question_page_gate", "register_page")
//   page     – the page they were on when they signed up
//   landing  – the first page of their first visit, plus referrer and UTM tags from then
// The server adds `method` (email / google / whatsapp / institute) and works out `channel`.

const clip = (v, n = 120) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const host = (v) => clip(v, 200).replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0].toLowerCase();

export function channelOf(s, { referred = false } = {}) {
  if (referred) return "Referral (friend's link)";
  const u = (s.utmSource || "").toLowerCase();
  const m = (s.utmMedium || "").toLowerCase();
  const r = s.referrer || "";
  const l = s.landing || "";
  if (m === "widget") return "Widgets on partner sites";
  if (u) {
    if (u.includes("chrome")) return "Chrome extension";
    if (u.includes("raiseacademy")) return "raiseacademy.in";
    if (/youtube|^yt/.test(u)) return "YouTube";
    if (/insta|^ig/.test(u)) return "Instagram";
    if (/whatsapp|^wa/.test(u)) return "WhatsApp";
    if (/google/.test(u) && /cpc|paid|ads/.test(m)) return "Google Ads";
    return `Campaign: ${u.slice(0, 40)}`;
  }
  if (l.startsWith("/yt") || /youtube\.com|youtu\.be/.test(r)) return "YouTube";
  if (/instagram\.com/.test(r)) return "Instagram";
  if (/whatsapp|wa\.me/.test(r)) return "WhatsApp";
  if (/facebook\.com|fb\.com/.test(r)) return "Facebook";
  if (/(^|\.)google\./.test(r)) return "Google search";
  if (/bing\.com|duckduckgo|yahoo\.|yandex/.test(r)) return "Bing / other search";
  if (/chatgpt|openai|perplexity|gemini|copilot|claude\.ai/.test(r)) return "AI chat (ChatGPT etc.)";
  if (/play\.yneet\.in/.test(r)) return "YNeet Daily puzzles";
  if (/raiseacademy/.test(r)) return "raiseacademy.in";
  if (r && !/yneet\.in$/.test(r)) return `Other site: ${r.slice(0, 40)}`;
  if (s.inApp) return "In-app browser (WhatsApp / Instagram)";
  return "Direct / unknown";
}

// Clean, size-limited copy of what the browser sent. Never throws.
export function signupInfo(raw, method, opts = {}) {
  const s = raw && typeof raw === "object" ? raw : {};
  const info = {
    method,
    place: clip(s.place, 60),
    page: clip(s.page),
    landing: clip(s.landing),
    referrer: host(s.referrer),
    utmSource: clip(s.utmSource, 60),
    utmMedium: clip(s.utmMedium, 60),
    utmCampaign: clip(s.utmCampaign, 80),
    inApp: !!s.inApp,
  };
  info.channel = channelOf(info, opts);
  return info;
}
