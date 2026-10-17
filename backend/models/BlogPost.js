import mongoose from "mongoose";

// Blog posts shown at www.yneet.in/blog, written in the admin dashboard.
const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, index: true },
    metaDescription: { type: String, default: "", maxlength: 300 },
    coverImageUrl: { type: String, default: "" },
    bodyHtml: { type: String, default: "" },
    status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("BlogPost", blogPostSchema);
