import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster position="top-center" />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Back button after logout: a page restored from the browser's back/forward
// cache skips all code, so reload it and let the normal sign-in checks run.
window.addEventListener("pageshow", (e) => {
  if (e.persisted && !localStorage.getItem("ra_token") && /^\/(dashboard|admin|institute)/.test(location.pathname)) location.reload();
});
