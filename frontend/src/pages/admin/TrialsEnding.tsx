// YNeet free trials ending in the next 7 days, with a one-tap WhatsApp
// message so Akbar can nudge each student to buy before access stops.
// Data: GET /api/content/trials-ending (backend proxies YNeet's trial records).

export type Trial = { userId: string; name: string; phone: string; currentClass?: string; endDate: string };

const PRICE: Record<string, string> = { "9": "₹299/month", "10": "₹299/month", "11": "₹399/month", "12": "₹399/month", Dropper: "₹499/month" };

const daysLeft = (d: string) => Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 864e5));
const ends = (d: string) => new Date(d).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" });

function waLink(t: Trial) {
  let p = (t.phone || "").replace(/\D/g, "");
  if (p.length === 10) p = "91" + p;
  if (p.length < 11) return "";
  const n = daysLeft(t.endDate);
  const first = (t.name || "").split(" ")[0] || "there";
  const price = PRICE[String(t.currentClass || "").replace(/\D/g, "") || String(t.currentClass || "")];
  const msg =
    `Hi ${first}, this is Akbar from YNeet. Your free 30-day YNeet trial ends ${n <= 1 ? "tomorrow" : `in ${n} days`} (${ends(t.endDate)}). ` +
    `To keep your mock tests, PYQs and progress going, you can continue${price ? ` from ${price}` : ""} at app.yneet.in. ` +
    `Any questions, just reply here.`;
  return `https://wa.me/${p}?text=${encodeURIComponent(msg)}`;
}

export default function TrialsEnding({ trials }: { trials: Trial[] | null | false }) {
  return (
    <section id="trials-ending" className="mt-10 scroll-mt-20">
      <h2 className="font-display text-xl font-bold">Trials ending this week</h2>
      <p className="text-sm text-ink/60 mt-1">Free YNeet trials that end in the next 7 days. Tap WhatsApp to send a ready reminder.</p>
      {trials === null && <p className="mt-4 text-sm text-ink/60">Loading…</p>}
      {trials === false && <p className="mt-4 text-sm text-red-600">Couldn't load trials from YNeet.</p>}
      {Array.isArray(trials) && trials.length === 0 && <p className="mt-4 text-sm text-ink/60">No trials end in the next 7 days.</p>}
      {Array.isArray(trials) && trials.length > 0 && (
        <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
          {trials.map((t) => {
            const link = waLink(t);
            const n = daysLeft(t.endDate);
            return (
              <li key={t.userId} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <b className="block truncate">{t.name}</b>
                  <span className="text-ink/60">{t.currentClass || "—"} · ends {ends(t.endDate)} ({n <= 1 ? "1 day" : `${n} days`})</span>
                </div>
                {link ? (
                  <a href={link} target="_blank" rel="noreferrer" className="shrink-0 px-3 py-1.5 rounded-full bg-green-600 text-white text-sm font-medium">WhatsApp</a>
                ) : (
                  <span className="shrink-0 text-ink/40 text-xs">No phone</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
