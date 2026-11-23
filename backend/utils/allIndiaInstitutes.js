import Student from "../models/Student.js";
import Institute from "../models/Institute.js";
import { yneetPost } from "./yneetSync.js";
import { sendEmail } from "./sendEmail.js";

// All-India NEET Mock (YNeet, every Sunday) seen by institutes:
// - each institute's own students with their All-India rank
// - an institute rank list (average of each institute's best 5 scores, at least
//   MIN_TAKERS students to be ranked), so institutes compete and push students
// - a Monday email to every active institute with last Sunday's results.
// Results come from YNeet's /internal/allindia-results (first attempt on the Sunday).

const MIN_TAKERS = 3;
const TOP_N = 5;
const SITE = () => (process.env.CLIENT_URL || "https://www.yneet.in").replace(/\/$/, "");

const cache = new Map(); // date → { at, data }, results are final once the Sunday is over
async function results(date) {
  const key = date || "latest";
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.data;
  const data = await yneetPost("allindia-results", date ? { date } : {});
  cache.set(key, { at: Date.now(), data });
  return data;
}

// Everything institute-related for one Sunday. Returns { meta, byInstitute: Map, board: [] }.
async function buildBoard(date) {
  const r = await results(date);
  const meta = { date: r.date, label: r.label, found: r.found, takers: r.takers || 0, totalMarks: r.totalMarks || 360, next: r.next };
  const byInstitute = new Map();
  if (!r.rows?.length) return { meta, byInstitute, board: [] };

  const rowById = new Map(r.rows.map((x) => [String(x.userId), x]));
  const students = await Student.find({ _id: { $in: [...rowById.keys()] }, instituteId: { $ne: null } }).select("_id fullName instituteId");
  for (const s of students) {
    const iid = String(s.instituteId);
    if (!byInstitute.has(iid)) byInstitute.set(iid, []);
    byInstitute.get(iid).push({ ...rowById.get(String(s._id)), name: s.fullName });
  }
  const insts = await Institute.find({ _id: { $in: [...byInstitute.keys()] } }).select("name city");
  const instById = new Map(insts.map((i) => [String(i._id), i]));

  const board = [...byInstitute.entries()].map(([iid, rows]) => {
    rows.sort((a, b) => a.rank - b.rank);
    const best = rows.slice(0, TOP_N);
    return {
      instituteId: iid, name: instById.get(iid)?.name || "Institute", city: instById.get(iid)?.city || "",
      takers: rows.length, bestRank: rows[0].rank,
      avgTop: Math.round((best.reduce((n, x) => n + x.score, 0) / best.length) * 10) / 10,
    };
  })
    .filter((b) => b.takers >= MIN_TAKERS)
    .sort((a, b) => b.avgTop - a.avgTop || b.takers - a.takers)
    .map((b, i) => ({ ...b, rank: i + 1 }));
  return { meta, byInstitute, board };
}

