import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import glsl from "vite-plugin-glsl";

// https://vite.dev/config/
export default defineConfig({
  // base: "/certopslite/app-2/",
  plugins: [react(), glsl()],
  server: {
    port: 8081,
  },
});
