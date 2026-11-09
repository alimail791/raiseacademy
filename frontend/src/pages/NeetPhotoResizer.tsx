import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Download, ImagePlus, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import RegistrationAlert from "../components/RegistrationAlert";

// Free NEET photo / signature resizer. Everything runs in the visitor's browser
// (canvas) — the image never leaves their phone. Specs follow the NEET UG 2026
// information bulletin; update SPECS + LAST_CHECKED when the 2027 bulletin is out.
const LAST_CHECKED = "9 November 2026";

type Spec = {
  id: string;
  label: string;
  w: number; // output px
  h: number; // output px (0 = keep cropped aspect, long side = w)
  minKB: number;
  maxKB: number;
  // byte target the compressor aims between (inside the official range, with margin)
  aim: [number, number];
  clean: boolean; // "clean paper background" on by default
  caption: boolean; // name + date strip (postcard photo)
  rules: string[];
};

const SPECS: Spec[] = [
  {
    id: "passport", label: "Passport-size photo", w: 413, h: 531, minKB: 10, maxKB: 200, aim: [30, 180], clean: false, caption: false,
    rules: ["Recent colour photo, white background", "Face covers about 80% of the photo, both ears visible", "No cap or dark glasses; spectacles only if you wear them daily", "JPG, 10 KB to 200 KB"],
  },
  {
    id: "postcard", label: "Postcard photo (4\"×6\")", w: 800, h: 1200, minKB: 10, maxKB: 200, aim: [40, 180], clean: false, caption: true,
    rules: ["Same photo as your passport photo, at 4×6 inch size", "White background, face clearly visible", "Your name and the date the photo was taken printed at the bottom", "JPG, 10 KB to 200 KB"],
  },
  {
    id: "signature", label: "Signature", w: 500, h: 200, minKB: 4, maxKB: 30, aim: [10, 28], clean: true, caption: false,
    rules: ["Sign with a black pen on plain white paper", "Running handwriting — not in CAPITAL letters", "Crop close to the signature", "JPG, under 30 KB"],
  },
  {
    id: "thumb", label: "Finger & thumb impressions", w: 1000, h: 0, minKB: 10, maxKB: 200, aim: [30, 180], clean: true, caption: false,
    rules: ["Blue ink on plain white paper", "Left-hand and right-hand impressions as the form asks (one image each)", "Clear, not smudged", "JPG, 10 KB to 200 KB"],
  },
];

const FAQS = [
  ["What is the photo size for NEET?", "In NEET 2026 the passport photo and the postcard (4×6 inch) photo each had to be a JPG between 10 KB and 200 KB, with a white background and the face covering about 80% of the photo. Check the NEET 2027 information bulletin when it's released."],
  ["What is the NEET signature size?", "The signature must be a JPG, signed in running handwriting with a black pen on white paper. Our tool keeps it between 10 and 28 KB, which fits the limit used in recent NEET forms."],
  ["Is my photo uploaded anywhere?", "No. The resizing happens inside your own browser. Your photo never reaches our server."],
  ["Can I use a phone photo?", "Yes. Stand against a plain white wall in daylight, hold the phone at face level, and use this tool to crop and resize. For the signature, sign on white paper and photograph it from straight above."],
  ["My photo won't open — why?", "iPhone HEIC photos may not open in some browsers. Change the camera setting to 'Most Compatible' (JPG) or take a screenshot of the photo and use that."],
];

// ---------- image helpers ----------
const canvasToBlob = (c: HTMLCanvasElement, q: number) =>
  new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", q));

function scaled(src: HTMLCanvasElement, f: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(src.width * f));
  c.height = Math.max(1, Math.round(src.height * f));
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

// Find a JPEG inside [aimMin, aimMax] KB: binary-search quality, resize if quality alone can't get there.
async function encodeInRange(src: HTMLCanvasElement, aimMin: number, aimMax: number) {
  let canvas = src;
  for (let round = 0; round < 6; round++) {
    let lo = 0.35, hi = 0.95, best: Blob | null = null;
    const top = await canvasToBlob(canvas, hi);
    if (top.size / 1024 < aimMin) { canvas = scaled(canvas, 1.3); continue; } // too small even at best quality — enlarge
    const bottom = await canvasToBlob(canvas, lo);
    if (bottom.size / 1024 > aimMax) { canvas = scaled(canvas, 0.8); continue; } // too big even at low quality — shrink
    for (let i = 0; i < 8; i++) {
      const q = (lo + hi) / 2;
      const b = await canvasToBlob(canvas, q);
      if (b.size / 1024 > aimMax) hi = q; else { best = b; lo = q; }
    }
    best ||= bottom;
    return { blob: best, w: canvas.width, h: canvas.height };
  }
  const blob = await canvasToBlob(canvas, 0.8);
  return { blob, w: canvas.width, h: canvas.height };
}

