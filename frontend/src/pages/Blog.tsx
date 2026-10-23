import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useInitialBlogData, formatDate, type BlogSummary } from "../blog/blogData";

const Blog = () => {
  const initial = useInitialBlogData();
  const [posts, setPosts] = useState<BlogSummary[] | null>(initial.posts || null);

  useEffect(() => {
    api
      .get("/blog")
      .then((res) => setPosts(res.data.posts || []))
      .catch(() => setPosts((p) => p || []));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
      <h1 className="font-display text-4xl font-bold">YNeet Blog</h1>
      <p className="text-ink/60 dark:text-paper/60 mt-3 text-lg">
        NEET preparation guides: previous year questions, mock test strategy, cutoffs and study plans.
      </p>

      <div className="mt-10 space-y-5">
        {posts === null && <p className="text-ink/50">Loading articles…</p>}
        {posts !== null && posts.length === 0 && (
          <div className="p-6 rounded-2xl border border-ink/10">
            New articles are on the way. Meanwhile,{" "}
            <Link to="/neet-trial" className="text-rise-dark font-semibold underline">
              try YNeet free for 30 days
            </Link>
            .
          </div>
        )}
        {posts?.map((p) => (
          <Link
            key={p.slug}
            to={`/blog/${p.slug}`}
            className="flex flex-col sm:flex-row gap-5 p-6 rounded-2xl border border-ink/10 hover:border-gold transition-colors"
          >
            {p.coverImageUrl && (
              <img src={p.coverImageUrl} alt="" loading="lazy" className="w-full sm:w-40 h-40 sm:h-28 object-cover rounded-xl shrink-0" />
            )}
            <div className="min-w-0">
              <h2 className="font-display text-xl font-bold leading-snug">{p.title}</h2>
              <p className="text-ink/70 dark:text-paper/70 mt-2 leading-relaxed">{p.excerpt}</p>
              <p className="text-ink/45 dark:text-paper/45 text-sm mt-2">{formatDate(p.publishedAt)}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 p-7 rounded-2xl bg-ink text-paper">
        <h2 className="font-display text-2xl font-bold">Start your NEET preparation — free for 30 days</h2>
        <p className="text-paper/75 mt-2">Five days of full access to mock tests, chapter-wise PYQs, daily quizzes and WhatsApp doubt support.</p>
        <Link to="/neet-trial" className="inline-block mt-5 bg-gold text-ink font-semibold px-6 py-3 rounded-full">
          Start your free 30-day trial
        </Link>
      </div>
    </div>
  );
};

export default Blog;
