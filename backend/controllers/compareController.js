import CollegeCutoff from "../models/CollegeCutoff.js";
import { swrCache } from "../utils/swrCache.js";
import { latestDatasets, QUOTAS } from "./predictorController.js";

// ───────── NEET Compare Colleges (www.yneet.in/neet-compare-colleges) ─────────
// Built from the same closing ranks as the College Predictor (latest import of
// each quota). Seats only some students can take (special eligibility, PwD) and
// stray-only buckets are left out, so the numbers match what most students mean.

const slugify = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);

const indexCache = swrCache(async () => {
  const sets = await latestDatasets();
  const byId = new Map();
  for (const code of Object.keys(QUOTAS)) {
    const d = sets[code];
    if (!d) continue;
    const rows = await CollegeCutoff.find(
      { quota: code, year: d.year, round: d.round, strayOnly: { $ne: true }, eligibility: { $in: ["", null] } },
      { college: 1, collegeState: 1, collegeType: 1, course: 1, seatType: 1, category: 1, closingRank: 1, strayClosingRank: 1, seats: 1, annualFee: 1, openToAll: 1 },
    ).lean();
    for (const r of rows) {
      if (/pwd|\bph\b/i.test(r.category)) continue;
      const id = slugify(r.college);
      if (!id) continue;
      let c = byId.get(id);
      if (!c) {
        c = { id, name: r.college, state: r.collegeState || "", type: r.collegeType || "", courses: new Set(), quotas: new Set(), fee: null, rows: [] };
        byId.set(id, c);
      }
      if (!c.state && r.collegeState) c.state = r.collegeState;
      if (!c.type && r.collegeType) c.type = r.collegeType;
      c.courses.add(r.course);
      c.quotas.add(code);
      if (r.annualFee && (!c.fee || r.annualFee < c.fee)) c.fee = r.annualFee;
      c.rows.push({
        quota: code, quotaName: QUOTAS[code], year: d.year, round: d.round, rankType: d.rankType || "AIR",
        course: r.course, seatType: r.seatType || "", category: r.category, closingRank: r.closingRank,
        strayClosingRank: r.strayClosingRank || null, seats: r.seats || null, annualFee: r.annualFee || null, openToAll: !!r.openToAll,
      });
    }
  }
  const list = [...byId.values()].map((c) => ({ id: c.id, name: c.name, state: c.state, type: c.type, courses: [...c.courses].sort(), quotas: [...c.quotas], fee: c.fee }));
  list.sort((a, b) => a.name.localeCompare(b.name));
  return { byId, list };
}, 60 * 60 * 1000);

export const warmCompare = () => indexCache.warm();

// GET /api/predictor/colleges?q=aiims&course=MBBS — search (max 20 results)
export const searchColleges = async (req, res, next) => {
  try {
    const { list } = await indexCache.get();
    const words = String(req.query.q || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).slice(0, 6);
    const course = String(req.query.course || "").toUpperCase();
    if (!words.length) return res.json({ colleges: [] });
    const hits = list.filter((c) => {
      if (course && !c.courses.includes(course)) return false;
      const hay = `${c.name} ${c.state}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
    // Names that start with the first word come first.
    hits.sort((a, b) => Number(!a.name.toLowerCase().startsWith(words[0])) - Number(!b.name.toLowerCase().startsWith(words[0])));
    res.set("Cache-Control", "public, max-age=600");
    res.json({ colleges: hits.slice(0, 20) });
  } catch (e) { next(e); }
};

// GET /api/predictor/compare?ids=a,b,c — up to 3 colleges with all their closing ranks
export const compareColleges = async (req, res, next) => {
  try {
    const { byId } = await indexCache.get();
    const ids = String(req.query.ids || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3);
    const colleges = ids.map((id) => byId.get(id)).filter(Boolean).map((c) => ({
      id: c.id, name: c.name, state: c.state, type: c.type, courses: [...c.courses].sort(), quotas: [...c.quotas], fee: c.fee, rows: c.rows,
    }));
    res.set("Cache-Control", "public, max-age=600");
    res.json({ colleges });
  } catch (e) { next(e); }
};
