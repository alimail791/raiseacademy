import WidgetPartner from "../models/WidgetPartner.js";
import WidgetSite from "../models/WidgetSite.js";
import crypto from "crypto";

// Free NEET tools pages for institutes: www.yneet.in/i/<slug>.
// See models/WidgetPartner.js.

const KINDS = ["coaching", "school", "teacher", "other"];
const clean = (s, max) => String(s || "").replace(/[<>"`\\]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
const slugify = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);

// POST /api/widgets/partners  { name, phone, city, kind, cutoffState, website }
export const createPartner = async (req, res, next) => {
  try {
    const name = clean(req.body.name, 60);
    const phone = String(req.body.phone || "").replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
    const city = clean(req.body.city, 40);
    const kind = KINDS.includes(req.body.kind) ? req.body.kind : "coaching";
    const cutoffState = /^[a-z-]{2,30}$/.test(req.body.cutoffState || "") ? req.body.cutoffState : "all-india-quota";
    const website = clean(req.body.website, 120).replace(/^(?!https?:\/\/)(?=\S)/, "https://");
    const listed = req.body.listed !== false;

    if (name.length < 3) return res.status(400).json({ message: "Enter your institute's name" });
    if (!/^[6-9]\d{9}$/.test(phone)) return res.status(400).json({ message: "Enter a 10-digit WhatsApp number" });

    // Same number + same name again → give back the page they already made.
    const existing = await WidgetPartner.findOne({ phone, name });
    if (existing) {
      // Same institute again: update the details they may have changed.
      Object.assign(existing, { city, citySlug: slugify(city), kind, cutoffState, listed, ...(website && { website }) });
      await existing.save();
      return res.json({ slug: existing.slug, name: existing.name });
    }

    const base = slugify(city ? `${name} ${city}` : name) || "institute";
    let slug = base;
    for (let n = 2; await WidgetPartner.exists({ slug }); n++) slug = `${base}-${n}`;

    const p = await WidgetPartner.create({ name, slug, phone, city, citySlug: slugify(city), kind, cutoffState, website, listed });
    res.status(201).json({ slug: p.slug, name: p.name });
  } catch (err) {
    next(err);
  }
};

// GET /api/widgets/partners/:slug  — public: only what the page shows
export const getPartner = async (req, res, next) => {
  try {
    const slug = String(req.params.slug || "").toLowerCase();
    const p = await WidgetPartner.findOneAndUpdate({ slug, hidden: false }, { $inc: { views: 1 } }, { new: true })
      .select("name slug city citySlug kind cutoffState").lean();
    if (!p) return res.status(404).json({ message: "Page not found" });
    res.json({ partner: p });
  } catch (err) {
    next(err);
  }
};

// GET /api/widgets/admin/partners
export const adminListPartners = async (req, res, next) => {
  try {
    const partners = await WidgetPartner.find().sort({ createdAt: -1 }).limit(5000).lean();
    res.json({ partners });
  } catch (err) {
    next(err);
  }
};

// PUT /api/widgets/admin/partners/:id  { hidden }
export const adminUpdatePartner = async (req, res, next) => {
  try {
    const p = await WidgetPartner.findByIdAndUpdate(req.params.id, { hidden: !!req.body.hidden }, { new: true });
    if (!p) return res.status(404).json({ message: "Not found" });
    res.json({ partner: p });
  } catch (err) {
    next(err);
  }
};

// ---- Which websites show which widget ----------------------------------

const WIDGETS = ["qotd", "predictor", "cutoff", "weightage", "pyq", "countdown"];
// Our own sites, previews and local testing don't count.
const IGNORE = /(^|\.)(yneet\.in|raiseacademy\.in|localhost|127\.0\.0\.1|railway\.app|googleusercontent\.com|translate\.goog)$/;

// POST /api/widgets/ping  { widget, ref, by }  — sent by each box when it loads
export const ping = async (req, res) => {
  res.status(204).end(); // never make the widget wait
  try {
    const widget = String(req.body?.widget || "");
    if (!WIDGETS.includes(widget)) return;
    let u;
    try { u = new URL(String(req.body?.ref || "")); } catch { return; }
    if (!/^https?:$/.test(u.protocol)) return;
    const host = u.hostname.toLowerCase().replace(/^www\./, "").slice(0, 100);
    if (!host || !host.includes(".") || IGNORE.test(host)) return;
    const by = clean(req.body?.by, 60);
    await WidgetSite.updateOne(
      { host, widget },
      { $inc: { views: 1 }, $set: { lastSeen: new Date(), page: u.pathname.slice(0, 200), ...(by && { by }) }, $setOnInsert: { firstSeen: new Date() } },
      { upsert: true }
    );
  } catch { /* counting only */ }
};

// GET /api/widgets/admin/sites
export const adminSites = async (req, res, next) => {
  try {
    const sites = await WidgetSite.find().sort({ lastSeen: -1 }).limit(5000).lean();
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const perWidget = Object.fromEntries(WIDGETS.map((w) => {
      const list = sites.filter((s) => s.widget === w);
      return [w, { sites: list.length, active30d: list.filter((s) => new Date(s.lastSeen).getTime() > since).length, views: list.reduce((n, s) => n + s.views, 0) }];
    }));
    res.json({ totalSites: new Set(sites.map((s) => s.host)).size, perWidget, sites });
  } catch (err) {
    next(err);
  }
};

// ---- NEET coaching directory (www.yneet.in/neet-coaching[/<city>]) ----

const LISTED = { hidden: false, listed: true, citySlug: { $ne: "" }, kind: { $in: ["coaching", "school", "teacher"] } };

// GET /api/widgets/directory  → cities with how many institutes each
export const directoryCities = async (req, res, next) => {
  try {
    const rows = await WidgetPartner.aggregate([
      { $match: LISTED },
      { $group: { _id: "$citySlug", city: { $first: "$city" }, count: { $sum: 1 } } },
      { $sort: { count: -1, city: 1 } },
    ]);
    res.json({ cities: rows.map((r) => ({ slug: r._id, city: r.city, count: r.count })) });
  } catch (err) {
    next(err);
  }
};

// GET /api/widgets/directory/:city  → institutes in one city
export const directoryCity = async (req, res, next) => {
  try {
    const citySlug = slugify(String(req.params.city || ""));
    const list = await WidgetPartner.find({ ...LISTED, citySlug }).sort({ views: -1, createdAt: 1 })
      .select("name slug city kind website").lean();
    if (!list.length) return res.status(404).json({ message: "No institutes listed in this city yet" });
    res.json({ city: list[0].city, slug: citySlug, institutes: list.map(({ _id, ...x }) => x) });
  } catch (err) {
    next(err);
  }
};

// ---- ClassCoach tutors in the directory (server-to-server) ----
// A classcoach.in tutor who ticks "I teach NEET" on their directory listing is
// also listed here, linking to their ClassCoach profile. Guarded by
// X-Internal-Key = INTERNAL_SERVICE_KEY.
const internalOk = (req) => {
  const want = process.env.INTERNAL_SERVICE_KEY || "";
  const got = String(req.headers["x-internal-key"] || "");
  return !!want && got.length === want.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want));
};

