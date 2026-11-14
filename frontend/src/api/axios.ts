import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ra_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login expired (token older than 7 days, or revoked) while the student was
// using the site: sign out and go to the login page, then back to where they
// were. Auth calls themselves (wrong password = 401) are left alone.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url: string = err?.config?.url || "";
    if (err?.response?.status === 401 && localStorage.getItem("ra_token") && !url.startsWith("/auth/") && typeof window !== "undefined") {
      localStorage.removeItem("ra_token");
      const back = window.location.pathname + window.location.search;
      if (!/^\/(login|register)/.test(window.location.pathname)) {
        window.location.assign(`/login?expired=1&next=${encodeURIComponent(back)}`);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
