import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./fonts.css";
import "./index.css";

// The toast container isn't in the prerendered HTML, so it mounts right after
// hydration instead of making the first client render differ from it.
function ClientToaster() {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(true), []);
  return on ? <Toaster position="top-center" /> : null;
}

const rootEl = document.getElementById("root")!;
const tree = (
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <ClientToaster />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Prerendered pages (scripts/prerender.mjs) already contain the page's HTML:
// hydrate it in place instead of throwing it away and rebuilding it, so the
// text the visitor is already reading stays put (faster LCP, less main-thread
// work). Shells with an empty #root (app routes, blog/practice shells) render
// normally.
if (rootEl.firstElementChild) ReactDOM.hydrateRoot(rootEl, tree);
else ReactDOM.createRoot(rootEl).render(tree);

// Back button after logout: a page restored from the browser's back/forward
// cache skips all code, so reload it and let the normal sign-in checks run.
window.addEventListener("pageshow", (e) => {
  if (e.persisted && !localStorage.getItem("ra_token") && /^\/(dashboard|admin|institute)/.test(location.pathname)) location.reload();
});
