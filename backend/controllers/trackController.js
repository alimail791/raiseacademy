// Admin → "Traffic & signups": first-party visitor and sign-up funnel for
// www.yneet.in. The browser reports a new visitor once (POST /api/track/visit)
// and a sign-up form being opened once a day (POST /api/track/event); sign-up
// starts and completions are recorded by the auth controller (utils/traffic.js).
import Student from "../models/Student.js";
import { SiteVisit, SiteEvent, SignupAttempt } from "../models/Traffic.js";
import { signupInfo, relabelChannel } from "../utils/signupSource.js";
import { BOT_UA, deviceOf, vidOf } from "../utils/traffic.js";

const istDay = (d = new Date()) => new Date(d.getTime() + 330 * 60000).toISOString().slice(0, 10);
const isBot = (req) => { const ua = req.get("user-agent") || ""; return !ua || BOT_UA.test(ua); };
const dupe = (e) => e?.code === 11000;

// POST /api/track/visit { vid, landing, referrer, utmSource, utmMedium, utmCampaign, inApp, app }
export const visit = async (req, res) => {
  res.status(204).end();
  try {
    const vid = vidOf(req.body);
    if (!vid || isBot(req)) return;
    const info = signupInfo(req.body, "");
    await SiteVisit.create({ vid, channel: info.channel, landing: info.landing, referrer: info.referrer, device: deviceOf(req.get("user-agent")) });
  } catch (e) { if (!dupe(e)) console.warn("track visit:", e.message); }
};

// POST /api/track/event { vid, event: "signup_view", place, ...first touch }
export const event = async (req, res) => {
  res.status(204).end();
  try {
    const vid = vidOf(req.body);
    const name = String(req.body?.event || "");
    if (!vid || isBot(req) || !["signup_view"].includes(name)) return;
    // Same channel as their visit row, so the columns line up per source.
    const v = await SiteVisit.findOne({ vid }).select("channel").lean();
    const channel = v?.channel || signupInfo(req.body, "").channel;
    await SiteEvent.create({ vid, event: name, day: istDay(), channel, place: String(req.body?.place || "").slice(0, 60) });
  } catch (e) { if (!dupe(e)) console.warn("track event:", e.message); }
};

// GET /api/track/report?days=30 (admin)
export const report = async (req, res, next) => {
  try {
    const days = [7, 30, 90].includes(+req.query.days) ? +req.query.days : 30;
    const since = new Date(Date.now() - days * 864e5);
    const IST = "Asia/Kolkata";
    const byChannel = (Model, match, extra = []) =>
      Model.aggregate([{ $match: match }, ...extra, { $group: { _id: "$channel", n: { $sum: 1 } } }]);

    const [visits, views, started, completed, paid, landings, devices, dailyV, dailyE, dailyS, dailyC, open, first] = await Promise.all([
      byChannel(SiteVisit, { createdAt: { $gte: since } }),
      // People (not page loads) who opened a sign-up form in the period.
      SiteEvent.aggregate([
        { $match: { event: "signup_view", createdAt: { $gte: since } } },
        { $group: { _id: "$vid", channel: { $first: "$channel" } } },
        { $group: { _id: "$channel", n: { $sum: 1 } } },
      ]),
      byChannel(SignupAttempt, { createdAt: { $gte: since } }),
      byChannel(SignupAttempt, { status: "completed", completedAt: { $gte: since } }),
      Student.aggregate([
        { $match: { createdAt: { $gte: since }, role: { $ne: "admin" }, yneetSubscribed: true, "signup.method": { $ne: "institute" } } },
        { $group: { _id: { $ifNull: ["$signup.channel", "Not recorded"] }, n: { $sum: 1 } } },
      ]),
      SiteVisit.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: "$landing", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 10 }]),
      SiteVisit.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: "$device", n: { $sum: 1 } } }]),
      // Day by day (India time), up to the last 30 days.
      ...[
        [SiteVisit, {}, "$createdAt"],
        [SiteEvent, { event: "signup_view" }, "$createdAt"],
        [SignupAttempt, {}, "$createdAt"],
        [SignupAttempt, { status: "completed" }, "$completedAt"],
      ].map(([M, m, f]) =>
        M.aggregate([
          { $match: { ...m, [f.slice(1)]: { $gte: new Date(Date.now() - Math.min(days, 30) * 864e5) } } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: f, timezone: IST } }, n: { $sum: 1 } } },
        ])
      ),
      SignupAttempt.find({ status: "started", createdAt: { $gte: since } }).sort({ updatedAt: -1 }).limit(80).lean(),
      SiteVisit.findOne().sort({ createdAt: 1 }).select("createdAt").lean(),
    ]);

    // One row per source.
    const rows = {};
    const row = (c) => {
      const name = relabelChannel(c || "Direct / unknown");
      return (rows[name] ||= { name, visitors: 0, signupViews: 0, started: 0, completed: 0, paid: 0 });
    };
    visits.forEach((r) => (row(r._id).visitors += r.n));
    views.forEach((r) => (row(r._id).signupViews += r.n));
    started.forEach((r) => (row(r._id).started += r.n));
    completed.forEach((r) => (row(r._id).completed += r.n));
    paid.forEach((r) => (row(r._id).paid += r.n));
    const sources = Object.values(rows).sort((a, b) => b.visitors - a.visitors || b.completed - a.completed);
    const totals = sources.reduce((t, s) => {
      for (const k of ["visitors", "signupViews", "started", "completed", "paid"]) t[k] += s[k];
      return t;
    }, { visitors: 0, signupViews: 0, started: 0, completed: 0, paid: 0 });

    const daily = [];
    const map = (a) => Object.fromEntries(a.map((r) => [r._id, r.n]));
    const [mv, me, ms, mc] = [dailyV, dailyE, dailyS, dailyC].map(map);
    for (let i = 0; i < Math.min(days, 30); i++) {
      const d = istDay(new Date(Date.now() - i * 864e5));
      daily.push({ day: d, visitors: mv[d] || 0, signupViews: me[d] || 0, started: ms[d] || 0, completed: mc[d] || 0 });
    }

    // Unfinished sign-ups, minus anyone who has an account by now (e.g. they
    // gave up on WhatsApp and used Google instead).
    const phones = open.map((a) => a.phone).filter(Boolean).flatMap((p) => [p, `91${p}`, `+91${p}`]);
    const emails = open.map((a) => a.email).filter(Boolean);
    const have = await Student.find({ $or: [{ phone: { $in: phones } }, { email: { $in: emails } }] }).select("phone email").lean();
    const hp = new Set(have.map((s) => String(s.phone || "").replace(/\D/g, "").slice(-10)));
    const he = new Set(have.map((s) => s.email));
    const incomplete = open
      .filter((a) => !(a.phone && hp.has(a.phone)) && !(a.email && he.has(a.email)))
      .slice(0, 50)
      .map((a) => ({ id: a._id, name: a.name, phone: a.phone, email: a.email, currentClass: a.currentClass, method: a.method, channel: relabelChannel(a.channel), place: a.place, tries: a.tries, at: a.updatedAt }));

    res.json({
      days,
      since: first?.createdAt || null,
      totals,
      sources,
      daily,
      landings: landings.map((r) => ({ page: r._id || "/", n: r.n })),
      devices: Object.fromEntries(devices.map((r) => [r._id || "unknown", r.n])),
      incomplete,
    });
  } catch (e) { next(e); }
};
