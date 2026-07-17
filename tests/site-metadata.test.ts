import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import type { SiteConfig } from "../src/site/config";
import {
  absoluteSiteUrl,
  createRobotsTxt,
  createSitemapXml,
  PAGE_METADATA,
  renderMetadataTags,
  renderStructuredData,
} from "../src/site/metadata";
import { renderRecordedSandboxEvidence } from "../src/site/recordedSandboxEvidence";

const unconfigured: SiteConfig = {
  authorName: null,
  canonicalUrl: null,
  repositoryUrl: "https://github.com/example/workbench",
  resumeUrl: null,
  contactUrl: null,
  analyticsOptIn: false,
};

const configured: SiteConfig = {
  ...unconfigured,
  authorName: "Example Author",
  canonicalUrl: "https://portfolio.example/projects/workbench/",
  contactUrl: "https://portfolio.example/contact/",
};

describe("static site metadata", () => {
  it("renders only validated checked-in sandbox evidence at build time", async () => {
    const rendered = await renderRecordedSandboxEvidence(resolve(import.meta.dirname, ".."));
    expect(rendered?.html).toContain("Failing before, passing after one allow-listed patch.");
    expect(rendered?.html).toContain("visitor's browser does not execute code");
    expect(rendered?.html).toContain("src/report.js");
    expect(rendered?.jsonName).toMatch(/^sandbox-run-.+\.json$/);
  });

  it("omits canonical-dependent metadata rather than inventing a deployment URL", () => {
    const tags = renderMetadataTags(unconfigured, PAGE_METADATA["case-study"]);
    expect(tags).not.toContain('rel="canonical"');
    expect(tags).not.toContain('property="og:url"');
    expect(createRobotsTxt(unconfigured)).not.toContain("Sitemap:");
    expect(createSitemapXml(unconfigured)).not.toContain("<loc>");
  });

  it("generates subpath-safe canonical, social, robots, and sitemap URLs when configured", () => {
    expect(absoluteSiteUrl(configured, "/writing/governing-ai-assisted-delivery/")).toBe(
      "https://portfolio.example/projects/workbench/writing/governing-ai-assisted-delivery/",
    );

    const tags = renderMetadataTags(configured, PAGE_METADATA.article);
    expect(tags).toContain('rel="canonical"');
    expect(tags).toContain('property="og:image"');
    expect(createRobotsTxt(configured)).toContain(
      "Sitemap: https://portfolio.example/projects/workbench/sitemap.xml",
    );
    expect(createSitemapXml(configured)).toContain(
      "<loc>https://portfolio.example/projects/workbench/demo/</loc>",
    );
  });

  it("emits project and article schema with a person only when public author data exists", () => {
    const publicSchema = renderStructuredData(configured, "article", PAGE_METADATA.article);
    expect(publicSchema).toContain('"@type":"SoftwareSourceCode"');
    expect(publicSchema).toContain('"@type":"TechArticle"');
    expect(publicSchema).toContain('"@type":"Person"');

    const privateSchema = renderStructuredData(
      unconfigured,
      "case-study",
      PAGE_METADATA["case-study"],
    );
    expect(privateSchema).not.toContain('"@type":"Person"');
  });
});
