// Public "NEET cutoff" pages on www.yneet.in (/neet-cutoff/<state>), built from
// the same closing ranks as the College Predictor. Pure function over the
// CollegeCutoff rows of one quota's latest import, so it can be tested on the
// bundled CSVs without a database.

export const STATE_SLUGS = {
  AIQ: "all-india-quota", TN: "tamil-nadu", AP: "andhra-pradesh", TS: "telangana", KL: "kerala", KA: "karnataka",
  UP: "uttar-pradesh", MH: "maharashtra", BR: "bihar", RJ: "rajasthan", DL: "delhi", PB: "punjab", GJ: "gujarat",
  MP: "madhya-pradesh", JH: "jharkhand", WB: "west-bengal",
};

const MGMT = /management|\bnri\b|non-resident|institutional|\bmgmt\b|paid seat|self-financ|deemed|esi\b|employees state/i;
// Seats only some students can take (domicile, wards of armed forces, minority,
// AMU internal…) aren't the cutoff most students mean, so they're left out.
const SPECIAL = /internal|domicile|widow|armed forces|minority|\bamu\b|aligarh|\bcw\b/i;
const GOVT_TYPE = /government|aiims|jipmer|esic|central|govt/i;
const PRIVATE_TYPE = /private|self-financ|deemed/i;
const MAX_CATEGORIES = 5;

// Rank-based quotas: higher closing rank = easier. Mark-based (SCORE): lower mark = easier.
const easier = (rankType) => (a, b) => (rankType === "SCORE" ? a < b : a > b);

export function summariseQuota({ quota, name, year, round, rankType }, rows) {
  const isEasier = easier(rankType);
  const base = rows.filter((r) => !r.eligibility && !/pwd|ph\b/i.test(r.category) && !r.strayOnly);
  const merit = base.filter((r) => !MGMT.test(r.seatType || "") && !SPECIAL.test(r.seatType || ""));
  const govt = merit.filter((r) => r.course === "MBBS" && GOVT_TYPE.test(r.collegeType || "") && !/private/i.test(r.collegeType || ""));
  if (govt.length < 3) return null;

  // Main categories: OPEN first, then the most common ones.
  const freq = new Map();
  for (const r of govt) freq.set(r.category, (freq.get(r.category) || 0) + 1);
  const categories = [...freq.entries()].sort((a, b) => (b[0] === "OPEN") - (a[0] === "OPEN") || b[1] - a[1]).slice(0, MAX_CATEGORIES).map(([c]) => c);

  // One row per college: the last (easiest) closing rank per category across its merit seat types.
  const byCollege = new Map();
  for (const r of govt) {
    if (!categories.includes(r.category)) continue;
    const c = byCollege.get(r.college) || { college: r.college, type: r.collegeType || "", closing: {} };
    const cur = c.closing[r.category];
    if (cur === undefined || isEasier(r.closingRank, cur)) c.closing[r.category] = r.closingRank;
    byCollege.set(r.college, c);
  }
  const hardFirst = (a, b) => (rankType === "SCORE" ? b - a : a - b);
  const colleges = [...byCollege.values()]
    .filter((c) => c.closing.OPEN !== undefined || Object.keys(c.closing).length)
    .sort((a, b) => hardFirst(a.closing.OPEN ?? (rankType === "SCORE" ? -1 : Infinity), b.closing.OPEN ?? (rankType === "SCORE" ? -1 : Infinity)));

  const categorySummary = categories.map((cat) => {
    const vals = colleges.map((c) => c.closing[cat]).filter((v) => v !== undefined);
    if (!vals.length) return null;
    const sorted = [...vals].sort(hardFirst);
    // "Last seat" ignores one-off buckets far beyond the rest (a single leftover seat).
    const median = sorted[Math.floor(sorted.length / 2)];
    const sane = rankType === "SCORE" ? sorted : sorted.filter((v) => v <= median * 3);
    return { category: cat, toughest: sorted[0], last: sane[sane.length - 1], colleges: vals.length };
  }).filter(Boolean);

  const range = (list) => {
    const vals = list.filter((r) => r.category === "OPEN").map((r) => r.closingRank).sort(hardFirst);
    return vals.length ? { colleges: new Set(list.filter((r) => r.category === "OPEN").map((r) => r.college)).size, toughest: vals[0], last: vals[vals.length - 1] } : null;
  };
  const privateMbbs = range(merit.filter((r) => r.course === "MBBS" && PRIVATE_TYPE.test(r.collegeType || "")));
  const govtBds = range(merit.filter((r) => r.course === "BDS" && GOVT_TYPE.test(r.collegeType || "") && !/private/i.test(r.collegeType || "")));

  return {
    code: quota, slug: STATE_SLUGS[quota] || quota.toLowerCase(), name, year, round, rankType,
    categories, colleges, categorySummary, privateMbbs, govtBds,
  };
}
