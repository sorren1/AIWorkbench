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

  it("keeps the portfolio home at the origin and scopes the complete Workbench under its prefix", () => {
    expect(vercelConfig.rewrites).toEqual([
      { source: "/", destination: "/home/index.html" },
      { source: "/workbench", destination: "/index.html" },
      { source: "/workbench/", destination: "/index.html" },
      { source: "/workbench/demo", destination: "/demo/index.html" },
      { source: "/workbench/demo/", destination: "/demo/index.html" },
      {
        source: "/workbench/writing/governing-ai-assisted-delivery",
        destination: "/writing/governing-ai-assisted-delivery/index.html",
      },
      {
        source: "/workbench/writing/governing-ai-assisted-delivery/",
        destination: "/writing/governing-ai-assisted-delivery/index.html",
      },
      { source: "/workbench/assets/:path*", destination: "/assets/:path*" },
      { source: "/workbench/capabilities/:path*", destination: "/capabilities/:path*" },
      {
        source: "/workbench/recorded-evidence/:path*",
        destination: "/recorded-evidence/:path*",
      },
      { source: "/workbench/site.webmanifest", destination: "/site.webmanifest" },
    ]);
    expect(vercelConfig.rewrites).not.toContainEqual({
      source: "/workbench/:path*",
      destination: "/:path*",
    });
    expect(readFileSync(resolve(import.meta.dirname, "../home/index.html"), "utf8")).toContain(
      'data-page="home"',
    );
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
    expect(notFound).toContain('<base href="/" />');
    expect(notFound).toContain('href="/workbench/">Return to case study</a>');
    expect(notFound).toContain('href="/workbench/demo/">Open interactive prototype</a>');
    expect(notFound).not.toMatch(/(?:href|src)="\.\//u);
  });
});
