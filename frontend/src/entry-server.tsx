// Build-time only (see scripts/prerender.mjs): renders a route to plain HTML
// so each public page ships its real text to search engines instead of an
// empty <div id="root">. Visitors still get the normal client-side app —
// main.tsx mounts over this markup as soon as the JavaScript loads.
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { BlogDataProvider, type BlogData } from "./blog/blogData";
import { PracticeDataProvider, type PracticeData } from "./practice/practiceData";

export { PAGE_META, metaFor, SITE_ORIGIN } from "./seo";
export { chapterMeta } from "./practice/practiceData";

export function render(url: string, blogData?: BlogData, practiceData?: PracticeData) {
  return renderToString(
    <StaticRouter location={url}>
      <AuthProvider>
        <BlogDataProvider value={blogData}>
          <PracticeDataProvider value={practiceData}>
            <App />
          </PracticeDataProvider>
        </BlogDataProvider>
      </AuthProvider>
    </StaticRouter>
  );
}
