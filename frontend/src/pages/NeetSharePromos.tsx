import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { estimateRank, fmtRank } from "../score/scoring";
import { NEET_YEAR, daysToNeet } from "../utils/neetDate";

// /neet-share (noindex): ready-made 9:16 WhatsApp status / Instagram story images
// for YNeet's free tools, with a caption + tracked link. For Akbar's own status,
// the assistant, and partner institutes (linked from /i/<slug>/status).
// ?by=<name> prints "Shared by <name>" on the image.

type Promo = {
  key: string;
  tag: string;
  title: string;
  lines: string[]; // example rows drawn in boxes
  cta: string;
  path: string;
  caption: string;
};

const ex = (m: number) => `${m} marks  →  AIR ~${fmtRank(estimateRank(m).normal)}`;

const PROMOS: Promo[] = [
  {
    key: "rank",
    tag: "FREE NEET TOOL",
    title: "What rank will your NEET marks get?",
    lines: [ex(650), ex(600), ex(550), ex(500)],
    cta: "Check your rank free",
    path: "/neet-rank-predictor",
    caption: "How many marks do you need for a government MBBS seat? 🩺 Enter your NEET marks and see your expected All India Rank, free:",
  },
  {
    key: "compare",
    tag: "FREE NEET TOOL",
    title: "Compare medical colleges side by side",
    lines: ["Closing rank: All India Quota", "Closing rank: your state quota", "Fees · Government or private", "MBBS & BDS · your category"],
    cta: "Compare colleges free",
    path: "/neet-compare-colleges",
    caption: "Which medical college is easier to get? 🏥 Compare up to 3 MBBS/BDS colleges with last year's closing ranks, free:",
  },
];

const W = 1080, H = 1920, PAD = 80;
const link = (p: Promo) => `https://www.yneet.in${p.path}?utm_source=whatsapp_status&utm_campaign=${p.key}`;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const out: string[] = [];
  let line = "";
  for (const w of text.split(/\s+/)) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
  }
  out.push(line);
  return out;
}

async function draw(c: HTMLCanvasElement, p: Promo, by: string) {
  const ctx = c.getContext("2d")!;
  c.width = W; c.height = H;
  const maxW = W - PAD * 2;
  ctx.fillStyle = "#14213D"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#F2A93B"; ctx.fillRect(0, 0, W, 16);
  ctx.textBaseline = "top";

  ctx.fillStyle = "#F2A93B"; ctx.font = "700 40px Inter, sans-serif";
  ctx.fillText(p.tag, PAD, 120);
  ctx.fillStyle = "#FBFAF7"; ctx.font = "700 84px 'Space Grotesk', Inter, sans-serif";
  let y = 190;
  for (const l of wrap(ctx, p.title, maxW)) { ctx.fillText(l, PAD, y); y += 100; }
  y += 50;

  ctx.font = "600 46px Inter, sans-serif";
  for (const l of p.lines) {
    ctx.fillStyle = "rgba(251,250,247,0.08)";
    ctx.beginPath(); ctx.roundRect(PAD, y, maxW, 110, 26); ctx.fill();
    ctx.fillStyle = "#FBFAF7"; ctx.fillText(l, PAD + 40, y + 30);
    y += 134;
  }

  // CTA + QR
  const cy = Math.max(y + 40, H - 760);
  ctx.fillStyle = "#F2A93B"; ctx.beginPath(); ctx.roundRect(PAD, cy, maxW, 360, 36); ctx.fill();
  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, link(p), { width: 280, margin: 1, color: { dark: "#14213D", light: "#F2A93B" } });
  ctx.drawImage(qr, W - PAD - 40 - 280, cy + 40, 280, 280);
  ctx.fillStyle = "#14213D"; ctx.font = "700 54px Inter, sans-serif";
  wrap(ctx, `${p.cta} 👇`, maxW - 380).forEach((l, i) => ctx.fillText(l, PAD + 40, cy + 50 + i * 66));
  let fs = 36;
  do { ctx.font = `600 ${fs}px Inter, sans-serif`; fs -= 2; } while (fs > 22 && ctx.measureText(`yneet.in${p.path}`).width > maxW - 400);
  ctx.fillText(`yneet.in${p.path}`, PAD + 40, cy + 250);
  ctx.font = "500 30px Inter, sans-serif";
  ctx.fillText("No login · Free", PAD + 40, cy + 300);

  if (by) {
    ctx.fillStyle = "rgba(251,250,247,0.75)"; ctx.font = "500 34px Inter, sans-serif";
    ctx.fillText("Shared by", PAD, H - 290);
    ctx.fillStyle = "#FBFAF7"; ctx.font = "700 48px 'Space Grotesk', Inter, sans-serif";
    ctx.fillText(wrap(ctx, by, maxW)[0], PAD, H - 240);
  }
  const days = daysToNeet();
  ctx.fillStyle = "rgba(251,250,247,0.6)"; ctx.font = "500 32px Inter, sans-serif";
  ctx.fillText(days > 0 ? `${days} days to NEET ${NEET_YEAR} · YNeet` : "YNeet · NEET preparation", PAD, H - 120);
}

