// Boxes other websites (coaching centres, schools, blogs) show in an <iframe>:
//   /embed/predictor            NEET College Predictor: rank + category + state → opens the predictor
//   /embed/cutoff?state=<slug>  top government MBBS cutoffs for one quota
//   /embed/weightage?subject=<Physics|Chemistry|Biology>  top NEET chapters by weightage
// No site header or footer. Every link opens www.yneet.in in a new tab and
// carries the host site in its UTM tags (same as the Question of the Day box).
import { useEffect, useState } from "react";
import api from "../api/axios";
import axios from "axios";
import { YNEET_API, SUBJECTS, type CutoffState, type PracticeChapterSummary } from "../practice/practiceData";

function hostSite() {
  try { return document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : "direct"; } catch { return "direct"; }
}
function useLink(campaign: string) {
  const [site, setSite] = useState("direct");
  useEffect(() => { setSite(hostSite()); }, []);
  return (path: string) => `https://www.yneet.in${path}${path.includes("?") ? "&" : "?"}utm_source=${encodeURIComponent(site)}&utm_medium=widget&utm_campaign=${campaign}`;
}

// ?by=<Institute name>: the box says "Shared by <name>" so a coaching centre
// or school can put it on its site (or its /i/ page) as its own free tool.
export function readBy() {
  try { return (new URLSearchParams(window.location.search).get("by") || "").replace(/[<>"`\\]/g, "").replace(/\s+/g, " ").trim().slice(0, 60); } catch { return ""; }
}
export function useBy() {
  const [by, setBy] = useState("");
  useEffect(() => { setBy(readBy()); }, []);
  return by;
}
// Tells our server which website this box is on (Admin → Widget partners →
// "Sites using widgets"). Once per load; never blocks the box.
export function usePing(widget: string) {
  useEffect(() => {
    if (!document.referrer || window.parent === window) return;
    api.post("/widgets/ping", { widget, ref: document.referrer, by: readBy() }).catch(() => {});
  }, [widget]);
}

export function ByLine() {
  const by = useBy();
  return by ? <p className="bg-gold/15 text-ink text-xs font-semibold px-4 py-1.5 truncate">Shared by {by}</p> : null;
}

function Frame({ title, tag, children, footer }: { title: string; tag?: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="font-body text-ink bg-white min-h-screen p-3">
      <div className="rounded-2xl border border-ink/15 overflow-hidden bg-white">
        <div className="bg-ink text-paper px-4 py-3 flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gold">{title}</span>
          {tag && <span className="text-xs text-paper/70">{tag}</span>}
        </div>
        <ByLine />
        <div className="p-4">{children}</div>
        <div className="border-t border-ink/10 px-4 py-2.5 flex items-center justify-between gap-2 text-xs">{footer}</div>
      </div>
    </div>
  );
}

// Same list as the College Predictor's home-state choices.
export const PREDICTOR_STATES: [string, string][] = [
  ["", "Only All India Quota"], ["AP", "Andhra Pradesh"], ["BR", "Bihar"], ["DL", "Delhi (DU/IP)"], ["GJ", "Gujarat"], ["JH", "Jharkhand"],
  ["KA", "Karnataka"], ["KL", "Kerala"], ["MP", "Madhya Pradesh"], ["MH", "Maharashtra"], ["PB", "Punjab"], ["RJ", "Rajasthan"],
  ["TN", "Tamil Nadu"], ["TS", "Telangana"], ["UP", "Uttar Pradesh"], ["WB", "West Bengal"],
];
const CATS: [string, string][] = [["OPEN", "General / UR"], ["EWS", "EWS"], ["OBC", "OBC (NCL)"], ["SC", "SC"], ["ST", "ST"]];

export const PredictorEmbed = () => {
  const link = useLink("predictor_embed");
  usePing("predictor");
  const [air, setAir] = useState("");
  const [category, setCategory] = useState("OPEN");
  const [state, setState] = useState("");
  const [course, setCourse] = useState("MBBS");
  const [err, setErr] = useState("");

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{1,7}$/.test(air.trim())) { setErr("Enter your NEET All India Rank"); return; }
    const q = new URLSearchParams({ air: air.trim(), category, course, ...(state && { state }) });
    window.open(link(`/neet-college-predictor?${q}`), "_blank", "noopener");
  };
  const input = "w-full mt-1 px-3 py-2.5 rounded-xl border border-ink/20 bg-white text-sm min-h-[44px]";

  return (
    <Frame title="NEET College Predictor" tag="Free"
      footer={<><span className="text-ink/70">From last year's official closing ranks</span><a href={link("/neet-college-predictor")} target="_blank" rel="noopener" className="font-bold text-ink hover:text-gold-dark">by YNeet ↗</a></>}>
      <p className="text-sm text-ink/70">See the MBBS and BDS colleges you can get with your NEET rank: All India Quota plus your state quota.</p>
      <form onSubmit={go} className="mt-3 space-y-3">
        <label className="block text-sm font-semibold">NEET All India Rank
          <input inputMode="numeric" value={air} onChange={(e) => { setAir(e.target.value.replace(/\D/g, "")); setErr(""); }} placeholder="e.g. 45000" className={input} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">Category
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={input}>
              {CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Course
            <select value={course} onChange={(e) => setCourse(e.target.value)} className={input}>
              <option value="MBBS">MBBS</option><option value="BDS">BDS</option>
            </select>
          </label>
        </div>
        <label className="block text-sm font-semibold">Home state
          <select value={state} onChange={(e) => setState(e.target.value)} className={input}>
            {PREDICTOR_STATES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button type="submit" className="w-full bg-gold text-ink font-bold px-5 py-3 rounded-full hover:bg-gold-dark min-h-[44px]">Show my colleges ↗</button>
      </form>
    </Frame>
  );
};

const fmt = (n?: number) => (n === undefined ? "—" : n.toLocaleString("en-IN"));
const ROWS = 10;

export const CutoffEmbed = () => {
  const link = useLink("cutoff_embed");
  usePing("cutoff");
  const [slug, setSlug] = useState("");
  const [c, setC] = useState<CutoffState | null | undefined>(undefined);

  useEffect(() => {
    const s = (new URLSearchParams(window.location.search).get("state") || "all-india-quota").toLowerCase().replace(/[^a-z-]/g, "");
    setSlug(s);
    api.get(`/predictor/cutoff-pages?state=${s}`)
      .then((r) => setC((r.data.states || []).find((x: CutoffState) => x.slug === s) || null))
      .catch(() => setC(null));
  }, []);

  const name = c ? (c.code === "AIQ" ? "All India Quota" : c.name) : "";
  const unit = c?.rankType === "SCORE" ? "marks" : "rank";
  const valueHead = c?.rankType === "SCORE" ? "General (marks)" : "General (rank)";
  const open = c?.categorySummary.find((x) => x.category === "OPEN");

  return (
    <Frame title={c ? `${name} NEET cutoff ${c.year}` : "NEET cutoff"} tag="Govt MBBS"
      footer={<><span className="text-ink/70">Official counselling data</span><a href={link(`/neet-cutoff/${slug}`)} target="_blank" rel="noopener" className="font-bold text-ink hover:text-gold-dark">by YNeet ↗</a></>}>
      {c === undefined && <p className="text-sm text-ink/70">Loading cutoffs…</p>}
      {c === null && <p className="text-sm text-ink/70">Couldn't load the cutoffs. <a href={link("/neet-cutoff")} target="_blank" rel="noopener" className="underline font-semibold">See them on YNeet</a>.</p>}
      {c && (
        <>
          {open && <p className="text-sm text-ink/70">General category: last government MBBS seat at {unit === "marks" ? <><b>{fmt(open.last)}</b> marks</> : <>rank <b>{fmt(open.last)}</b></>}.</p>}
          <table className="w-full mt-3 text-sm border-collapse">
            <thead><tr className="text-left border-b border-ink/15"><th className="py-1.5 pr-2">College</th><th className="py-1.5 text-right">{valueHead}</th></tr></thead>
            <tbody>
              {c.colleges.filter((x) => x.closing.OPEN !== undefined).slice(0, ROWS).map((x) => (
                <tr key={x.college} className="border-b border-ink/5"><td className="py-1.5 pr-2">{x.college}</td><td className="py-1.5 text-right">{fmt(x.closing.OPEN)}</td></tr>
              ))}
            </tbody>
          </table>
          <a href={link(`/neet-cutoff/${slug}`)} target="_blank" rel="noopener" className="inline-block mt-3 text-sm font-semibold text-rise-dark underline">All {c.colleges.length} colleges, every category ↗</a>
        </>
      )}
    </Frame>
  );
};

const W_ROWS = 10;

export const WeightageEmbed = () => {
  const link = useLink("weightage_embed");
  usePing("weightage");
  const [subject, setSubject] = useState("Biology");
  const [chapters, setChapters] = useState<PracticeChapterSummary[] | null | undefined>(undefined);

  useEffect(() => {
    const q = (new URLSearchParams(window.location.search).get("subject") || "").toLowerCase();
    const pick = SUBJECTS.find((x) => x.toLowerCase() === q);
    if (pick) setSubject(pick);
    if (!YNEET_API) { setChapters(null); return; }
    axios.get(`${YNEET_API}/public/practice`)
      .then((r) => setChapters(r.data.chapters || []))
      .catch(() => setChapters(null));
  }, []);

  const list = (chapters || [])
    .filter((c) => c.subject === subject && c.weightage)
    .sort((a, b) => b.weightage!.expectedQs - a.weightage!.expectedQs)
    .slice(0, W_ROWS);

  return (
    <Frame title={`NEET ${subject} weightage`} tag="Top chapters"
      footer={<><span className="text-ink/70">From NEET previous year papers</span><a href={link("/neet-chapter-wise-weightage")} target="_blank" rel="noopener" className="font-bold text-ink hover:text-gold-dark">by YNeet ↗</a></>}>
      <div className="flex gap-1.5 mb-3" role="tablist">
        {SUBJECTS.map((x) => (
          <button key={x} role="tab" aria-selected={x === subject} onClick={() => setSubject(x)}
            className={`flex-1 text-xs font-semibold px-2 py-2 rounded-full border min-h-[36px] ${x === subject ? "bg-ink text-paper border-ink" : "border-ink/20 text-ink/75"}`}>{x}</button>
        ))}
      </div>
      {chapters === undefined && <p className="text-sm text-ink/70">Loading chapters…</p>}
      {(chapters === null || (chapters && !list.length)) && <p className="text-sm text-ink/70">Couldn't load the weightage. <a href={link("/neet-chapter-wise-weightage")} target="_blank" rel="noopener" className="underline font-semibold">See it on YNeet</a>.</p>}
      {list.length > 0 && (
        <>
          <p className="text-sm text-ink/70">The {subject} chapters that carry the most questions in a NEET paper.</p>
          <table className="w-full mt-3 text-sm border-collapse">
            <thead><tr className="text-left border-b border-ink/15"><th className="py-1.5 pr-2">Chapter</th><th className="py-1.5 pr-2 text-right">Qs</th><th className="py-1.5 text-right">Priority</th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.slug} className="border-b border-ink/5">
                  <td className="py-1.5 pr-2"><a href={link(`/neet-practice/${c.slug}`)} target="_blank" rel="noopener" className="hover:underline">{c.chapter}</a></td>
                  <td className="py-1.5 pr-2 text-right">~{c.weightage!.expectedQs}</td>
                  <td className={`py-1.5 text-right font-semibold ${c.weightage!.priority === "High" ? "text-rise-dark" : "text-ink/70"}`}>{c.weightage!.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <a href={link("/neet-chapter-wise-weightage")} target="_blank" rel="noopener" className="inline-block mt-3 text-sm font-semibold text-rise-dark underline">Every chapter, all 3 subjects ↗</a>
        </>
      )}
    </Frame>
  );
};

// /embed/pyq?chapter=<subject/chapter>           5 NEET PYQs from one chapter
// /embed/pyq?class=<6-10>&chapter=<chapterSlug>  5 Class 6–10 Science MCQs from one chapter
// The API picks a new set of 5 each day (rotating through the chapter), never the full chapter,
// so the box sends students to the chapter page on yneet.in for the rest.
type WQ = { id: string; question: string; options: string[]; answer: number; explanation: string; pyqYear: number | null };
const LETTERS = ["A", "B", "C", "D"];

export const PyqEmbed = () => {
  const link = useLink("pyq_embed");
  usePing("pyq");
  const [info, setInfo] = useState<{ title: string; page: string; total: number; school: boolean } | null>(null);
  const [qs, setQs] = useState<WQ[] | null | undefined>(undefined);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<Record<number, number>>({});

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const chapter = (p.get("chapter") || "").toLowerCase().replace(/[^a-z0-9/-]/g, "");
    const cls = Number(p.get("class") || 0);
    if (!YNEET_API || !chapter) { setQs(null); return; }

    const url = cls >= 6 && cls <= 10
      ? `${YNEET_API}/public/school-questions/daily?class=${cls}&chapter=${encodeURIComponent(chapter)}`
      : `${YNEET_API}/public/practice/${chapter}/daily`;
    axios.get(url).then((r) => {
      const c = r.data.chapter;
      const list: WQ[] = r.data.questions || [];
      if (!c || !list.length) { setQs(null); return; }
      setInfo(c.classNum
        ? { title: `Class ${c.classNum} · ${c.chapter}`, page: `/class-${c.classNum}-questions#${c.slug}`, total: c.total, school: true }
        : { title: `${c.subject} · ${c.chapter}`, page: `/neet-practice/${c.slug}`, total: c.pyqCount || c.total, school: false });
      setQs(list);
    }).catch(() => setQs(null));
  }, []);

  const q = qs?.[i];
  const ans = picked[i];
  const shown = ans !== undefined;
  const score = qs ? qs.reduce((s, x, k) => s + (picked[k] === x.answer ? 1 : 0), 0) : 0;
  const done = qs && Object.keys(picked).length === qs.length;
  const label = info?.school ? "questions" : "PYQs";

  return (
    <Frame title={info ? info.title : "NEET chapter PYQs"} tag={qs ? `${Math.min(i + 1, qs.length)} / ${qs.length}` : undefined}
      footer={<><span className="text-ink/70">New questions every day</span><a href={link(info?.page || "/neet-practice")} target="_blank" rel="noopener" className="font-bold text-ink hover:text-gold-dark">by YNeet ↗</a></>}>
      {qs === undefined && <p className="text-sm text-ink/70">Loading questions…</p>}
      {qs === null && <p className="text-sm text-ink/70">Couldn't load the questions. <a href={link("/neet-practice")} target="_blank" rel="noopener" className="underline font-semibold">Practise free on YNeet</a>.</p>}
      {q && (
        <>
          {q.pyqYear && <span className="inline-block text-[11px] font-bold uppercase tracking-wider bg-gold/20 text-gold-deep px-2 py-0.5 rounded">NEET {q.pyqYear}</span>}
          <p className="font-semibold leading-snug whitespace-pre-line mt-2">{q.question}</p>
          <div className="mt-3 space-y-2">
            {q.options.map((o, k) => {
              const right = shown && q.answer === k + 1;
              const wrong = shown && ans === k + 1 && !right;
              return (
                <button key={k} disabled={shown} onClick={() => setPicked((p) => ({ ...p, [i]: k + 1 }))}
                  className={`w-full text-left text-sm flex gap-2 px-3 py-2.5 rounded-xl border min-h-[44px] ${right ? "border-rise bg-rise/10 font-semibold" : wrong ? "border-red-400 bg-red-50" : "border-ink/15 hover:border-gold"}`}>
                  <b>{LETTERS[k]}.</b> <span className="whitespace-pre-line">{o}</span>
                </button>
              );
            })}
          </div>
          {shown && (
            <div className="mt-3 text-sm">
              <p className={`font-bold ${ans === q.answer ? "text-rise-dark" : "text-red-600"}`}>
                {ans === q.answer ? "Correct!" : `Not quite. The answer is ${LETTERS[q.answer - 1]}.`}
              </p>
              {q.explanation && <p className="mt-1 text-ink/75 line-clamp-4">{q.explanation}</p>}
              {i < qs!.length - 1 && (
                <button onClick={() => setI(i + 1)} className="mt-3 w-full bg-ink text-paper font-semibold px-5 py-2.5 rounded-full min-h-[44px]">Next question →</button>
              )}
            </div>
          )}
          {done && info && (
            <div className="mt-4 rounded-xl bg-gold/15 border border-gold/40 p-3 text-sm">
              <p className="font-bold">You scored {score} / {qs!.length}.</p>
              <a href={link(info.page)} target="_blank" rel="noopener" className="mt-2 block text-center bg-gold text-ink font-bold px-4 py-2.5 rounded-full">
                More {label} on this chapter, free on YNeet ↗
              </a>
            </div>
          )}
        </>
      )}
    </Frame>
  );
};
