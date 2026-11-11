import mongoose from "mongoose";

// The Instagram access token, kept fresh: long-lived tokens last 60 days, so
// utils/instagramReels.js refreshes it weekly and stores the new one here.
// IG_ACCESS_TOKEN (Railway variable) is the starting token; changing it replaces this.
const igAuthSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "ig" },
    token: { type: String, default: "" },
    fromEnv: { type: String, default: "" }, // the IG_ACCESS_TOKEN this token descends from
    userId: { type: String, default: "" },
    username: { type: String, default: "" },
    refreshedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("IgAuth", igAuthSchema);