function PromoCard({ p, by }: { p: Promo; by: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const caption = `${p.caption} ${link(p)}`;

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    let alive = true;
    (document.fonts?.ready || Promise.resolve()).then(() => draw(c, p, by)).then(() => {
      c.toBlob((b) => {
        if (!b || !alive) return;
        const f = new File([b], `yneet-${p.key}.png`, { type: "image/png" });
        setFile(f); setUrl(URL.createObjectURL(f));
      }, "image/png");
    });
    return () => { alive = false; };
  }, [p, by]);

  const track = (event: string) => { try { (window as any).gtag?.("event", event, { promo: p.key, by: by || "yneet" }); } catch { /* analytics only */ } };
  const canShare = !!file && typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [file] });
  const share = async () => {
    if (!file) return;
    track("promo_status_share");
    try { await navigator.share({ files: [file], text: caption }); } catch { /* cancelled */ }
  };

  return (
    <div className="rounded-2xl border border-ink/10 dark:border-paper/15 p-4">
      <canvas ref={canvas} className="w-full rounded-xl shadow" style={{ aspectRatio: "9 / 16" }} />
      <div className="mt-4 grid gap-2">
        {canShare && <button onClick={share} className="bg-gold text-ink font-bold px-5 py-3 rounded-full">Share to WhatsApp status</button>}
        {url && <a href={url} download={file?.name} onClick={() => track("promo_status_download")} className="text-center border border-ink/20 dark:border-paper/25 font-semibold px-5 py-3 rounded-full">Download image</a>}
        <button onClick={async () => { try { await navigator.clipboard.writeText(caption); setCopied(true); } catch { /* blocked */ } }} className="border border-ink/20 dark:border-paper/25 font-semibold px-5 py-3 rounded-full">{copied ? "Caption copied ✓" : "Copy caption with link"}</button>
      </div>
      <p className="mt-3 text-xs text-ink/60 dark:text-paper/60 whitespace-pre-line">{caption}</p>
    </div>
  );
}

export default function NeetSharePromos() {
  const [by, setBy] = useState("");
  useEffect(() => {
    try { setBy((new URLSearchParams(window.location.search).get("by") || "").slice(0, 60)); } catch { /* ignore */ }
  }, []);
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl sm:text-3xl font-bold">Share YNeet's free NEET tools</h1>
      <p className="text-sm text-ink/70 dark:text-paper/70 mt-2">Ready-made images for your WhatsApp status or Instagram story. On a phone: tap Share → WhatsApp → My status, and paste the caption so students can tap the link. The QR code on the image works too.</p>
      <label className="block mt-4 text-sm font-semibold max-w-sm">Show "Shared by" (optional)
        <input value={by} onChange={(e) => setBy(e.target.value.slice(0, 60))} placeholder="e.g. your institute's name" className="cp-in" />
      </label>
      <div className="mt-6 grid sm:grid-cols-2 gap-6">
        {PROMOS.map((p) => <PromoCard key={p.key} p={p} by={by.trim()} />)}
      </div>
    </div>
  );
}
