import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { formatDate, type BlogPostFull, type BlogSummary } from "../../blog/blogData";

const slugify = (t: string) =>
  t.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

type Draft = { title: string; slug: string; metaDescription: string; coverImageUrl: string; bodyHtml: string };
const EMPTY: Draft = { title: "", slug: "", metaDescription: "", coverImageUrl: "", bodyHtml: "" };
const errMsg = (e: any) => e?.response?.data?.message || "Something went wrong. Please try again.";

// Reads a ready-made article file: title, slug and description come from its
// "POST SETTINGS" comment (or its <h1>), the body from its <article>.
function parseArticleFile(text: string): Partial<Draft> {
  const doc = new DOMParser().parseFromString(text, "text/html");
  const settings: Record<string, string> = {};
  const block = text.match(/POST SETTINGS[\s\S]*?-->/);
  block?.[0].split("\n").forEach((line) => {
    const kv = line.match(/^\s*([A-Za-z ]+):\s*(.+?)\s*$/);
    if (kv) settings[kv[1].trim().toLowerCase()] = kv[2];
  });
  const root = doc.querySelector("article") || doc.body;
  const h1 = root.querySelector("h1");
  const heading = h1?.textContent?.trim() || "";
  h1?.remove();
  const title = settings["title"] || heading || doc.title;
  return { title, slug: settings["url slug"] || slugify(title), metaDescription: settings["meta description"] || "", bodyHtml: root.innerHTML.trim() };
}

