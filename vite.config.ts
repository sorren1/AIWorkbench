import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

import { portfolioSitePlugin } from "./src/site/vitePlugin";

const root = import.meta.dirname;

export default defineConfig({
  base: "./",
  plugins: [portfolioSitePlugin(root), react()],
  build: {
    rollupOptions: {
      input: {
        site: resolve(root, "index.html"),
        article: resolve(root, "writing/governing-ai-assisted-delivery/index.html"),
        demo: resolve(root, "demo/index.html"),
        notFound: resolve(root, "404.html"),
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "fixtures/**", ".workbench/**", "node_modules/**", "dist/**"],
    css: true,
  },
});
