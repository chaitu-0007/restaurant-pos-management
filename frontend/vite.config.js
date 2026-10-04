import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In production the built app is served by FastAPI on the same port, so API
// calls use relative paths (/api/...). During `npm run dev` we proxy /api to
// the FastAPI server on :8000 so the dev experience matches production.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
  build: {
    outDir: "dist",
  },
});
