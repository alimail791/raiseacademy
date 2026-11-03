import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight } from "lucide-react";
import { YNEET_API } from "../practice/practiceData";
import ConceptMapView, { MapData } from "./ConceptMapView";

// Home page: "This week's concept map". Hidden until at least one map is published.
type Full = { id: number; subject: string; chapter: string; data: MapData };

const ConceptMapSection = () => {
  const [map, setMap] = useState<Full | null>(null);
  useEffect(() => {
    axios.get(`${YNEET_API}/public/maps`)
      .then((r) => (r.data.maps?.[0] ? axios.get(`${YNEET_API}/public/maps/${r.data.maps[0].id}`) : null))
      .then((r) => r && setMap(r.data.map))
      .catch(() => {});
  }, []);
  if (!map) return null;
  const preview: MapData = { ...map.data, branches: map.data.branches.slice(0, 4), remember: undefined };
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm">Concept Map Monday · Free</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold mt-1">This week's concept map: {map.data.title}</h2>
        </div>
        <Link to={`/neet-concept-maps?map=${map.id}`} className="inline-flex items-center gap-1 font-semibold text-rise-dark">
          See the full map <ArrowRight size={16} />
        </Link>
      </div>
      <div className="mt-5"><ConceptMapView map={preview} subject={map.subject} chapter={map.chapter} /></div>
    </section>
  );
};

export default ConceptMapSection;
