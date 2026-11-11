import mongoose from "mongoose";

// Daily NEET quiz Reels for Raise Academy's Instagram. The YNeet repo's shorts-bot
// uploads each day's videos here; utils/instagramReels.js posts each one at its time.
const instaReelSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true }, // "<date>|<subject>": one Reel per subject per day
    date: { type: String, default: "" },
    subject: { type: String, default: "" },
    chapter: { type: String, default: "" },
    caption: { type: String, default: "" },
    fileId: { type: mongoose.Schema.Types.ObjectId }, // GridFS bucket "reels"
    bytes: { type: Number, default: 0 },
    publishAt: { type: Date },
    status: { type: String, enum: ["pending", "posting", "posted", "failed", "skipped"], default: "pending" },
    containerId: { type: String, default: "" },
    mediaId: { type: String, default: "" },
    permalink: { type: String, default: "" },
    attempts: { type: Number, default: 0 },
    error: { type: String, default: "" },
    postedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("InstaReel", instaReelSchema);
