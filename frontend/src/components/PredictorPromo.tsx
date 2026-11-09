import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, GraduationCap, Target } from "lucide-react";

// Home-page section that sends NEET 2027 aspirants to the College Predictor.
// Closing ranks: MCC 2026 All India Quota, General (Open) category, MBBS.
const TARGETS = [
  { college: "AIIMS New Delhi", rank: 52 },
  { college: "Maulana Azad Medical College, Delhi", rank: 129 },
  { college: "Madras Medical College, Chennai", rank: 1426 },
  { college: "KGMU Lucknow", rank: 1687 },
  { college: "Grant Medical College, Mumbai", rank: 2634 },
  { college: "Last govt MBBS seat (AIQ, General)", rank: 27113 },
];

export default function PredictorPromo() {
  const nav = useNavigate();
  const [air, setAir] = useState("");
  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const n = air.replace(/\D/g, "");
    nav(`/neet-college-predictor?${n ? `air=${n}&` : ""}utm=home`);
  };
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-2">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-ink to-rise-dark text-paper p-6 sm:p-10">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-gold/20 blur-3xl" aria-hidden="true" />
        <div className="relative grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <p className="inline-flex items-center gap-2 bg-gold text-ink text-xs sm:text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
              <GraduationCap size={16} /> New · For NEET 2027 aspirants
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight mt-4">
              Which medical college will <span className="text-gold">your rank</span> get you?
            </h2>
            <p className="text-paper/80 mt-3 text-lg">
              Our free <b>NEET College Predictor</b> checks your rank against the official 2026 closing ranks of every MBBS &amp; BDS college: All India Quota + 15 state quotas.
            </p>
            <ul className="mt-4 space-y-1.5 text-paper/85">
              <li>✅ Set a target rank now and study for it all year</li>
              <li>✅ Government, private, deemed and state quota seats</li>
              <li>✅ Your category and state reservation included</li>
            </ul>
            <form onSubmit={go} className="mt-6 flex flex-col sm:flex-row gap-3">
              <input
                value={air}
                onChange={(e) => setAir(e.target.value)}
                inputMode="numeric"
                placeholder="Expected NEET rank (AIR)"
                aria-label="Expected NEET All India Rank"
                className="flex-1 min-w-0 rounded-full px-5 py-3.5 text-ink bg-paper placeholder:text-ink/45 focus:outline-none focus:ring-4 focus:ring-gold/50"
              />
              <button className="inline-flex items-center justify-center gap-2 bg-gold text-ink font-bold px-6 py-3.5 rounded-full hover:bg-gold-dark transition-colors">
                Predict my college <ArrowRight size={18} />
              </button>
            </form>
            <p className="text-xs text-paper/55 mt-2">Free · Takes 30 seconds · Works with marks too for Tamil Nadu</p>
          </div>

          <div className="rounded-2xl bg-paper/10 border border-paper/15 p-5">
            <p className="flex items-center gap-2 font-semibold"><Target size={18} className="text-gold" /> Rank you needed in NEET 2026</p>
            <p className="text-xs text-paper/60 mt-0.5">Closing rank, All India Quota, General category, MBBS</p>
            <ul className="mt-4 divide-y divide-paper/10">
              {TARGETS.map((t) => (
                <li key={t.college} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-paper/90 text-sm sm:text-base">{t.college}</span>
                  <span className="font-display font-bold text-gold text-lg tabular-nums">{t.rank.toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>
            <Link to="/neet-college-predictor" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold hover:underline">
              See your own list of colleges <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
