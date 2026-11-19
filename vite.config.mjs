import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

function versionOfflineShell() {
  return {
    name: "version-offline-shell",
    apply: "build",
    async closeBundle() {
      const outputDir = resolve(import.meta.dirname, "dist");
      const [html, worker] = await Promise.all([
        readFile(resolve(outputDir, "index.html"), "utf8"),
        readFile(resolve(import.meta.dirname, "public/sw.js"), "utf8"),
      ]);
      const buildId = createHash("sha256")
        .update(html)
        .update(worker)
        .digest("hex")
        .slice(0, 12);
      const versionedWorker = worker.replace(
        /const CACHE_NAME = "rihlah-umrah-shell-[^"]+";/,
        `const CACHE_NAME = "rihlah-umrah-shell-${buildId}";`,
      );

      if (versionedWorker === worker) {
        throw new Error("Could not version the offline service worker cache.");
      }

      await writeFile(resolve(outputDir, "sw.js"), versionedWorker);
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [tailwindcss(), versionOfflineShell()],
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
