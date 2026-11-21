import axios from "axios";

// YNeet sales partners (www.yneet.in/partner) use their own token, separate from
// student/admin and institute logins.
export const SP_TOKEN = "ra_sp_token";

const partnerApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/sales-partners`,
});

partnerApi.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem(SP_TOKEN) : null;
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default partnerApi;

export type PartnerTerms = {
  firstRate: number; renewalRate: number; bonusAfter: number; bonusAmount: number; payWithinDays: number;
  monthly: { seats: number; price: number }[]; yearly: { seats: number; price: number }[];
};

// Fallback until GET /terms answers (and for the prerendered HTML). Keep in sync
// with backend controllers/salesPartnerController.js + instituteController.js.
export const DEFAULT_TERMS: PartnerTerms = {
  firstRate: 0.2, renewalRate: 0.1, bonusAfter: 3, bonusAmount: 5000, payWithinDays: 7,
  monthly: [{ seats: 20, price: 3999 }, { seats: 50, price: 8999 }, { seats: 100, price: 14999 }],
  yearly: [{ seats: 20, price: 31999 }, { seats: 50, price: 69999 }, { seats: 100, price: 119999 }],
};

export const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
