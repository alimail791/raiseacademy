// YNeet new tab: NEET countdown (worked out here, no network), today's question
// (YNeet's Question of the Day box from www.yneet.in) and a search box that uses
// the browser's own search engine (chrome.search).

// NTA hasn't announced NEET 2027 yet: recent exams were on the first Sunday of May,
// so count to 2 May 2027 and call it expected. When NTA announces it, change these
// two lines, bump the version in manifest.json and upload the new zip.
const NEET_YEAR = 2027;
const NEET_DATE = "2027-05-02";
const OFFICIAL = false;

const UTM = "utm_source=chrome-extension&utm_medium=extension&utm_campaign=newtab";
const SITE = "https://www.yneet.in";

// Same targets as the countdown widget on yneet.in (frontend/src/pages/WidgetEmbeds.tsx).
const TARGETS = [
  [150, "Finish NCERT Biology once, chapter by chapter, with PYQs after each chapter."],
  [90, "Close your high-weightage chapters first and take one full mock test every week."],
  [45, "Two full mock tests a week. Revise only your mistakes and the top-weightage chapters."],
  [15, "Revision only: formula sheets, NCERT lines, and the questions you got wrong."],
  [0, "Sleep well, revise lightly, and trust your preparation. All the best!"],
];

const LINKS = [
  ["Chapter weightage", "/neet-chapter-wise-weightage"],
  ["Chapter-wise PYQs", "/neet-practice"],
  ["Question papers", "/neet-question-papers"],
  ["College predictor", "/neet-college-predictor"],
  ["Mock tests", "/courses"],
  ["NCERT notes", "/ncert-notes"],
];

function daysToNeet(now = new Date()) {
  const ist = new Date(now.getTime() + 330 * 60 * 1000); // India time
  const today = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate());
  const [y, m, d] = NEET_DATE.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - today) / 86400000);
}

function countdown() {
  const days = daysToNeet();
  const label = new Date(`${NEET_DATE}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  document.getElementById("cd-label").textContent = `NEET ${NEET_YEAR} countdown`;
  document.getElementById("cd-days").textContent = String(Math.max(days, 0));
  document.getElementById("cd-sub").textContent =
    days > 0 ? `day${days === 1 ? "" : "s"} to NEET ${NEET_YEAR}` : days === 0 ? "NEET is today!" : "NEET is over";
  document.getElementById("cd-date").textContent = `${OFFICIAL ? "" : "Expected "}${label}`;
  const target = (TARGETS.find(([d]) => days > d) || TARGETS[TARGETS.length - 1])[1];
  document.getElementById("cd-target").textContent = target;
  if (days < 0) document.querySelector(".target").hidden = true;
}

function greeting() {
  const h = new Date().getHours();
  document.getElementById("greeting").textContent = h < 12 ? "Good morning 👋" : h < 17 ? "Good afternoon 👋" : "Good evening 👋";
}

function links() {
  const nav = document.getElementById("links");
  for (const [text, path] of LINKS) {
    const a = document.createElement("a");
    a.href = `${SITE}${path}?${UTM}`;
    a.textContent = text;
    nav.appendChild(a);
  }
}

function question() {
  const frame = document.getElementById("qotd");
  if (!navigator.onLine) {
    frame.hidden = true;
    document.getElementById("offline").hidden = false;
    window.addEventListener("online", () => location.reload(), { once: true });
    return;
  }
  frame.src = `${SITE}/embed/qotd?src=chrome-extension`;
}

function search() {
  const form = document.getElementById("search");
  const q = document.getElementById("q");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = q.value.trim();
    if (!text) return;
    if (chrome?.search?.query) chrome.search.query({ text, disposition: "CURRENT_TAB" });
  });
}

countdown();
greeting();
links();
question();
search();
