import axios from "axios";

// Institute panel uses its own token, separate from the student/admin login.
export const INST_TOKEN = "ra_inst_token";

const instituteApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/institute`,
});

instituteApi.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem(INST_TOKEN) : null;
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default instituteApi;

// Minimal CSV parser (quoted fields, commas, CRLF). Header row → objects with
// lowercased, space-free keys.
export const parseCsv = (text: string): Record<string, string>[] => {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  if (rows.length < 2) return [];
  const head = rows[0].map((h) => h.replace(/^﻿/, "").trim().toLowerCase().replace(/[\s_]+/g, ""));
  return rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] || "").trim()])));
};
