// Blog data shared between the build-time prerender and the browser.
//
// At build time scripts/prerender.mjs fetches every published post and
// renders /blog and each /blog/<slug> with that data, so the HTML file
// already contains the article. It also writes the same data into the page
// as window.__BLOG_DATA__, so the app shows the article immediately instead
// of a loading state while it re-fetches.
import { createContext, useContext, type ReactNode } from "react";

export type BlogSummary = {
  id: string;
  slug: string;
  title: string;
  metaDescription: string;
  coverImageUrl: string;
  status: "draft" | "published";
  publishedAt: string | null;
  updatedAt: string;
  excerpt: string;
};
export type BlogPostFull = BlogSummary & { bodyHtml: string };
export type BlogData = { posts?: BlogSummary[]; post?: BlogPostFull | null };

const BlogDataContext = createContext<BlogData>({});

export function BlogDataProvider({ value, children }: { value?: BlogData; children: ReactNode }) {
  return <BlogDataContext.Provider value={value || {}}>{children}</BlogDataContext.Provider>;
}

export function useInitialBlogData(): BlogData {
  const ctx = useContext(BlogDataContext);
  if (ctx.posts || ctx.post) return ctx;
  if (typeof window !== "undefined") return (window as any).__BLOG_DATA__ || {};
  return {};
}

export const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "";

export const readingMinutes = (html: string) =>
  Math.max(1, Math.round(String(html || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length / 200));