function Editor({ post, onDone }: { post: BlogPostFull | null; onDone: () => void }) {
  const [d, setD] = useState<Draft>(post ? { title: post.title, slug: post.slug, metaDescription: post.metaDescription, coverImageUrl: post.coverImageUrl, bodyHtml: post.bodyHtml } : EMPTY);
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [htmlMode, setHtmlMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");
  const visual = useRef<HTMLDivElement>(null);
  const live = post?.status === "published";

  // The visual editor is uncontrolled: set its HTML only when the body is
  // replaced from outside (loading, importing, leaving HTML view).
  const loadBody = (html: string) => { if (visual.current) visual.current.innerHTML = html; };
  useEffect(() => { loadBody(d.bodyHtml); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof Draft, v: string) => setD((x) => ({ ...x, [k]: v }));
  const readBody = () => (htmlMode ? d.bodyHtml : visual.current?.innerHTML || "");

  const cmd = (name: string, arg?: string) => {
    if (htmlMode) return;
    visual.current?.focus();
    if (name === "createLink") {
      const url = window.prompt("Link address (starts with https://)", "https://");
      if (!url) return;
      document.execCommand("createLink", false, url);
    } else if (name === "insertCta") {
      const text = window.prompt("Button text", "Start the ₹99 trial");
      const href = text && window.prompt("Button link", "https://www.yneet.in/neet-trial");
      if (!text || !href) return;
      document.execCommand("insertHTML", false, `<div class="cta"><p><strong>Add a short line here.</strong></p><p><a href="${href.replace(/"/g, "&quot;")}">${text.replace(/</g, "&lt;")}</a></p></div><p></p>`);
    } else if (name === "insertImage") {
      const src = window.prompt("Image address (https://…)", "https://");
      if (!src) return;
      const alt = window.prompt("Describe the image in a few words", "") || "";
      document.execCommand("insertHTML", false, `<img src="${src.replace(/"/g, "&quot;")}" alt="${alt.replace(/"/g, "&quot;")}">`);
    } else {
      document.execCommand(name, false, arg);
    }
  };

  const toggleHtml = () => {
    if (!htmlMode) setD((x) => ({ ...x, bodyHtml: visual.current?.innerHTML || "" }));
    else setTimeout(() => loadBody(d.bodyHtml), 0);
    setHtmlMode(!htmlMode);
  };

  const onImport = (file?: File) => {
    if (!file) return;
    file.text().then((text) => {
      const p = parseArticleFile(text);
      setD((x) => ({ ...x, ...p, coverImageUrl: x.coverImageUrl }));
      setSlugTouched(true);
      if (htmlMode) setHtmlMode(false);
      setTimeout(() => loadBody(p.bodyHtml || ""), 0);
      toast.success("Article imported. Check it, then publish.");
    });
  };

  const save = async (status: "published" | "draft") => {
    const body = { ...d, slug: d.slug || slugify(d.title), bodyHtml: readBody(), status };
    setSaving(true);
    try {
      const res = post ? await api.put(`/blog/admin/posts/${post.id}`, body) : await api.post("/blog/admin/posts", body);
      const saved: BlogPostFull = res.data.post;
      toast.success(status === "published" ? `Published at yneet.in/blog/${saved.slug}` : live ? "Post unpublished" : "Draft saved");
      onDone();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!post || confirmDelete.trim().toLowerCase() !== "delete") return toast.error("Type delete in the box to confirm.");
    try { await api.delete(`/blog/admin/posts/${post.id}`); toast.success("Post deleted"); onDone(); } catch (e) { toast.error(errMsg(e)); }
  };

  const field = "w-full px-4 py-2.5 rounded-xl border border-ink/15 bg-white dark:bg-ink-light focus:outline-none focus:border-gold";
  const tool = "px-2.5 py-1.5 rounded-lg border border-ink/15 bg-white dark:bg-ink-light text-sm hover:border-gold";
  const metaLen = d.metaDescription.length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-display text-2xl font-bold">{post ? "Edit post" : "New post"}</h1>
        <button onClick={onDone} className="text-sm font-semibold text-ink/60 hover:text-ink">← All posts</button>
      </div>

      <div className="p-4 rounded-2xl border border-ink/10 flex items-center justify-between gap-3 flex-wrap">
        <span className="text-sm text-ink/70 dark:text-paper/70">Have a ready-made article file (.html)? Import it to fill everything in.</span>
        <label className={`${tool} cursor-pointer font-semibold`}>
          Import article file
          <input type="file" accept=".html,.htm,text/html" className="hidden" onChange={(e) => { onImport(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-semibold">Title</span>
        <input className={`${field} mt-1.5`} maxLength={200} value={d.title}
          onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }}
          placeholder="e.g. NEET PYQ Chapter-wise: How to Use Previous Year Questions" />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">URL slug</span>
        <input className={`${field} mt-1.5`} maxLength={80} value={d.slug} onChange={(e) => { set("slug", e.target.value); setSlugTouched(true); }} placeholder="filled in from the title" />
        <span className="text-xs text-ink/50">The post's web address: yneet.in/blog/<em>your-slug</em>. Use lowercase words and dashes.</span>
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Google description</span>
        <textarea className={`${field} mt-1.5`} rows={2} maxLength={300} value={d.metaDescription} onChange={(e) => set("metaDescription", e.target.value)}
          placeholder="One or two sentences shown under the title in Google results." />
        <span className={`text-xs ${metaLen > 160 ? "text-red-600" : "text-ink/50"}`}>{metaLen} / 160 characters{metaLen > 160 ? " (Google may cut it off)" : ""}</span>
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Cover image address (optional)</span>
        <input className={`${field} mt-1.5`} value={d.coverImageUrl} onChange={(e) => set("coverImageUrl", e.target.value)} placeholder="https://…" />
      </label>

      <div>
        <span className="text-sm font-semibold">Article</span>
        <div className="mt-1.5 flex flex-wrap gap-1.5 p-2 rounded-t-xl border border-b-0 border-ink/15 bg-ink-50 dark:bg-ink">
          {[
            ["Heading", "formatBlock", "h2"], ["Subheading", "formatBlock", "h3"], ["Paragraph", "formatBlock", "p"],
            ["B", "bold"], ["I", "italic"], ["• List", "insertUnorderedList"], ["1. List", "insertOrderedList"],
            ["Link", "createLink"], ["Image", "insertImage"], ["Button box", "insertCta"],
          ].map(([label, name, arg]) => (
            <button key={label} type="button" className={tool} onMouseDown={(e) => e.preventDefault()} onClick={() => cmd(name, arg)}>{label}</button>
          ))}
          <button type="button" className={`${tool} ml-auto`} onClick={toggleHtml}>{htmlMode ? "Back to normal view" : "Edit HTML"}</button>
        </div>
        <div ref={visual} contentEditable suppressContentEditableWarning
          className={`blog-content min-h-[420px] px-6 py-5 rounded-b-xl border border-ink/15 bg-white dark:bg-ink-light focus:outline-none focus:border-gold ${htmlMode ? "hidden" : ""}`} />
        {htmlMode && (
          <textarea className="w-full min-h-[420px] p-4 rounded-b-xl border border-ink/15 font-mono text-[13px]" spellCheck={false}
            value={d.bodyHtml} onChange={(e) => set("bodyHtml", e.target.value)} />
        )}
        <p className="text-xs text-ink/50 mt-1.5">Paste from Word, Google Docs or a web page and the formatting comes with it. Images must be web links (https://…), not pasted pictures.</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <button disabled={saving} onClick={() => save("published")} className="bg-gold text-ink font-semibold px-5 py-2.5 rounded-full disabled:opacity-60">
          {live ? "Update post" : "Publish"}
        </button>
        {!live && <button disabled={saving} onClick={() => save("draft")} className="border border-ink/20 font-semibold px-5 py-2.5 rounded-full disabled:opacity-60">Save draft</button>}
        {live && <button disabled={saving} onClick={() => save("draft")} className="border border-ink/20 font-semibold px-5 py-2.5 rounded-full disabled:opacity-60">Unpublish</button>}
        {live && <a href={`/blog/${post!.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-rise-dark">View post ↗</a>}
      </div>

      {post && (
        <details className="pt-2">
          <summary className="cursor-pointer text-sm text-red-700">Delete this post</summary>
          <div className="flex gap-3 items-center mt-3 flex-wrap">
            <input className={`${field} max-w-xs`} placeholder="Type delete to confirm" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} />
            <button onClick={remove} className="border border-red-300 text-red-700 font-semibold px-4 py-2 rounded-full">Delete permanently</button>
          </div>
        </details>
      )}
    </div>
  );
}

const AdminBlog = () => {
  const [posts, setPosts] = useState<BlogSummary[] | null>(null);
  const [editing, setEditing] = useState<BlogPostFull | null | "new">(null);

  const load = () =>
    api.get("/blog/admin/posts").then((res) => setPosts(res.data.posts || [])).catch((e) => { toast.error(errMsg(e)); setPosts([]); });
  useEffect(() => { load(); }, []);

  const open = async (id: string) => {
    try { const res = await api.get(`/blog/admin/posts/${id}`); setEditing(res.data.post); window.scrollTo(0, 0); } catch (e) { toast.error(errMsg(e)); }
  };

  if (editing) return <Editor key={editing === "new" ? "new" : editing.id} post={editing === "new" ? null : editing} onDone={() => { setEditing(null); load(); }} />;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold">Blog</h1>
          <p className="text-ink/60 text-sm mt-1">Articles shown at yneet.in/blog.</p>
        </div>
        <div className="flex gap-3 items-center">
          <a href="/blog" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-ink/60 hover:text-ink">View blog ↗</a>
          <button onClick={() => setEditing("new")} className="bg-ink text-paper font-semibold px-5 py-2.5 rounded-full">+ New post</button>
        </div>
      </div>

      {posts === null && <p className="mt-8 text-ink/50">Loading…</p>}
      {posts?.length === 0 && (
        <div className="mt-8 p-6 rounded-2xl border border-ink/10 text-ink/70">
          No posts yet. Click <strong>New post</strong>. You can type the article, paste it, or import a ready-made .html article file.
        </div>
      )}
      {!!posts?.length && (
        <div className="mt-8 rounded-2xl border border-ink/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-ink/10">
                <th className="px-4 py-3">Title</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th><th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-b border-ink/5">
                  <td className="px-4 py-3">
                    <button onClick={() => open(p.id)} className="font-semibold text-left hover:underline">{p.title}</button>
                    <div className="text-xs text-ink/45">/blog/{p.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.status === "published" ? "bg-rise-light text-rise-dark" : "bg-ink/5 text-ink/60"}`}>
                      {p.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink/50">{formatDate(p.publishedAt || p.updatedAt)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {p.status === "published" && <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-rise-dark mr-4">View</a>}
                    <button onClick={() => open(p.id)} className="font-semibold text-rise-dark">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminBlog;
