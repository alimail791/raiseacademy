import WidgetPartner from "../models/WidgetPartner.js";

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
    const website = clean(req.body.website, 120);

    if (name.length < 3) return res.status(400).json({ message: "Enter your institute's name" });
    if (!/^[6-9]\d{9}$/.test(phone)) return res.status(400).json({ message: "Enter a 10-digit WhatsApp number" });

    // Same number + same name again → give back the page they already made.
    const existing = await WidgetPartner.findOne({ phone, name });
    if (existing) return res.json({ slug: existing.slug, name: existing.name });

    const base = slugify(city ? `${name} ${city}` : name) || "institute";
    let slug = base;
    for (let n = 2; await WidgetPartner.exists({ slug }); n++) slug = `${base}-${n}`;

    const p = await WidgetPartner.create({ name, slug, phone, city, kind, cutoffState, website });
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
      .select("name slug city kind cutoffState").lean();
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
