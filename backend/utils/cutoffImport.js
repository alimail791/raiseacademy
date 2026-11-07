// Turns an uploaded CSV into CollegeCutoff rows for the NEET College Predictor.
//
// Two kinds of file are accepted (auto-detected from the header row):
//
// 1. CUTOFF file — one row per seat bucket, with a closing rank already worked out:
//      college, course, category, closing_rank  (required)
//      opening_rank, seat_type, college_state, college_type, seats, annual_fee, open_to_all  (optional)
//
// 2. ALLOTMENT file — one row per allotted candidate, as in the official MCC / state
//    allotment PDFs (convert PDF → CSV with scripts/allotment_pdf_to_csv.py):
//      rank, college, course, category  (required)   seat_type / quota  (optional)
//    Rows are grouped by college + course + seat type + category; closing rank = the
//    highest (worst) rank allotted in that group, opening rank = the lowest.
//
// Column names are matched loosely ("Allotted Institute", "Alloted Category", "AIR" …).

const ALIASES = {
  college: ["college", "college name", "institute", "institute name", "allotted institute", "alloted institute", "allotted college", "alloted college", "name of college", "name of the college"],
  course: ["course", "allotted course", "alloted course", "branch", "programme", "program"],
  category: ["category", "allotted category", "alloted category", "seat category", "allotted cat", "alloted cat", "community", "allotted community"],
  seatType: ["seat type", "seat_type", "quota", "allotted quota", "alloted quota", "seat quota"],
  rank: ["rank", "air", "neet rank", "all india rank", "state rank", "merit rank", "general rank"],
  closingRank: ["closing rank", "closing_rank", "last rank", "cutoff rank", "cut off rank"],
  openingRank: ["opening rank", "opening_rank", "first rank"],
  strayClosingRank: ["stray closing rank", "stray_closing_rank"],
  strayOnly: ["stray only", "stray_only"],
  collegeState: ["college state", "college_state", "state"],
  collegeType: ["college type", "college_type", "type", "management", "institute type"],
  seats: ["seats", "intake", "seat count"],
  annualFee: ["annual fee", "annual_fee", "fee", "fees", "tuition fee"],
  openToAll: ["open to all", "open_to_all"],
};

const norm = (h) => String(h || "").toLowerCase().replace(/[_\-.]+/g, " ").replace(/\s+/g, " ").trim();

// Minimal RFC-4180 CSV parser (quotes, escaped quotes, commas/newlines inside quotes).
export function parseCsv(text) {
  const rows = [];
  let row = [], field = "", q = false;
  const s = String(text || "").replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"') { if (s[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((v) => v.trim() !== "")) rows.push(row);
  return rows;
}

const mapHeader = (header) => {
  const idx = {};
  header.forEach((h, i) => {
    const n = norm(h);
    for (const [key, names] of Object.entries(ALIASES)) {
      if (idx[key] === undefined && names.includes(n)) idx[key] = i;
    }
  });
  return idx;
};