// White paper → pure white, ink kept dark. For signatures and impressions.
function cleanPaper(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  // Paper brightness = 90th percentile of luminance.
  const hist = new Array(256).fill(0);
  for (let i = 0; i < d.length; i += 4) hist[Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2])]++;
  let acc = 0, paper = 255;
  const target = (d.length / 4) * 0.1;
  for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= target) { paper = v; break; } }
  const cut = paper * 0.82;
  for (let i = 0; i < d.length; i += 4) {
    const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    if (l >= cut) { d[i] = d[i + 1] = d[i + 2] = 255; continue; }
    const k = Math.max(0, l / cut); // 0 = ink, →1 = near paper
    const f = 0.55 * k; // darken ink, keep its colour (black or blue)
    d[i] = d[i] * f; d[i + 1] = d[i + 1] * f; d[i + 2] = d[i + 2] * f + (d[i + 2] > d[i] + 20 ? 60 * (1 - k) : 0);
  }
  ctx.putImageData(img, 0, 0);
}

const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};

const track = (event: string, params: Record<string, unknown> = {}) => {
  try { (window as any).gtag?.("event", event, params); } catch { /* analytics only */ }
};

export default function NeetPhotoResizer() {
  const [specId, setSpecId] = useState("passport");
  const spec = SPECS.find((s) => s.id === specId)!;
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [bright, setBright] = useState(0);
  const [clean, setClean] = useState(spec.clean);
  const [name, setName] = useState("");
  const [date, setDate] = useState(today());
  const [result, setResult] = useState<{ url: string; kb: number; w: number; h: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setClean(spec.clean); setZoom(1); setOff({ x: 0, y: 0 }); setResult(null); }, [specId]);

  // Output size for this spec (free-aspect specs keep the photo's shape).
  const outSize = () => {
    if (spec.h) return { w: spec.w, h: spec.h };
    if (!img) return { w: spec.w, h: Math.round(spec.w * 0.7) };
    const r = img.naturalHeight / img.naturalWidth;
    return r > 1 ? { w: Math.round(spec.w / r), h: spec.w } : { w: spec.w, h: Math.round(spec.w * r) };
  };

  // How far the photo can move each way before an edge shows inside the frame.
  const limits = (z = zoom) => {
    if (!img) return { mx: 0, my: 0 };
    const { w, h } = outSize();
    const areaH = h - (spec.caption ? Math.round(h * 0.11) : 0);
    const cover = Math.max(w / img.naturalWidth, areaH / img.naturalHeight) * z;
    return { mx: Math.max(0, (img.naturalWidth * cover - w) / 2), my: Math.max(0, (img.naturalHeight * cover - areaH) / 2) };
  };
  const clampOff = (o: { x: number; y: number }, z = zoom) => {
    const { mx, my } = limits(z);
    return { x: Math.max(-mx, Math.min(mx, o.x)), y: Math.max(-my, Math.min(my, o.y)) };
  };

  // Draw the final image (crop/zoom/brightness/clean/caption) at full output size.
  const render = (target: HTMLCanvasElement) => {
    const { w, h } = outSize();
    target.width = w; target.height = h;
    const ctx = target.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    if (!img) return;
    const capH = spec.caption ? Math.round(h * 0.11) : 0;
    const areaH = h - capH;
    const cover = Math.max(w / img.naturalWidth, areaH / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * cover, dh = img.naturalHeight * cover;
    const x = Math.min(0, Math.max(w - dw, (w - dw) / 2 + off.x));
    const y = Math.min(0, Math.max(areaH - dh, (areaH - dh) / 2 + off.y));
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, w, areaH); ctx.clip();
    ctx.filter = bright ? `brightness(${100 + bright}%)` : "none";
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, x, y, dw, dh);
    ctx.restore();
    if (clean) cleanPaper(ctx, w, areaH);
    if (capH) {
      ctx.fillStyle = "#fff"; ctx.fillRect(0, areaH, w, capH);
      ctx.fillStyle = "#000"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = `bold ${Math.round(capH * 0.36)}px Arial, sans-serif`;
      ctx.fillText((name || "YOUR NAME").toUpperCase().slice(0, 32), w / 2, areaH + capH * 0.34);
      ctx.font = `${Math.round(capH * 0.28)}px Arial, sans-serif`;
      ctx.fillText(`Date: ${date}`, w / 2, areaH + capH * 0.74);
    }
  };

  useEffect(() => { if (preview.current) render(preview.current); setResult(null); }, [img, zoom, off, bright, clean, name, date, specId]);

  const onFile = (f?: File) => {
    if (!f) return;
    setLoadErr("");
    const url = URL.createObjectURL(f);
    const im = new Image();
    im.onload = () => { setImg(im); setZoom(1); setOff({ x: 0, y: 0 }); track("photo_resizer_upload", { type: specId }); };
    im.onerror = () => setLoadErr("Couldn't open this image. If it's an iPhone HEIC photo, take a screenshot of it and upload that, or use a JPG/PNG.");
    im.src = url;
  };

  // Drag to move the photo inside the frame (preview px → output px).
  const onDown = (e: React.PointerEvent) => {
    if (!img) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current || !preview.current) return;
    const ratio = preview.current.width / preview.current.getBoundingClientRect().width;
    setOff(clampOff({ x: drag.current.ox + (e.clientX - drag.current.x) * ratio, y: drag.current.oy + (e.clientY - drag.current.y) * ratio }));
  };
  const onUp = () => { drag.current = null; };

  const make = async () => {
    if (!img) return;
    setBusy(true);
    try {
      const c = document.createElement("canvas");
      render(c);
      const { blob, w, h } = await encodeInRange(c, spec.aim[0], spec.aim[1]);
      if (result) URL.revokeObjectURL(result.url);
      setResult({ url: URL.createObjectURL(blob), kb: Math.round((blob.size / 1024) * 10) / 10, w, h });
      track("photo_resizer_done", { type: specId, kb: Math.round(blob.size / 1024) });
    } finally { setBusy(false); }
  };

  const { w: ow, h: oh } = outSize();
  const okSize = result && result.kb >= spec.minKB && result.kb <= spec.maxKB;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <p className="text-sm text-ink/55 dark:text-paper/55">Specs last checked: {LAST_CHECKED}</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight mt-2">NEET Photo & Signature Resizer</h1>
      <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg">Crop and resize your NEET passport photo, postcard photo, signature and thumb impressions to the right KB size, ready to upload. Free, no login.</p>
      <p className="mt-3 inline-flex items-center gap-2 text-sm text-rise-dark font-semibold"><ShieldCheck size={16} /> Your photo stays on your phone — nothing is uploaded to our server.</p>

      {/* Type picker */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SPECS.map((s) => (
          <button key={s.id} onClick={() => setSpecId(s.id)}
            className={`rounded-xl px-3 py-3 text-sm font-semibold border ${s.id === specId ? "bg-ink text-paper border-ink" : "border-ink/15 dark:border-paper/20"}`}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid md:grid-cols-2 gap-6">
        {/* Editor */}
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          {!img ? (
            <button onClick={() => fileRef.current?.click()} className="w-full aspect-[4/5] rounded-2xl border-2 border-dashed border-ink/20 dark:border-paper/25 flex flex-col items-center justify-center gap-3 text-ink/60 dark:text-paper/60">
              <ImagePlus size={40} />
              <span className="font-semibold">Choose or take a photo</span>
              <span className="text-xs">JPG or PNG from your phone or computer</span>
            </button>
          ) : (
            <>
              <div className="rounded-2xl bg-ink/[0.04] dark:bg-paper/5 p-3 flex justify-center">
                <canvas ref={preview} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
                  className="max-w-full max-h-[420px] border border-ink/20 touch-none cursor-move bg-white" style={{ aspectRatio: `${ow} / ${oh}` }} />
              </div>
              <p className="text-xs text-ink/55 dark:text-paper/55 mt-2 text-center">Drag the photo to position it. Use zoom to crop closer.</p>
              <label className="block mt-3 text-sm font-semibold">Zoom
                <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => { const z = +e.target.value; setZoom(z); setOff((o) => clampOff(o, z)); }} className="w-full" />
              </label>
              <label className="block mt-2 text-sm font-semibold">Brightness
                <input type="range" min={-30} max={40} step={1} value={bright} onChange={(e) => setBright(+e.target.value)} className="w-full" />
              </label>
              <label className="flex items-center gap-2 mt-2 text-sm">
                <input type="checkbox" checked={clean} onChange={(e) => setClean(e.target.checked)} />
                Make the paper background pure white {spec.clean ? "(recommended)" : "(for signatures/impressions)"}
              </label>
              {spec.caption && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <label className="text-sm font-semibold">Name on photo<input className="cp-in" value={name} onChange={(e) => setName(e.target.value)} placeholder="As in your form" /></label>
                  <label className="text-sm font-semibold">Date photo taken<input className="cp-in" value={date} onChange={(e) => setDate(e.target.value)} /></label>
                </div>
              )}
              <div className="flex gap-2 mt-4 flex-wrap">
                <button onClick={make} disabled={busy} className="bg-gold text-ink font-semibold px-6 py-3 rounded-full disabled:opacity-60">
                  {busy ? "Resizing..." : "Resize for NEET"}
                </button>
                <button onClick={() => fileRef.current?.click()} className="border border-ink/20 dark:border-paper/25 font-semibold px-5 py-3 rounded-full">Change photo</button>
              </div>
            </>
          )}
          {loadErr && <p className="text-sm text-red-600 mt-3">{loadErr}</p>}
        </div>

        {/* Rules + result */}
        <div>
          <div className="rounded-2xl border border-ink/10 dark:border-paper/15 p-5">
            <p className="font-display text-lg font-bold">{spec.label}: NEET rules</p>
            <ul className="mt-3 space-y-2 text-sm">
              {spec.rules.map((r) => <li key={r} className="flex gap-2"><CheckCircle2 size={16} className="text-rise shrink-0 mt-0.5" />{r}</li>)}
            </ul>
          </div>

          {result && (
            <div className="mt-4 rounded-2xl border border-rise/40 bg-rise/10 p-5">
              <p className="font-display text-lg font-bold">Ready to upload</p>
              <ul className="mt-2 text-sm space-y-1">
                <li className="flex gap-2">{okSize ? <CheckCircle2 size={16} className="text-rise mt-0.5" /> : <AlertTriangle size={16} className="text-red-600 mt-0.5" />}
                  Size: <b>{result.kb} KB</b> (allowed {spec.minKB}–{spec.maxKB} KB)</li>
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-rise mt-0.5" /> Format: <b>JPG</b></li>
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-rise mt-0.5" /> {result.w} × {result.h} px</li>
              </ul>
              <img src={result.url} alt="Resized result" className="mt-3 max-h-56 border border-ink/20 bg-white mx-auto" />
              <a href={result.url} download={`neet_${spec.id}.jpg`} onClick={() => track("photo_resizer_download", { type: specId })}
                className="mt-4 inline-flex items-center gap-2 bg-ink text-paper font-semibold px-6 py-3 rounded-full">
                <Download size={16} /> Download JPG
              </a>
              <p className="text-xs text-ink/60 dark:text-paper/60 mt-3">Always check the image looks clear before uploading it to the NEET form.</p>
            </div>
          )}
        </div>
      </div>

      {result && <div className="mt-8"><RegistrationAlert source="photo-resizer" /></div>}

      <div className="my-10 rounded-2xl bg-rise-line text-paper p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display text-xl font-bold">Filling the NEET form?</p>
          <p className="text-paper/80 text-sm mt-1">Step-by-step registration guide, document checklist and eligibility check.</p>
        </div>
        <Link to="/neet-registration" className="inline-flex items-center gap-2 bg-gold text-ink font-semibold px-5 py-3 rounded-full">Open the guide <ArrowRight size={16} /></Link>
      </div>

      {!result && <RegistrationAlert source="photo-resizer" compact />}

      <h2 className="font-display text-2xl font-bold mt-10">Frequently asked questions</h2>
      <div className="mt-4 space-y-3">
        {FAQS.map(([q, a]) => (
          <details key={q} className="rounded-2xl border border-ink/10 dark:border-paper/15 p-4">
            <summary className="cursor-pointer font-semibold">{q}</summary>
            <p className="mt-2 text-ink/75 dark:text-paper/75">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
