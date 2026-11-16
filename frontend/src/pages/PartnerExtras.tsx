import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import QRCode from "qrcode";
import api from "../api/axios";
import { YNEET_API } from "../practice/practiceData";
import { NEET_YEAR, daysToNeet } from "../utils/neetDate";

// Extras for an institute's free tools page (www.yneet.in/i/<slug>), shown
// without the site menu so they print / save cleanly:
//   /i/<slug>/poster  printable A4 notice-board poster with a QR code to their page
//   /i/<slug>/status  today's NEET question as a WhatsApp status image with their name

type Partner = { name: string; slug: string; city: string };

function usePartner() {
  const { slug = "" } = useParams();
  const [p, setP] = useState<Partner | null | undefined>(undefined);
  useEffect(() => {
    api.get(`/widgets/partners/${encodeURIComponent(slug)}`).then((r) => setP(r.data.partner)).catch(() => setP(null));
  }, [slug]);
  return p;
}

const Missing = () => (
  <div className="max-w-xl mx-auto px-4 py-16">
    <h1 className="font-display text-3xl font-bold">Page not found</h1>
    <p className="mt-3 text-ink/70">Make a free tools page for your institute on <a href="/neet-question-widget#no-website" className="underline font-semibold">YNeet</a>.</p>
  </div>
);

// ---------------------------------------------------------------- poster

const TOOLS = [
  ["📅", "NEET countdown", "and what to finish this week"],
  ["❓", "NEET Question of the Day", "with answer and explanation"],
  ["🎓", "College Predictor", "MBBS / BDS colleges for your rank"],
  ["📊", "Government MBBS cutoffs", "All India and state quota"],
  ["📚", "Chapter-wise weightage", "which chapters carry the most marks"],
];

