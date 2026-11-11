// NEET PYQ books store (/neet-pyq-books): 3 subject books (₹199 each, all three
// ₹499) and free chapter booklets. Students confirm their WhatsApp number with the
// College Predictor's OTP flow (token kept as cp_token); books are paid through
// Razorpay. PDFs are served by the Raise Academy API (controllers/booksController.js).
// Inside the Play Store app (app mode) only the free chapter booklets are shown:
// the app is "consumption only" (no prices, no purchases) under Google Play policy.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CheckCircle2, Download, Lock, Smartphone } from "lucide-react";
import api from "../api/axios";
import { payWithRazorpay, trackPurchase } from "../utils/razorpay";
import { isAppMode } from "../utils/appMode";

const TOKEN_KEY = "cp_token";
const ALERT = "pyq-booklets";
const SUBJECTS = ["physics", "chemistry", "biology"] as const;
const LABEL: Record<string, string> = { physics: "Physics", chemistry: "Chemistry", biology: "Biology" };

type Book = { file: string; subject: string; questions: number; chapters: number; bytes: number; edition: string };
type Booklet = { file: string; subject: string; chapter: string; slug: string; questions: number; bytes: number };
type Catalog = { books: Book[]; booklets: Booklet[]; price: { book: number; bundle: number } };

const mb = (b: number) => `${(b / 1024 / 1024).toFixed(1)} MB`;
const errMsg = (e: any, f: string) => e?.response?.data?.message || f;
const track = (event: string, params: Record<string, unknown> = {}) => { try { (window as any).gtag?.("event", event, params); } catch { /* analytics only */ } };
const downloadUrl = (file: string, token: string) => `${api.defaults.baseURL}/books/download/${encodeURIComponent(file)}?token=${encodeURIComponent(token)}`;

// WhatsApp number confirmation (same lead + OTP as the College Predictor).
function NumberBox({ onDone, reason }: { onDone: (token: string) => void; reason: string }) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const done = (t: string) => {
    try { localStorage.setItem(TOKEN_KEY, t); } catch { /* storage blocked */ }
    track("pyq_books_lead");
    try { (window as any).fbq?.("track", "Lead", { content_name: "NEET PYQ books" }); } catch { /* analytics only */ }
    onDone(t);
  };
  const send = async () => {
    setErr(""); setBusy(true);
    try {
      const utm = (`src=pyq-books&` + window.location.search.slice(1)).slice(0, 120);
      const r = await api.post("/predictor/otp/send", { phone, name, utm, alert: ALERT });
      if (r.data.verified && r.data.token) done(r.data.token); else setSent(true);
    } catch (e) { setErr(errMsg(e, "Couldn't send the code. Check the number.")); } finally { setBusy(false); }
  };
  const verify = async () => {
    setErr(""); setBusy(true);
    try { const r = await api.post("/predictor/otp/verify", { phone, code, alert: ALERT }); done(r.data.token); }
    catch (e) { setErr(errMsg(e, "Wrong code")); } finally { setBusy(false); }
  };
  return (
    <div id="number" className="rounded-2xl border border-gold/50 bg-gold/10 p-5 scroll-mt-24">
      <p className="font-display text-lg font-bold flex items-center gap-2"><Smartphone size={20} className="text-gold-dark" /> Confirm your WhatsApp number</p>
      <p className="text-sm text-ink/70 dark:text-paper/70 mt-1">{reason}</p>
      {!sent ? (
        <div className="mt-3 grid sm:grid-cols-[1fr_1fr_auto] gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="cp-in !mt-0" />
          <input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp number" className="cp-in !mt-0" />
          <button onClick={send} disabled={busy || phone.replace(/\D/g, "").length < 10} className="bg-ink text-paper font-semibold px-5 py-3 rounded-xl disabled:opacity-50">{busy ? "Sending..." : "Send code"}</button>
        </div>
      ) : (
        <div className="mt-3 grid sm:grid-cols-[1fr_auto] gap-2">
          <input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code from WhatsApp" className="cp-in !mt-0" />
          <button onClick={verify} disabled={busy || code.length < 6} className="bg-ink text-paper font-semibold px-5 py-3 rounded-xl disabled:opacity-50">{busy ? "Checking..." : "Confirm"}</button>
          <p className="text-xs text-ink/60 dark:text-paper/60 sm:col-span-2">Code sent on WhatsApp to {phone}. <button className="underline" onClick={() => { setSent(false); setCode(""); }}>Change number</button></p>
        </div>
      )}
      {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
    </div>
  );
}