const toInt = (v) => {
  const n = parseInt(String(v ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

const CATEGORY_MAP = {
  UR: "OPEN", GN: "OPEN", GEN: "OPEN", GENERAL: "OPEN", OPEN: "OPEN", OP: "OPEN", OC: "OPEN", UNRESERVED: "OPEN", GM: "OPEN",
  "OBC NCL": "OBC", OBCNCL: "OBC", OBC: "OBC", BC: "BC",
  "GEN EWS": "EWS", GENEWS: "EWS", EWS: "EWS",
  SC: "SC", ST: "ST",
};
export function normCategory(raw) {
  let s = String(raw || "").toUpperCase().replace(/[()]/g, " ").replace(/[_\-/.]+/g, " ").replace(/\s+/g, " ").trim();
  if (!s) return "";
  const pwd = /\bPWD\b|\bPH\b/.test(s);
  s = s.replace(/\bPWD\b|\bPH\b/g, "").trim();
  const base = CATEGORY_MAP[s] || s.replace(/\s+/g, "-");
  return pwd ? `${base}-PWD` : base;
}

export function normCourse(raw) {
  const s = String(raw || "").toUpperCase().replace(/[^A-Z]/g, "");
  if (s.startsWith("MBBS")) return "MBBS";
  if (s.startsWith("BDS")) return "BDS";
  return String(raw || "").toUpperCase().trim();
}

// AIQ (MCC) seat types any Indian candidate can get; the rest (ESI, minority, NRI,
// DU/IPU, …) need special eligibility, so they're stored but not shown to everyone.
const MCC_OPEN_SEAT_TYPES = /^(all india|aiq|deemed|deemed\/paid|deemed paid|open seat|open|aiims|jipmer|central|bhu|amu open|all india quota)/i;

const truthy = (v) => /^(1|y|yes|true)$/i.test(String(v ?? "").trim());

/**
 * @param {string} csvText
 * @param {{year:number, round:number, quota:string, rankType?:"AIR"|"STATE", openToAllDefault?:boolean, source?:string}} meta
 * @returns {{ mode: "cutoff"|"allotment", rows: object[], skipped: number, missing?: string[] }}
 */
export function buildCutoffRows(csvText, meta) {
  const table = parseCsv(csvText);
  if (table.length < 2) return { mode: "cutoff", rows: [], skipped: 0, missing: ["header + data rows"] };

  // Header may not be the first line (PDF exports often start with a title) — use the first row that maps the key columns.
  let headerAt = table.findIndex((r) => {
    const m = mapHeader(r);
    return m.college !== undefined && m.category !== undefined && (m.closingRank !== undefined || m.rank !== undefined);
  });
  if (headerAt < 0) headerAt = 0;
  const idx = mapHeader(table[headerAt]);
  const mode = idx.closingRank !== undefined ? "cutoff" : "allotment";
  const required = mode === "cutoff" ? ["college", "category", "closingRank"] : ["college", "category", "rank"];
  const missing = required.filter((k) => idx[k] === undefined);
  if (idx.course === undefined && !meta.course) missing.push("course (column, or choose a course)");
  if (missing.length) return { mode, rows: [], skipped: 0, missing };

  const quota = String(meta.quota || "").toUpperCase().trim();
  const isAiq = quota === "AIQ";
  const get = (r, k) => (idx[k] === undefined ? "" : String(r[idx[k]] ?? "").trim());
  const base = { year: meta.year, round: meta.round || 1, quota, rankType: meta.rankType || (isAiq ? "AIR" : "STATE"), source: meta.source || "" };
  const openFor = (seatType, explicit) => {
    if (explicit !== "") return truthy(explicit);
    if (isAiq) return !seatType || MCC_OPEN_SEAT_TYPES.test(seatType);
    return !!meta.openToAllDefault;
  };

  let skipped = 0;
  const data = table.slice(headerAt + 1);

  if (mode === "cutoff") {
    const rows = [];
    for (const r of data) {
      const college = get(r, "college");
      const closingRank = toInt(get(r, "closingRank"));
      const category = normCategory(get(r, "category"));
      const course = normCourse(get(r, "course") || meta.course);
      if (!college || !closingRank || !category || !course) { skipped++; continue; }
      const seatType = get(r, "seatType");
      rows.push({
        ...base, college, course, category, closingRank, seatType,
        openingRank: toInt(get(r, "openingRank")),
        strayClosingRank: toInt(get(r, "strayClosingRank")),
        strayOnly: truthy(get(r, "strayOnly")),
        collegeState: get(r, "collegeState"),
        collegeType: get(r, "collegeType"),
        seats: toInt(get(r, "seats")),
        annualFee: toInt(get(r, "annualFee")),
        openToAll: openFor(seatType, get(r, "openToAll")),
      });
    }
    return { mode, rows, skipped };
  }

  // Allotment → aggregate
  const groups = new Map();
  for (const r of data) {
    const college = get(r, "college");
    const rank = toInt(get(r, "rank"));
    const category = normCategory(get(r, "category"));
    const course = normCourse(get(r, "course") || meta.course);
    if (!college || !rank || !category || !course) { skipped++; continue; }
    const seatType = get(r, "seatType");
    const key = [college.toLowerCase(), course, seatType.toLowerCase(), category].join("|");
    const g = groups.get(key);
    if (g) {
      g.openingRank = Math.min(g.openingRank, rank);
      g.closingRank = Math.max(g.closingRank, rank);
      g.seats += 1;
    } else {
      groups.set(key, {
        ...base, college, course, category, seatType,
        openingRank: rank, closingRank: rank, seats: 1,
        collegeState: get(r, "collegeState"), collegeType: get(r, "collegeType"),
        openToAll: openFor(seatType, get(r, "openToAll")),
      });
    }
  }
  return { mode, rows: [...groups.values()], skipped };
}
