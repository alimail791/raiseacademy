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

// AI assistants that link to us. ChatGPT adds utm_source=chatgpt.com to links
// in its answers, so these are AI-search visits, not a campaign we ran.
const AI = [
  [/chatgpt|openai/, "AI search: ChatGPT"],
  [/perplexity/, "AI search: Perplexity"],
  [/gemini|bard/, "AI search: Gemini"],
  [/copilot|bing\.com\/chat/, "AI search: Copilot"],
  [/claude/, "AI search: Claude"],
];
export const aiChannel = (v = "") => (AI.find(([re]) => re.test(String(v).toLowerCase())) || [])[1] || "";

// Display name for a channel saved earlier (e.g. "Campaign: chatgpt.com" → "AI search: ChatGPT").
export const relabelChannel = (c) => {
  if (typeof c !== "string" || !c.startsWith("Campaign: ")) return c;
  return aiChannel(c.slice(10)) || c;
};

export function channelOf(s, { referred = false } = {}) {
  const u = (s.utmSource || "").toLowerCase();
  // Score cards shared from the app's mock test analysis carry the student's referral code.
  if (referred) return u === "score_card" ? "Referral: mock score card" : "Referral (friend's link)";
  const m = (s.utmMedium || "").toLowerCase();
  const r = s.referrer || "";
  const l = s.landing || "";
  if (m === "widget") return "Widgets on partner sites";
  if (u) {
    if (aiChannel(u)) return aiChannel(u);
    if (u === "readiness_share") return "Readiness Test shares";
    if (u === "score_card") return "Mock score card shares";
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
  if (aiChannel(r)) return aiChannel(r);
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