// What one institute sees (portal tab + Monday email).
export async function instituteAllIndia(institute, date) {
  const { meta, byInstitute, board } = await buildBoard(date);
  const iid = String(institute._id);
  const mine = (byInstitute.get(iid) || []).sort((a, b) => a.rank - b.rank);
  const enrolled = await Student.countDocuments({ instituteId: institute._id });
  const me = board.find((b) => b.instituteId === iid) || null;
  return {
    ...meta,
    minTakers: MIN_TAKERS, topN: TOP_N,
    institute: {
      enrolled, takers: mine.length, bestRank: mine[0]?.rank || null,
      rank: me?.rank || null, institutesRanked: board.length, avgTop: me?.avgTop ?? null,
    },
    students: mine.map((x) => ({ name: x.name, rank: x.rank, score: x.score, percentile: x.percentile, accuracy: x.accuracy })),
    topInstitutes: board.slice(0, 10).map((b) => ({ rank: b.rank, name: b.name, city: b.city, takers: b.takers, avgTop: b.avgTop, me: b.instituteId === iid })),
  };
}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function reportEmail(inst, d) {
  const i = d.institute;
  const head = i.takers
    ? `${i.takers} of your ${i.enrolled} students took last Sunday's All-India NEET Mock. Best All-India rank: <b>#${i.bestRank}</b> of ${d.takers}.`
    : `None of your ${i.enrolled} students took last Sunday's All-India NEET Mock (${d.takers} students across India did).`;
  const instRank = i.rank
    ? `<p style="font-size:16px"><b>${esc(inst.name)} is #${i.rank} of ${i.institutesRanked} institutes</b> (average of your best ${d.topN} scores: ${i.avgTop}/${d.totalMarks}).</p>`
    : `<p>Institutes need at least ${d.minTakers} students in the mock to get an institute rank${i.takers ? ` — you had ${i.takers}` : ""}.</p>`;
  const rows = d.students.slice(0, 30).map((s) =>
    `<tr><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0">${esc(s.name)}</td><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right">#${s.rank}</td><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right">${s.score}/${d.totalMarks}</td><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right">${s.percentile}%</td></tr>`).join("");
  const table = rows ? `<table style="border-collapse:collapse;width:100%;font-size:14px;margin:12px 0"><tr style="background:#f1f5f9"><th style="padding:6px 8px;text-align:left">Student</th><th style="padding:6px 8px;text-align:right">All-India rank</th><th style="padding:6px 8px;text-align:right">Score</th><th style="padding:6px 8px;text-align:right">Percentile</th></tr>${rows}</table>` : "";
  const msg = `Students, this Sunday (${d.next?.label || "Sunday"}) is the free All-India NEET Mock on YNeet — 90 questions, real NEET marking, your All-India rank. Open YNeet → All-India Mock any time on Sunday. Let's get our institute into the top 10!`;
  return `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:600px;margin:0 auto;color:#0f172a">
    <h2 style="color:#1e3a8a;margin-bottom:4px">All-India NEET Mock results · ${esc(d.label)}</h2>
    <p>${head}</p>${instRank}${table}
    <p style="margin-top:18px"><b>Next mock: Sunday ${esc(d.next?.label || "")}</b>, free for all your students. Forward this to your students' WhatsApp group:</p>
    <p style="background:#f1f5f9;padding:12px;border-radius:8px">${esc(msg)}</p>
    <p><a href="https://wa.me/?text=${encodeURIComponent(msg)}" style="background:#25D366;color:#fff;padding:10px 16px;border-radius:20px;text-decoration:none;font-weight:700">Share on WhatsApp</a>
    &nbsp; <a href="${SITE()}/institute" style="color:#2563eb">Open your institute panel</a></p>
    <p style="color:#64748b;font-size:12px">YNeet · www.yneet.in</p></div>`;
}

// Monday: email every active institute with students. Once per institute per Sunday.
export async function sendAllIndiaReports() {
  const { meta } = await buildBoard();
  if (!meta.found) return console.log("[allindia] no mock last Sunday — no institute reports");
  const insts = await Institute.find({ status: "active", endDate: { $gt: new Date() }, allIndiaReportFor: { $ne: meta.date } });
  let sent = 0;
  for (const inst of insts) {
    try {
      const d = await instituteAllIndia(inst, meta.date);
      if (!d.institute.enrolled) continue;
      await sendEmail({
        to: inst.email,
        subject: d.institute.rank
          ? `${inst.name} ranked #${d.institute.rank} in the All-India NEET Mock`
          : d.institute.takers ? `Your students' All-India NEET Mock ranks (${d.label})` : `None of your students took the All-India NEET Mock — next one Sunday`,
        html: reportEmail(inst, d),
      });
      await Institute.updateOne({ _id: inst._id }, { $set: { allIndiaReportFor: meta.date } });
      sent++;
    } catch (e) { console.warn(`[allindia] report to ${inst.email} failed:`, e.message); }
  }
  console.log(`[allindia] institute reports sent: ${sent}`);
}

// Mondays 12:30 IST (07:00 UTC), after the Sunday is fully over.
export function startAllIndiaReportJob() {
  const next = () => { const n = new Date(), t = new Date(n); t.setUTCHours(7, 0, 0, 0); if (t <= n) t.setUTCDate(t.getUTCDate() + 1); return t - n; };
  const schedule = () => setTimeout(async () => {
    if (new Date().getUTCDay() === 1) await sendAllIndiaReports().catch((e) => console.warn("[allindia] reports failed:", e.message));
    schedule();
  }, next());
  schedule();
}
