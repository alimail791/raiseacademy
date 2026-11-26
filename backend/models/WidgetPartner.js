import mongoose from "mongoose";

// A coaching centre, school or teacher that asked for its own free NEET tools
// page (www.yneet.in/i/<slug>) from the widgets page. Mostly institutes without
// a website: they share the link on WhatsApp, Instagram and Google Business.
// The WhatsApp number is the lead for YNeet institute plans.
const widgetPartnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    phone: { type: String, required: true, index: true }, // 10 digits
    city: { type: String, trim: true, default: "" },
    kind: { type: String, enum: ["coaching", "school", "teacher", "other"], default: "coaching" },
    cutoffState: { type: String, default: "all-india-quota" }, // slug of the cutoff box shown on their page
    website: { type: String, trim: true, default: "" },
    views: { type: Number, default: 0 },
    hidden: { type: Boolean, default: false }, // admin can take a page down
    citySlug: { type: String, default: "", index: true }, // "salem" — for the directory (www.yneet.in/neet-coaching/<city>)
    listed: { type: Boolean, default: true },
    classcoachId: { type: Number, index: true, sparse: true }, // tutor listed from classcoach.in (website = their ClassCoach profile) // show in the NEET coaching directory (they can untick it on the form)

    // Weekly "your tools were opened N times" WhatsApp: totals at the last report,
    // so the next one can say how many opens happened that week.
    reportViews: { type: Number, default: 0 },
    reportLoads: { type: Number, default: 0 },
    lastReportAt: { type: Date },
    dailyOptOut: { type: Boolean, default: false }, // stop the daily status-image reminder
  },
  { timestamps: true }
);

export default mongoose.model("WidgetPartner", widgetPartnerSchema);
