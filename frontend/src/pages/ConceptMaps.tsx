import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { ArrowRight } from "lucide-react";
import { YNEET_API } from "../practice/practiceData";
import ConceptMapView, { MapData } from "../components/ConceptMapView";

// NEET Concept Maps: one chapter on one page, a new one every Monday. Free, no
// login. ?map=<id> opens one map; without it, the newest map is shown first,
// then the full list. Practising the chapter leads to the free sign-up.

type Item = { id: number; group: string; subject: string; chapter: string; title: string; core: string; publish_on: string };
type Full = { id: number; group: string; subject: string; chapter: string; data: MapData; publish_on: string };

const nice = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const track = (e: string, p: Record<string, unknown> = {}) => { try { (window as any).gtag?.("event", e, p); } catch { /* analytics only */ } };

const ConceptMaps = () => {
  const [params, setParams] = useSearchParams();
  const [list, setList] = useState<Item[] | null>(null);
  const [map, setMap] = useState<Full | null>(null);
  const [error, setError] = useState(false);
  const wanted = Number(params.get("map")) || null;

  useEffect(() => {
    axios.get(`${YNEET_API}/public/maps`).then((r) => setList(r.data.maps)).catch(() => setError(true));
  }, []);
  useEffect(() => {
    const id = wanted || list?.[0]?.id;
    if (!id) return;
    axios.get(`${YNEET_API}/public/maps/${id}`).then((r) => setMap(r.data.map)).catch(() => setMap(null));
  }, [wanted, list]);

  const open = (id: number) => { setParams({ map: String(id) }); window.scrollTo({ top: 0, behavior: "smooth" }); track("concept_map_open", { id }); };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <p className="text-gold-deep dark:text-gold font-semibold uppercase tracking-widest text-sm">Concept Map Monday · Free</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">NEET Concept Maps</h1>
      <p className="mt-3 text-ink/70 leading-relaxed">A whole NCERT chapter on one page, for quick revision before a test. A new map every Monday. No login needed.</p>

      {error && <p className="mt-8 text-ink/70">Couldn't load the concept maps. Please try again later.</p>}
      {!list && !error && <p className="mt-8 text-ink/70">Loading…</p>}
      {list && list.length === 0 && <p className="mt-8 text-ink/70">The first concept map comes out on Monday.</p>}

      {map && (
        <section className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl font-bold">{map.data.title}</h2>
            <span className="text-sm text-ink/70">{map.group} · {nice(map.publish_on)}</span>
          </div>
          <div className="mt-4"><ConceptMapView map={map.data} subject={map.subject} chapter={map.chapter} /></div>
          <div className="mt-5 rounded-2xl bg-ink text-paper p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-lg">Now practise {map.chapter}</p>
              <p className="text-paper/70 text-sm">Chapter-wise NEET questions, mock tests and AI explanations. 30 days free.</p>
            </div>
            <Link to="/register" onClick={() => track("concept_map_signup_click", { id: map.id })}
              className="inline-flex items-center gap-2 bg-gold text-ink font-semibold px-5 py-3 rounded-full hover:bg-gold-dark whitespace-nowrap">
              Practise free <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}

      {list && list.length > 1 && (
        <section className="mt-12">
          <h2 className="font-display text-xl font-bold">All concept maps</h2>
          <ul className="mt-4 grid sm:grid-cols-2 gap-3">
            {list.map((m) => (
              <li key={m.id}>
                <button onClick={() => open(m.id)}
                  className={`w-full text-left rounded-2xl border p-4 hover:border-gold ${map?.id === m.id ? "border-gold bg-gold/10" : "border-ink/10 bg-white"}`}>
                  <span className="block font-semibold">{m.title}</span>
                  <span className="block text-sm text-ink/70">{m.subject} · {m.group} · {nice(m.publish_on)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default ConceptMaps;
