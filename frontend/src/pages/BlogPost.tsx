import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { SITE_ORIGIN } from "../seo";
import { useInitialBlogData, formatDate, readingMinutes, type BlogPostFull, type BlogSummary } from "../blog/blogData";
import NotFound from "./NotFound";

function setMeta(post: BlogPostFull) {
  const url = `${SITE_ORIGIN}/blog/${post.slug}`;
  const description = post.metaDescription || post.excerpt;
  document.title = `${post.title} | YNeet`;
  const set = (selector: string, attr: string, value: string, make: () => HTMLElement) => {
    let el = document.head.querySelector(selector) as HTMLElement | null;
    if (!el) { el = make(); document.head.appendChild(el); }
    el.setAttribute(attr, value);
  };
  const meta = (key: string, prop = false) => () => { const m = document.createElement("meta"); m.setAttribute(prop ? "property" : "name", key); return m; };
  set('meta[name="description"]', "content", description, meta("description"));
  set('meta[name="robots"]', "content", "index, follow", meta("robots"));
  set('meta[property="og:title"]', "content", post.title, meta("og:title", true));
  set('meta[property="og:description"]', "content", description, meta("og:description", true));
  set('meta[property="og:url"]', "content", url, meta("og:url", true));
  set('meta[name="twitter:title"]', "content", post.title, meta("twitter:title"));
  set('link[rel="canonical"]', "href", url, () => { const l = document.createElement("link"); l.setAttribute("rel", "canonical"); return l; });
}

const BlogPost = () => {
  const { slug = "" } = useParams();
  const initial = useInitialBlogData();
  const preloaded = initial.post && initial.post.slug === slug ? initial.post : null;
  const [post, setPost] = useState<BlogPostFull | null | undefined>(preloaded || undefined);
  const [related, setRelated] = useState<BlogSummary[]>((initial.posts || []).filter((p) => p.slug !== slug).slice(0, 3));

  useEffect(() => {
    let alive = true;
    api
      .get(`/blog/${encodeURIComponent(slug)}`)
      .then((res) => alive && setPost(res.data.post))
      .catch((err) => alive && err?.response?.status === 404 && setPost(null));
    api
      .get("/blog")
      .then((res) => alive && setRelated((res.data.posts || []).filter((p: BlogSummary) => p.slug !== slug).slice(0, 3)))
      .catch(() => {});
    return () => { alive = false; };
  }, [slug]);

  useEffect(() => {
    if (post) setMeta(post);
  }, [post]);

  if (post === null) return <NotFound />;
  if (post === undefined) return <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-ink/50">Loading article…</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Link to="/blog" className="text-sm font-semibold text-rise-dark">← All articles</Link>
      <article>
        <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight mt-4">{post.title}</h1>
        <p className="text-ink/50 dark:text-paper/50 text-sm mt-3 mb-8">
          {formatDate(post.publishedAt)} · {readingMinutes(post.bodyHtml)} min read
        </p>
        {post.coverImageUrl && <img src={post.coverImageUrl} alt="" className="w-full rounded-2xl mb-8" />}
        <div className="blog-content" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />
      </article>

      <div className="mt-12 p-7 rounded-2xl bg-ink text-paper">
        <h2 className="font-display text-2xl font-bold">Practise NEET the smart way</h2>
        <p className="text-paper/75 mt-2">Chapter-wise PYQ tests, full mock tests and WhatsApp doubt support for Class 11, 12 and droppers. Plans from ₹300 a month.</p>
        <Link to="/neet-trial" className="inline-block mt-5 bg-gold text-ink font-semibold px-6 py-3 rounded-full">
          Start the ₹99 trial
        </Link>
      </div>

      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-xl font-bold">More from the blog</h2>
          <ul className="mt-3 space-y-2">
            {related.map((r) => (
              <li key={r.slug}><Link to={`/blog/${r.slug}`} className="text-rise-dark font-semibold hover:underline">{r.title}</Link></li>
            ))}
          </ul>
        </div>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.metaDescription || post.excerpt,
            url: `${SITE_ORIGIN}/blog/${post.slug}`,
            mainEntityOfPage: `${SITE_ORIGIN}/blog/${post.slug}`,
            datePublished: post.publishedAt || undefined,
            dateModified: post.updatedAt || undefined,
            image: post.coverImageUrl || undefined,
            author: { "@type": "Organization", name: "YNeet", url: `${SITE_ORIGIN}/` },
            publisher: { "@type": "Organization", name: "YNeet", url: `${SITE_ORIGIN}/` },
          }).replace(/</g, "\\u003c"),
        }}
      />
    </div>
  );
};

export default BlogPost;
