import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight, Clapperboard, Instagram, Play, Share2, X, Youtube } from "lucide-react";

type Short = {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  language: string;
  provider: "youtube" | "bunny" | "mp4";
  videoRef: string;
  durationSec: number | null;
  creatorName: string;
  creator: { id: string; name: string; youtubeUrl: string | null; instagramUrl: string | null } | null;
};

const APP = (import.meta.env.VITE_YNEET_URL || "https://app.yneet.in").replace(/\/$/, "");
const fmtDur = (s: number | null) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : null);
const thumb = (s: Short) => (s.provider === "youtube" ? `https://i.ytimg.com/vi/${s.videoRef}/hqdefault.jpg` : null);
const embed = (s: Short) =>
  s.provider === "youtube" ? `https://www.youtube-nocookie.com/embed/${s.videoRef}?autoplay=1&playsinline=1&rel=0&modestbranding=1`
  : s.provider === "bunny" ? `https://iframe.mediadelivery.net/embed/${s.videoRef}?autoplay=true&responsive=true`
  : s.videoRef;

// Featured YNeet Shorts (picked by the admin) on the landing page, each crediting
// its creator's channel — free marketing for us and for them. Hidden until at
// least one Short is featured; the "become a creator" strip always shows.
const FeaturedShortsSection = () => {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [playing, setPlaying] = useState<Short | null>(null);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_YNEET_API_URL}/public/shorts/featured?limit=8`)
      .then((r) => setShorts(r.data.shorts || []))
      .catch(() => setShorts([]));
  }, []);

  const share = async (s: Short) => {
    const url = `${APP}/s/${s.id}`;
    try {
      if (navigator.share) { await navigator.share({ title: s.title, url }); return; }
    } catch { return; }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${s.title} — learn it in minutes on YNeet\n${url}`)}`, "_blank", "noopener");
  };

  return (
    <section className="py-16 sm:py-20">
      {shorts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div className="max-w-2xl">
              <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm">YNeet Shorts</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold mt-2">One NEET concept in 3–5 minutes.</h2>
              <p className="text-ink/60 mt-2">Made by teachers across India, in English, Tamil and Hindi — with a quick check after every video.</p>
            </div>
            <Link to="/register" className="inline-flex items-center gap-2 bg-ink text-paper font-semibold px-6 py-3 rounded-full hover:bg-ink/90 transition-colors">
              Watch all Shorts free <ArrowRight size={18} />
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
            {shorts.map((s) => {
              const c = s.creator;
              const t = thumb(s);
              return (
                <div key={s.id} className="snap-start shrink-0 w-[240px] rounded-2xl border border-ink/10 bg-white overflow-hidden hover:shadow-lg transition-shadow">
                  <button onClick={() => setPlaying(s)} className="relative block w-full aspect-[3/4] bg-ink" aria-label={`Play ${s.title}`}
                    style={t ? { backgroundImage: `url(${t})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                    {!t && <Clapperboard className="absolute top-1/4 left-1/2 -translate-x-1/2 text-paper/70" size={44} />}
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-14 h-14 rounded-full bg-white/95 text-ink flex items-center justify-center shadow-lg"><Play size={24} className="ml-1" /></span>
                    </span>
                    {fmtDur(s.durationSec) && <span className="absolute bottom-2 right-2 bg-ink/80 text-paper text-xs font-semibold px-2 py-0.5 rounded">{fmtDur(s.durationSec)}</span>}
                    {s.language !== "English" && <span className="absolute top-2 left-2 bg-gold text-ink text-xs font-semibold px-2 py-0.5 rounded-full">{s.language}</span>}
                  </button>
                  <div className="p-3">
                    <p className="text-xs text-ink/50">{s.subject} · {s.chapter}</p>
                    <p className="font-semibold leading-snug mt-0.5 line-clamp-2">{s.title}</p>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <span className="text-sm text-ink/70 truncate">by {c?.name || s.creatorName}</span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        {c?.youtubeUrl && <a href={c.youtubeUrl} target="_blank" rel="noopener noreferrer" aria-label={`${c.name} on YouTube`} className="text-red-600 hover:opacity-80"><Youtube size={18} /></a>}
                        {c?.instagramUrl && <a href={c.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label={`${c.name} on Instagram`} className="text-pink-600 hover:opacity-80"><Instagram size={18} /></a>}
                        <button onClick={() => share(s)} aria-label="Share" className="text-ink/50 hover:text-ink"><Share2 size={17} /></button>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Creator recruitment — always visible */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 ${shorts.length ? "mt-12" : ""}`}>
        <div className="rounded-2xl bg-gold/10 border border-gold/30 p-6 sm:p-8 flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-2xl">
            <h3 className="font-display text-2xl font-bold">Teacher or NEET topper? Become a YNeet creator.</h3>
            <p className="text-ink/70 mt-2">
              Make short NEET concept videos and get paid for every approved Short, every week. Your name and channel are shown on every video,
              and the best ones are featured right here.
            </p>
          </div>
          <a href={`${APP}/creator/apply`} className="inline-flex items-center gap-2 bg-gold text-ink font-semibold px-6 py-3 rounded-full hover:bg-gold-dark transition-colors">
            Apply as a creator <ArrowRight size={18} />
          </a>
        </div>
      </div>

      {playing && (
        <div className="fixed inset-0 z-50 bg-ink/80 flex items-center justify-center p-4" onClick={() => setPlaying(null)}>
          <div className="relative w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPlaying(null)} className="absolute -top-10 right-0 text-paper flex items-center gap-1 text-sm"><X size={18} /> Close</button>
            <div className="aspect-[9/16] max-h-[78vh] w-full bg-black rounded-2xl overflow-hidden mx-auto">
              {playing.provider === "mp4"
                ? <video src={playing.videoRef} controls autoPlay playsInline className="w-full h-full" />
                : <iframe src={embed(playing)} title={playing.title} className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />}
            </div>
            <div className="bg-white rounded-2xl mt-3 p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">{playing.title}</p>
                <p className="text-sm text-ink/60">by {playing.creator?.name || playing.creatorName}</p>
              </div>
              <Link to="/register" className="shrink-0 bg-rise text-white text-sm font-semibold px-4 py-2 rounded-full">Try YNeet free</Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default FeaturedShortsSection;
