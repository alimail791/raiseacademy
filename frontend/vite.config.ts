import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Android app (Play Store) domain verification: see assetlinks.plugin.mjs.
import assetLinks from "./assetlinks.plugin.mjs";

export default defineConfig({
  plugins: [react(), assetLinks()],
  server: { port: 5173 },
});
