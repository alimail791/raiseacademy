import mongoose from "mongoose";

// Daily NEET quiz Shorts on Raise Academy's YouTube channel, reported by the
// YNeet repo's shorts-bot when it uploads one. Shown on www.yneet.in only once
// YouTube says the video is public (see controllers/youtubeShortsController.js).
const youtubeShortSchema = new mongoose.Schema(
  {
    videoId: { type: String, required: true, unique: true },
    subject: { type: String, default: "" },
    chapter: { type: String, default: "" },
    title: { type: String, default: "" },
    questionSlug: { type: String, default: "" }, // www.yneet.in/neet-question/<slug>
    date: { type: String, default: "" }, // IST day the bot made it (YYYY-MM-DD)
    publishAt: { type: Date }, // scheduled public time (null = immediately)
    isPublic: { type: Boolean, default: false },
    thumbnail: { type: String, default: "" },
    checkedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("YoutubeShort", youtubeShortSchema);
