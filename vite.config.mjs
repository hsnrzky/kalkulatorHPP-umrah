import { resolve } from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 8000,
    strictPort: true
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: true
  }
});
