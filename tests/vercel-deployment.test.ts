import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import vercelConfig from "../vercel.json";

describe("Vercel static deployment contract", () => {
  it("uses the tracked lockfile and conventional Vite static output", () => {
    expect(vercelConfig).toMatchObject({
      framework: "vite",
      installCommand: "npm ci",
      buildCommand: "npm run build",
      outputDirectory: "dist",
    });
  });

  it("preserves filesystem routing instead of shadowing static pages with an SPA rewrite", () => {
    expect(vercelConfig).not.toHaveProperty("rewrites");
    expect(readFileSync(resolve(import.meta.dirname, "../index.html"), "utf8")).toContain(
      'data-page="case-study"',
    );
    expect(readFileSync(resolve(import.meta.dirname, "../demo/index.html"), "utf8")).toContain(
      'data-page="demo"',
    );
    expect(
      readFileSync(
        resolve(import.meta.dirname, "../writing/governing-ai-assisted-delivery/index.html"),
        "utf8",
      ),
    ).toContain('data-page="article"');
  });

  it("emits Vercel's conventional custom 404 document", () => {
    const notFound = readFileSync(resolve(import.meta.dirname, "../404.html"), "utf8");
    expect(notFound).toContain('data-page="not-found"');
    expect(notFound).toContain("Page not found");
  });
});
