// A concept map laid out for any screen: the core idea, then one card per branch.
export type MapData = {
  title: string;
  center: { heading: string; detail: string };
  branches: { heading: string; points: string[] }[];
  remember?: string;
};

const ConceptMapView = ({ map, subject, chapter }: { map: MapData; subject?: string; chapter?: string }) => (
  <div className="space-y-3">
    <div className="rounded-2xl bg-[#3b2fc9] text-white p-5 text-center">
      {(subject || chapter) && <p className="text-xs font-bold tracking-widest text-indigo-200 uppercase">{[subject, chapter].filter(Boolean).join(" · ")}</p>}
      <p className="font-display text-2xl font-bold mt-1">{map.center?.heading || map.title}</p>
      {map.center?.detail && <p className="mt-1 text-indigo-100">{map.center.detail}</p>}
    </div>
    <div className="grid sm:grid-cols-2 gap-3">
      {map.branches.map((b, i) => (
        <div key={i} className={`rounded-2xl p-4 ${i % 2 ? "bg-gold/20" : "bg-white border-2 border-[#3b2fc9]"}`}>
          <p className={`font-bold text-lg ${i % 2 ? "text-ink" : "text-[#3b2fc9]"}`}>{b.heading}</p>
          <ul className="mt-1 list-disc pl-5 space-y-0.5 text-ink/80">
            {b.points.map((p, k) => <li key={k}>{p}</li>)}
          </ul>
        </div>
      ))}
    </div>
    {map.remember && (
      <p className="rounded-xl bg-rise/10 px-4 py-3 text-ink/85"><b>Remember:</b> {map.remember}</p>
    )}
  </div>
);

export default ConceptMapView;