const PyqBooks = () => {
  const [cat, setCat] = useState<Catalog | null | undefined>(undefined);
  const [token, setToken] = useState("");
  const [owned, setOwned] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [want, setWant] = useState<string[] | null>(null); // purchase waiting for a confirmed number
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [app, setApp] = useState(false);

  useEffect(() => {
    setApp(isAppMode());
    api.get("/books/catalog").then((r) => setCat(r.data)).catch(() => setCat(null));
    try { setToken(localStorage.getItem(TOKEN_KEY) || ""); } catch { /* storage blocked */ }
  }, []);
  useEffect(() => {
    if (!token) return;
    api.get("/books/me", { params: { token } })
      .then((r) => { setOwned(r.data.books || []); setPhone(r.data.phone || ""); })
      .catch(() => { setToken(""); try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } });
  }, [token]);

  const price = cat?.price || { book: 199, bundle: 499 };
  const books = SUBJECTS.map((s) => cat?.books.find((b) => b.subject === s)).filter(Boolean) as Book[];
  const totalQs = books.reduce((a, b) => a + b.questions, 0);

  const buy = async (items: string[], tok = token) => {
    if (!tok) { setWant(items); setMsg(""); setTimeout(() => document.getElementById("number")?.scrollIntoView({ behavior: "smooth" }), 50); return; }
    setMsg(""); setBusy(items.join(","));
    try {
      const o = await api.post("/books/order", { token: tok, items });
      if (o.data.owned) { setOwned(o.data.books); return; }
      const label = o.data.items.length === 3 ? "NEET PYQ books (all 3)" : `NEET ${o.data.items.map((s: string) => LABEL[s]).join(" + ")} PYQ book`;
      const p = await payWithRazorpay({ keyId: o.data.keyId, orderId: o.data.orderId, amount: o.data.amount, description: label, prefill: o.data.prefill });
      const v = await api.post("/books/verify", { token: tok, ...p });
      setOwned(v.data.books);
      trackPurchase(v.data.amount, label);
      setMsg("Payment done. Your books are ready to download below, and you can download them again any time with this WhatsApp number.");
    } catch (e: any) {
      if (e?.message !== "cancelled") setMsg(errMsg(e, e?.message || "Payment didn't go through. No money was taken; try again."));
    } finally { setBusy(""); }
  };
  const onConfirmed = (t: string) => { setToken(t); if (want) { const w = want; setWant(null); buy(w, t); } };
  const notOwned = SUBJECTS.filter((s) => !owned.includes(s));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm">PDF · {app ? "free" : "instant download"}</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2 leading-tight">{app ? "Free Chapter-wise NEET PYQ PDFs" : "NEET Chapter-wise PYQ Books with Solutions"}</h1>
      <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg max-w-3xl">
        {app
          ? "Every NEET previous year question of a chapter, with an answer key and a clear solution for each, as a PDF you can save or print."
          : `Every NEET previous year question${totalQs ? ` (${totalQs.toLocaleString("en-IN")} in all)` : ""}, chapter by chapter in NCERT order, with an answer key and a clear solution for each. Each chapter shows its NEET weightage and priority, so you know what to study first.`}
      </p>

      {cat === undefined && <p className="mt-10 text-ink/50">Loading…</p>}
      {cat === null && <p className="mt-10 text-ink/60">Couldn't load the books. Please refresh.</p>}
      {cat && !books.length && !app && <p className="mt-10 text-ink/60">The books are being prepared. Please check back soon.</p>}

      {books.length > 0 && !app && (
        <>
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {books.map((b) => {
              const has = owned.includes(b.subject);
              return (
                <div key={b.subject} className="rounded-2xl border border-ink/10 dark:border-paper/15 p-5 flex flex-col">
                  <BookOpen className="text-gold-dark" />
                  <h2 className="font-display text-xl font-bold mt-2">NEET {LABEL[b.subject]} PYQs</h2>
                  <p className="text-sm text-ink/65 dark:text-paper/65 mt-1">{b.chapters} chapter{b.chapters === 1 ? "" : "s"} · {b.questions.toLocaleString("en-IN")} questions · {mb(b.bytes)}</p>
                  <div className="mt-auto pt-4">
                    {has ? (
                      <a href={downloadUrl(b.file, token)} className="inline-flex items-center gap-2 bg-rise text-white font-semibold px-5 py-3 rounded-full"><Download size={16} /> Download</a>
                    ) : (
                      <button onClick={() => buy([b.subject])} disabled={!!busy} className="inline-flex items-center gap-2 bg-ink text-paper font-semibold px-5 py-3 rounded-full disabled:opacity-60">
                        {busy === b.subject ? "Opening payment…" : `Buy ₹${price.book}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {notOwned.length === 3 && (
            <div className="mt-4 rounded-2xl bg-ink text-paper p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-display text-xl font-bold">All 3 books: ₹{price.bundle} <span className="text-paper/60 line-through text-base font-normal ml-1">₹{price.book * 3}</span></p>
                <p className="text-sm text-paper/75 mt-1">Physics + Chemistry + Biology: every NEET PYQ with solutions. Save ₹{price.book * 3 - price.bundle}.</p>
              </div>
              <button onClick={() => buy([...SUBJECTS])} disabled={!!busy} className="bg-gold text-ink font-bold px-6 py-3 rounded-full hover:bg-gold-dark disabled:opacity-60">
                {busy === SUBJECTS.join(",") ? "Opening payment…" : `Get all 3 for ₹${price.bundle}`}
              </button>
            </div>
          )}
          {msg && <p className="mt-4 rounded-xl bg-rise/10 border border-rise/30 p-4 text-sm">{msg}</p>}
        </>
      )}

      <div className="mt-8">
        {token ? (
          <p className="text-sm text-ink/65 dark:text-paper/65 flex items-center gap-2"><CheckCircle2 size={16} className="text-rise" /> WhatsApp {phone} confirmed. {owned.length ? "Your books are unlocked above." : ""}</p>
        ) : (
          <NumberBox onDone={onConfirmed} reason={app ? "Needed for the free chapter PDFs below. We'll also send you NEET tips on WhatsApp now and then." : want ? "We'll send your books to this number's account so you can download them again any time. Then the payment window opens." : "Needed for the free chapter booklets below, and to download books you've bought. Already bought? Confirm the same number to download again."} />
        )}
      </div>

      {cat && cat.booklets.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold">Free chapter booklets</h2>
          <p className="text-ink/70 dark:text-paper/70 mt-1">Any chapter on its own, as a PDF: every NEET PYQ, the answer key and full solutions. Free with your WhatsApp number.{app ? "" : " It's also a good way to see what the full books are like."}</p>
          {SUBJECTS.map((s) => {
            const list = cat.booklets.filter((x) => x.subject === s);
            if (!list.length) return null;
            return (
              <div key={s} className="mt-6">
                <h3 className="font-semibold text-lg">{LABEL[s]}</h3>
                <ul className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                  {list.map((x) => (
                    <li key={x.file} className="flex items-center justify-between gap-3 border-b border-ink/5 dark:border-paper/10 py-1.5">
                      <span>{x.chapter} <span className="text-ink/50 dark:text-paper/50">· {x.questions} PYQs</span></span>
                      {token ? (
                        <a href={downloadUrl(x.file, token)} onClick={() => track("pyq_booklet_download", { chapter: x.chapter })} className="shrink-0 inline-flex items-center gap-1 text-rise-dark font-semibold"><Download size={14} /> PDF</a>
                      ) : (
                        <button onClick={() => document.getElementById("number")?.scrollIntoView({ behavior: "smooth" })} className="shrink-0 inline-flex items-center gap-1 text-ink/60 dark:text-paper/60"><Lock size={13} /> Free</button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      )}

      {!app && <section className="mt-12 space-y-3 text-ink/80 dark:text-paper/80 max-w-3xl">
        <h2 className="font-display text-2xl font-bold text-ink dark:text-paper">What's inside</h2>
        <p>Each chapter starts with its NEET weightage (questions and marks per paper) and priority, then every NEET previous year question from that chapter, newest year first, tagged with its year. Attempt them like a test, then use the answer key and the step-by-step solutions at the end of the chapter.</p>
        <p>The books are A4 PDFs that work on a phone, tablet or laptop, and print cleanly. A new edition comes out every month with any newly added questions. Download the latest one any time with the same WhatsApp number.</p>
        <p>Want to practise these as timed tests with instant analysis? Every chapter is also on <Link to="/neet-practice" className="text-rise-dark font-semibold underline">YNeet chapter-wise PYQs</Link>, and the full app is free for 30 days.</p>
        <p className="text-sm text-ink/55 dark:text-paper/55">Coaching centre? We make editions with your institute's name and logo on the cover. <Link to="/institutes" className="underline">Contact us</Link>.</p>
      </section>}
    </div>
  );
};

export default PyqBooks;
