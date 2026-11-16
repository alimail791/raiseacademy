import mongoose from "mongoose";

// One row per (website, widget): a site that shows one of the free NEET
// widgets (www.yneet.in/embed/...) in an iframe. The box reports the host
// page's hostname (document.referrer) each time it loads.
const widgetSiteSchema = new mongoose.Schema(
  {
    host: { type: String, required: true }, // e.g. srividya.in (no www.)
    widget: { type: String, required: true, enum: ["qotd", "predictor", "cutoff", "weightage", "pyq", "countdown"] },
    page: { type: String, default: "" }, // last page URL seen (path only)
    by: { type: String, default: "" }, // "Shared by" name, if they set one
    views: { type: Number, default: 0 },
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: false }
);
widgetSiteSchema.index({ host: 1, widget: 1 }, { unique: true });

export default mongoose.model("WidgetSite", widgetSiteSchema);