export const PartnerPoster = () => {
  const p = usePartner();
  const [qr, setQr] = useState("");
  useEffect(() => {
    if (!p) return;
    document.title = `${p.name} — NEET tools poster`;
    QRCode.toString(`https://www.yneet.in/i/${p.slug}`, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#14213D", light: "#FFFFFF" } }).then(setQr).catch(() => setQr(""));
  }, [p]);
  if (p === undefined) return <p className="p-8 text-ink/70">Loading…</p>;
  if (p === null) return <Missing />;

  return (
    <div className="bg-ink-50 min-h-screen py-6 print:p-0 print:bg-white">
      <style>{`@page { size: A4; margin: 0 } @media print { .no-print { display: none !important } body { -webkit-print-color-adjust: exact; print-color-adjust: exact } }`}</style>
      <div className="no-print max-w-[210mm] mx-auto px-4 mb-4 flex flex-wrap gap-2 items-center">
        <button onClick={() => window.print()} className="bg-gold text-ink font-bold px-5 py-3 rounded-full">Print / Save as PDF</button>
        <p className="text-sm text-ink/70">Print on A4 and put it on your notice board. On a phone: Share → Print → Save as PDF.</p>
      </div>
      <div className="mx-auto bg-white shadow-lg print:shadow-none flex flex-col" style={{ width: "210mm", height: "297mm", maxWidth: "100%" }}>
        <div className="bg-ink text-paper px-[14mm] pt-[14mm] pb-[10mm]">
          <p className="text-gold font-bold uppercase tracking-[0.2em] text-sm">Free for our NEET students</p>
          <h1 className="font-display font-bold leading-tight mt-3" style={{ fontSize: p.name.length > 28 ? "30pt" : "38pt" }}>{p.name}</h1>
          {p.city && <p className="text-paper/70 text-lg mt-1">{p.city}</p>}
        </div>
        <div className="flex-1 px-[14mm] py-[10mm] flex flex-col">
          <h2 className="font-display text-[22pt] font-bold leading-snug">Free NEET tools on your phone. No login, no cost.</h2>
          <ul className="mt-6 space-y-4">
            {TOOLS.map(([icon, t, d]) => (
              <li key={t} className="flex gap-4 items-center">
                <span className="text-[22pt] w-[14mm] text-center">{icon}</span>
                <span><b className="text-[15pt]">{t}</b><br /><span className="text-ink/70 text-[12pt]">{d}</span></span>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex items-center gap-[10mm] rounded-3xl border-4 border-gold p-[8mm]">
            <div className="w-[52mm] h-[52mm] shrink-0 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: qr }} />
            <div>
              <p className="font-display text-[24pt] font-bold leading-tight">Scan with your phone camera</p>
              <p className="mt-2 text-[12pt] text-ink/70 break-all">www.yneet.in/i/{p.slug}</p>
              <p className="mt-3 text-[12pt] font-semibold">Preparing for NEET {NEET_YEAR}? Start today.</p>
            </div>
          </div>
        </div>
        <p className="text-center text-[10pt] text-ink/60 pb-[8mm]">Tools by YNeet · www.yneet.in</p>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- status image

type Q = { number: number; subject: string; chapter: string; question: string; options: string[] };
const W = 1080, H = 1920, PAD = 80;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const t = line ? `${line} ${word}` : word;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = word; } else line = t;
    }
    lines.push(line);
  }
  return lines;
}

// Draws the 1080×1920 (9:16) status image. Shrinks the text until the question
// and options fit between the header and the footer.
function draw(c: HTMLCanvasElement, q: Q, p: Partner) {
  const ctx = c.getContext("2d")!;
  c.width = W; c.height = H;
  ctx.fillStyle = "#14213D"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#F2A93B"; ctx.fillRect(0, 0, W, 16);

  ctx.textBaseline = "top";
  ctx.fillStyle = "#F2A93B"; ctx.font = "700 40px Inter, sans-serif";
  ctx.fillText("NEET QUESTION OF THE DAY", PAD, 110);
  ctx.fillStyle = "rgba(251,250,247,0.7)"; ctx.font = "500 36px Inter, sans-serif";
  ctx.fillText(`#${q.number} · ${q.subject}${q.chapter ? ` · ${q.chapter}` : ""}`.slice(0, 52), PAD, 170);

  const top = 280, bottom = H - 470, maxW = W - PAD * 2;
  let size = 52, layout: { lines: string[]; opts: string[][]; h: number } | null = null;
  for (; size >= 26; size -= 2) {
    ctx.font = `600 ${size}px Inter, sans-serif`;
    const lines = wrap(ctx, q.question, maxW);
    ctx.font = `500 ${size - 4}px Inter, sans-serif`;
    const opts = q.options.map((o, i) => wrap(ctx, `${"ABCD"[i]}.  ${o}`, maxW - 60));
    const lh = size * 1.3, olh = (size - 4) * 1.3;
    const h = lines.length * lh + 50 + opts.reduce((n, o) => n + o.length * olh + 56, 0);
    layout = { lines, opts, h };
    if (h <= bottom - top) break;
  }
  const { lines, opts } = layout!;
  let y = top;
  ctx.fillStyle = "#FBFAF7"; ctx.font = `600 ${size}px Inter, sans-serif`;
  for (const l of lines) { ctx.fillText(l, PAD, y); y += size * 1.3; }
  y += 50;
  ctx.font = `500 ${size - 4}px Inter, sans-serif`;
  const olh = (size - 4) * 1.3;
  for (const o of opts) {
    const boxH = o.length * olh + 32;
    ctx.fillStyle = "rgba(251,250,247,0.08)";
    ctx.beginPath(); ctx.roundRect(PAD, y, maxW, boxH, 24); ctx.fill();
    ctx.fillStyle = "#FBFAF7";
    o.forEach((l, i) => ctx.fillText(l, PAD + 30, y + 16 + i * olh));
    y += boxH + 24;
  }

  // Footer: the institute's name + where to see the answer.
  const fy = H - 420;
  ctx.fillStyle = "#F2A93B"; ctx.beginPath(); ctx.roundRect(PAD, fy, maxW, 170, 32); ctx.fill();
  ctx.fillStyle = "#14213D"; ctx.font = "700 46px Inter, sans-serif";
  ctx.fillText("Answer + explanation 👇", PAD + 40, fy + 32);
  ctx.font = "600 38px Inter, sans-serif";
  ctx.fillText(`yneet.in/i/${p.slug}`.slice(0, 40), PAD + 40, fy + 100);

  ctx.fillStyle = "rgba(251,250,247,0.75)"; ctx.font = "500 34px Inter, sans-serif";
  ctx.fillText("Shared by", PAD, H - 200);
  ctx.fillStyle = "#FBFAF7"; ctx.font = "700 48px 'Space Grotesk', Inter, sans-serif";
  ctx.fillText(wrap(ctx, p.name, maxW)[0], PAD, H - 150);
  const days = daysToNeet();
  if (days > 0) {
    ctx.fillStyle = "rgba(251,250,247,0.6)"; ctx.font = "500 32px Inter, sans-serif";
    ctx.fillText(`${days} days to NEET ${NEET_YEAR} · Tools by YNeet`, PAD, H - 80);
  }
}

export const PartnerStatus = () => {
  const p = usePartner();
  const [q, setQ] = useState<Q | null | undefined>(undefined);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [stopMsg, setStopMsg] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!YNEET_API) { setQ(null); return; }
    axios.get(`${YNEET_API}/public/qotd`).then((r) => setQ(r.data.today)).catch(() => setQ(null));
  }, []);

  useEffect(() => {
    if (!p || !q || !canvas.current) return;
    document.title = `${p.name} — today's NEET status`;
    const c = canvas.current;
    (document.fonts?.ready || Promise.resolve()).then(() => {
      draw(c, q, p);
      c.toBlob((b) => {
        if (!b) return;
        const f = new File([b], `neet-question-${q.number}.png`, { type: "image/png" });
        setFile(f); setUrl(URL.createObjectURL(f));
      }, "image/png");
    });
  }, [p, q]);

  if (p === undefined || q === undefined) return <p className="p-8 text-ink/70">Making today's image…</p>;
  if (p === null) return <Missing />;
  if (q === null) return <p className="p-8 text-ink/70">Today's question couldn't load. Please try again in a few minutes.</p>;

  const caption = `Today's NEET question 🧠 Try it, then see the answer: https://www.yneet.in/i/${p.slug}`;
  const canShare = !!file && typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [file] });
  const share = async () => {
    if (!file) return;
    try { await navigator.share({ files: [file], text: caption }); } catch { /* cancelled */ }
    try { (window as any).gtag?.("event", "partner_status_share", { partner: p.slug }); } catch { /* analytics only */ }
  };
  const stop = async (e: React.FormEvent) => {
    e.preventDefault();
    try { const r = await api.post(`/widgets/partners/${p.slug}/stop-daily`, { phone }); setStopMsg(r.data.message); }
    catch (err: any) { setStopMsg(err?.response?.data?.message || "Couldn't stop them. Please try again."); }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <p className="text-gold-deep font-semibold uppercase tracking-widest text-xs">{p.name}</p>
      <h1 className="font-display text-2xl font-bold mt-1">Today's NEET question for your WhatsApp status</h1>
      <p className="text-sm text-ink/70 mt-2">A new one every morning. Students who view your status see the question with your name, and get the answer on your page.</p>
      <canvas ref={canvas} className="mt-4 w-full rounded-2xl shadow" style={{ aspectRatio: "9 / 16" }} />
      <div className="mt-4 grid gap-2">
        {canShare && <button onClick={share} className="bg-gold text-ink font-bold px-5 py-3 rounded-full">Share to WhatsApp status</button>}
        {url && <a href={url} download={file?.name} className="text-center border border-ink/20 font-semibold px-5 py-3 rounded-full">Download image</a>}
        <button onClick={async () => { try { await navigator.clipboard.writeText(caption); } catch { /* blocked */ } }} className="border border-ink/20 font-semibold px-5 py-3 rounded-full">Copy caption with link</button>
      </div>
      <p className="mt-3 text-xs text-ink/60">On a phone: tap Share → WhatsApp → My status. Add the caption so students can tap the link.</p>
      <details className="mt-8 text-sm text-ink/70">
        <summary className="cursor-pointer">Stop the daily WhatsApp reminder</summary>
        <form onSubmit={stop} className="mt-3 flex gap-2">
          <input inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Your WhatsApp number" className="flex-1 px-3 py-2 rounded-xl border border-ink/20" />
          <button className="border border-ink/20 font-semibold px-4 py-2 rounded-full">Stop</button>
        </form>
        {stopMsg && <p className="mt-2">{stopMsg}</p>}
      </details>
    </div>
  );
};