// POST /api/widgets/internal/classcoach-listing
//   { classcoachId, name, phone, city, kind: coaching|teacher, listed, profileUrl }
export const classcoachListing = async (req, res, next) => {
  try {
    if (!internalOk(req)) return res.status(401).json({ message: "Unauthorized" });
    const classcoachId = parseInt(req.body.classcoachId, 10);
    if (!(classcoachId > 0)) return res.status(400).json({ message: "classcoachId required" });
    const listed = req.body.listed === true;
    const existing = await WidgetPartner.findOne({ classcoachId });
    if (!listed) {
      if (existing) { existing.listed = false; await existing.save(); }
      return res.json({ slug: existing?.slug || "", listed: false });
    }
    const name = clean(req.body.name, 60);
    const phone = String(req.body.phone || "").replace(/\D/g, "").slice(-10);
    const city = clean(req.body.city, 40);
    const kind = req.body.kind === "coaching" ? "coaching" : "teacher";
    const profileUrl = /^https:\/\/[\w.-]*classcoach\.in\//.test(req.body.profileUrl || "") ? clean(req.body.profileUrl, 120) : "";
    if (name.length < 3 || !city) return res.status(400).json({ message: "Name and city required" });
    if (!/^[6-9]\d{9}$/.test(phone)) return res.status(400).json({ message: "A 10-digit WhatsApp number is required" });

    const fields = { name, phone, city, citySlug: slugify(city), kind, listed: true, website: profileUrl };
    if (existing) {
      Object.assign(existing, fields);
      await existing.save();
      return res.json({ slug: existing.slug, listed: true });
    }
    const base = slugify(`${name} ${city}`) || "tutor";
    let slug = base;
    for (let n = 2; await WidgetPartner.exists({ slug }); n++) slug = `${base}-${n}`;
    const p = await WidgetPartner.create({ ...fields, slug, classcoachId });
    res.status(201).json({ slug: p.slug, listed: true });
  } catch (err) {
    next(err);
  }
};
