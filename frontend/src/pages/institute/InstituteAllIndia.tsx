import { useEffect, useState } from "react";
import { MessageCircle, Trophy } from "lucide-react";
import instituteApi from "../../api/instituteApi";

// Institute panel tab: last Sunday's All-India NEET Mock (on YNeet) — the
// institute's own students with their All-India ranks, and the institute rank list.
type Data = {
  date: string; label: string; found: boolean; takers: number; totalMarks: number; minTakers: number; topN: number;
  next?: { date: string; label: string };
  institute: { enrolled: number; takers: number; bestRank: number | null; rank: number | null; institutesRanked: number; avgTop: number | null };
  students: { name: string; rank: number; score: number; percentile: number; accuracy: number }[];
  topInstitutes: { rank: number; name: string; city: string; takers: number; avgTop: number; me: boolean }[];
};

const InstituteAllIndia = ({ instituteName }: { instituteName: string }) => {
  const [d, setD] = useState<Data | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    instituteApi.get("/allindia").then((r) => setD(r.data)).catch((e) => setError(e?.response?.data?.message || "Couldn't load All-India results."));
  }, []);

  if (error) return <div className="bg-white rounded-2xl p-6 border border-ink/10">{error}</div>;
  if (!d) return <div className="bg-white rounded-2xl p-6 border border-ink/10">Loading…</div>;

  const i = d.institute;
  const msg = `Students, this Sunday${d.next?.label ? ` (${d.next.label})` : ""} is the free All-India NEET Mock on YNeet — 90 questions, real NEET marking, your All-India rank. Open YNeet → All-India Mock any time on Sunday. Let's get ${instituteName} into the top 10!`;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-6 border border-ink/10">
        <h2 className="font-display text-xl font-bold flex items-center gap-2"><Trophy size={20} /> All-India NEET Mock</h2>
        <p className="text-sm text-ink/70 mt-1">Free for your students every Sunday on YNeet · 90 questions · +4/−1 · All-India rank. Results below are from Sunday {d.label}.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="rounded-xl bg-ink/5 p-3"><p className="text-xs text-ink/60 font-semibold">Your students who took it</p><p className="text-2xl font-bold">{i.takers}<span className="text-sm text-ink/50">/{i.enrolled}</span></p></div>
          <div className="rounded-xl bg-ink/5 p-3"><p className="text-xs text-ink/60 font-semibold">Best All-India rank</p><p className="text-2xl font-bold">{i.bestRank ? `#${i.bestRank}` : "—"}</p><p className="text-xs text-ink/50">of {d.takers} students</p></div>
          <div className="rounded-xl bg-gold/15 p-3"><p className="text-xs text-ink/60 font-semibold">Institute rank</p><p className="text-2xl font-bold">{i.rank ? `#${i.rank}` : "—"}</p><p className="text-xs text-ink/50">{i.rank ? `of ${i.institutesRanked} institutes` : `needs ${d.minTakers}+ students`}</p></div>
          <div className="rounded-xl bg-ink/5 p-3"><p className="text-xs text-ink/60 font-semibold">Avg of best {d.topN}</p><p className="text-2xl font-bold">{i.avgTop ?? "—"}</p><p className="text-xs text-ink/50">out of {d.totalMarks}</p></div>
        </div>
        <div className="mt-4 rounded-xl border border-[#25D366]/40 bg-[#25D366]/5 p-4">
          <p className="text-sm font-semibold">Get more students into next Sunday's mock{d.next?.label ? ` (${d.next.label})` : ""}</p>
          <p className="text-sm text-ink/70 mt-1">{msg}</p>
          <a href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-full bg-[#25D366] text-white"><MessageCircle size={15} /> Send to students' group</a>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-ink/10">
        <h3 className="font-semibold">Your students' All-India ranks</h3>
        {!d.students.length ? (
          <p className="text-sm text-ink/60 mt-2">{d.found ? "None of your students took last Sunday's mock." : "The first All-India mock is this Sunday."}</p>
        ) : (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-ink/60"><th className="py-2 pr-3">Student</th><th className="py-2 pr-3 text-right">All-India rank</th><th className="py-2 pr-3 text-right">Score</th><th className="py-2 pr-3 text-right">Percentile</th><th className="py-2 text-right">Accuracy</th></tr></thead>
              <tbody>{d.students.map((s) => (
                <tr key={`${s.rank}-${s.name}`} className="border-t border-ink/10"><td className="py-2 pr-3 font-medium">{s.name}</td><td className="py-2 pr-3 text-right">#{s.rank}</td><td className="py-2 pr-3 text-right">{s.score}/{d.totalMarks}</td><td className="py-2 pr-3 text-right">{s.percentile}%</td><td className="py-2 text-right">{s.accuracy}%</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 border border-ink/10">
        <h3 className="font-semibold">Top institutes · Sunday {d.label}</h3>
        <p className="text-xs text-ink/60">Ranked by the average of each institute's best {d.topN} scores (at least {d.minTakers} students).</p>
        {!d.topInstitutes.length ? <p className="text-sm text-ink/60 mt-2">No institute has {d.minTakers}+ students in a mock yet — be the first.</p> : (
          <ol className="mt-3 space-y-1.5">{d.topInstitutes.map((b) => (
            <li key={b.rank} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${b.me ? "bg-gold/20 font-semibold" : "bg-ink/5"}`}>
              <span className="w-8 font-bold">{b.rank <= 3 ? ["🥇", "🥈", "🥉"][b.rank - 1] : `#${b.rank}`}</span>
              <span className="flex-1">{b.name}{b.city ? <span className="text-ink/50 font-normal"> · {b.city}</span> : null}{b.me ? " (you)" : ""}</span>
              <span className="text-sm text-ink/70">{b.takers} students · avg {b.avgTop}</span>
            </li>
          ))}</ol>
        )}
      </div>
    </div>
  );
};

export default InstituteAllIndia;
