import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

import { createSiteConfig } from "./src/site/config";
import { resolveDeploymentBinding } from "./src/site/deploymentBinding";
import { readSupplyChainSummary, releaseDeploymentIdentity } from "./src/site/supplyChainEvidence";
import { portfolioSitePlugin } from "./src/site/vitePlugin";
import { STATIC_SECURITY_HEADERS } from "./src/site/securityHeaders";

const root = import.meta.dirname;
const releaseSummary = await readSupplyChainSummary(root);
const deploymentBinding = resolveDeploymentBinding(
  process.env,
  releaseDeploymentIdentity(releaseSummary),
);

export default defineConfig(({ mode }) => {
  const publicSiteConfig = createSiteConfig(loadEnv(mode, root, "SITE_"));

  return {
    base: "./",
    plugins: [portfolioSitePlugin(root, publicSiteConfig, deploymentBinding), react()],
    server: { headers: STATIC_SECURITY_HEADERS },
    preview: { headers: STATIC_SECURITY_HEADERS },
    build: {
      assetsDir: "assets/immutable",
      manifest: true,
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
      coverage: {
        provider: "v8",
        reporter: ["text", "json-summary", "html"],
        reportsDirectory: "coverage",
        include: [
          "src/demo/state/**/*.{ts,tsx}",
          "src/demo/authorization/**/*.ts",
          "src/demo/context/{rules,selector}.ts",
          "src/demo/control-plane/registry/{canonical,lifecycle,validation}.ts",
          "src/demo/exports/*.ts",
          "src/demo/utils/*.ts",
          "src/site/{metadata,recordedSandboxEvidence,securityHeaders,supplyChainEvidence}.ts",
        ],
        thresholds: {
          statements: 75,
          branches: 60,
          functions: 75,
          lines: 75,
          "src/demo/state/guards.ts": {
            statements: 100,
            branches: 85,
            functions: 100,
            lines: 100,
          },
        },
      },
    },
  };
});
