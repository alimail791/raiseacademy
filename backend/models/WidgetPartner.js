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
  },
  { timestamps: true }
);

export default mongoose.model("WidgetPartner", widgetPartnerSchema);
