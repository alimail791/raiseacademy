// NEET UG exam date used by the countdown widget (/embed/countdown).
// NTA has not announced NEET 2027 yet: recent exams were on the first Sunday of
// May (4 May 2025, 3 May 2026), so we count down to 2 May 2027 and say it's
// expected. When NTA publishes the date, change NEET_DATE and set OFFICIAL = true.
export const NEET_YEAR = 2027;
export const NEET_DATE = "2027-05-02"; // YYYY-MM-DD, India time
export const OFFICIAL = false;

// Whole days from today (India time) to the exam day; 0 on the day itself.
export function daysToNeet(now = new Date()) {
  const ist = new Date(now.getTime() + 330 * 60 * 1000);
  const today = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate());
  const [y, m, d] = NEET_DATE.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - today) / 86400000);
}

export const neetDateLabel = () => new Date(`${NEET_DATE}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
