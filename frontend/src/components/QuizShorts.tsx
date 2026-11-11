import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import api from "../api/axios";

// Daily NEET quiz Shorts from Raise Academy's YouTube channel (made by the YNeet
// shorts-bot; list from GET /api/youtube-shorts, public videos only).
// The player shows the thumbnail and loads YouTube only when tapped.
export type QuizShort = { videoId: string; subject: string; chapter: string; title: string; questionSlug: string; date: string; publishAt?: string; thumbnail?: string };

export function ShortPlayer({ s }: { s: QuizShort }) {
  const [on, setOn] = useState(false);
  const thumb = s.thumbnail || `https://i.ytimg.com/vi/${s.videoId}/hqdefault.jpg`;
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-ink" style={{ aspectRatio: "9 / 16" }}>
      {on ? (
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube-nocookie.com/embed/${s.videoId}?autoplay=1&rel=0&playsinline=1`}
          title={s.title || "NEET quiz short"}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button onClick={() => setOn(true)} className="absolute inset-0 w-full h-full group" aria-label={`Play: ${s.title}`}>
          <img src={thumb} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="w-14 h-14 rounded-full bg-gold text-ink grid place-items-center shadow-lg"><Play size={26} fill="currentColor" /></span>
          </span>
        </button>
      )}
    </div>
  );
}

export function ShortCard({ s }: { s: QuizShort }) {
  return (
    <div className="min-w-0">
      <ShortPlayer s={s} />
      <p className="text-xs text-ink/55 dark:text-paper/55 mt-2">{s.subject}{s.chapter ? ` · ${s.chapter}` : ""}</p>
      {s.questionSlug && (
        <Link to={`/neet-question/${s.questionSlug}`} className="text-sm font-semibold text-rise-dark hover:underline">Answer & explanation →</Link>
      )}
    </div>
  );
}

export function useQuizShorts(limit: number, initial?: QuizShort[]) {
  const [shorts, setShorts] = useState<QuizShort[] | null>(initial || null);
  useEffect(() => {
    api.get("/youtube-shorts", { params: { limit } }).then((r) => setShorts(r.data.shorts || [])).catch(() => setShorts((x) => x || []));
  }, [limit]);
  return shorts;
}

// Home page strip: the latest few. Hidden until there's at least one public video.
export default function QuizShortsSection() {
  const shorts = useQuizShorts(6);
  if (!shorts || !shorts.length) return null;
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm text-center">New every day</p>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mt-1">Daily NEET Quiz Shorts</h2>
      <p className="text-center text-ink/70 dark:text-paper/70 mt-2">One Physics, Chemistry and Biology question every day. Can you answer in 5 seconds?</p>
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {shorts.slice(0, 6).map((s) => <ShortCard key={s.videoId} s={s} />)}
      </div>
      <div className="text-center mt-6"><Link to="/neet-quiz-shorts" className="font-semibold text-rise-dark underline">All quiz Shorts →</Link></div>
    </section>
  );
}
