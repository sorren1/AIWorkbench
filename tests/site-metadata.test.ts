import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { createSiteConfig, type SiteConfig } from "../src/site/config";
import {
  absoluteSiteUrl,
  createRobotsTxt,
  createSitemapXml,
  PAGE_METADATA,
  renderMetadataTags,
  renderStructuredData,
} from "../src/site/metadata";
import { renderRecordedSandboxEvidence } from "../src/site/recordedSandboxEvidence";
import { siteConfig } from "../src/site/config";

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
  canonicalUrl: "https://portfolio.example/",
  contactUrl: "https://portfolio.example/contact/",
};

describe("static site metadata", () => {
  it("keeps analytics disabled without provider scripts, cookies, or beacons", () => {
    expect(siteConfig.analyticsOptIn).toBe(false);
    const caseStudy = readFileSync(resolve(import.meta.dirname, "../index.html"), "utf8");
    expect(caseStudy).not.toMatch(
      /<script[^>]+(?:google-analytics|googletagmanager|plausible\.io|segment\.com|mixpanel\.com)/i,
    );
  });

  it("renders only validated checked-in sandbox evidence at build time", async () => {
    const rendered = await renderRecordedSandboxEvidence(resolve(import.meta.dirname, ".."));
    expect(rendered?.html).toContain("Failing before, passing after one allow-listed patch.");
    expect(rendered?.html).toContain("visitor's browser does not execute code");
    expect(rendered?.html).toContain("src/report.js");
    expect(rendered?.jsonName).toMatch(/^sandbox-run-.+\.json$/);
    expect(rendered?.traceName).toMatch(/^sandbox-trace-.+\.json$/);
    expect(rendered?.trace).toContain('"delivery.run"');
    expect(rendered?.html).toContain("Inspect accessible Run Trace");
    expect(rendered?.html).toContain("exact zero no model");
    const caseStudy = readFileSync(resolve(import.meta.dirname, "../index.html"), "utf8");
    expect(caseStudy).toContain("Implemented but not live-validated");
    expect(caseStudy).toContain("recorded evidence below remains Docker-backed");
  });

  it("omits canonical-dependent metadata rather than inventing a deployment URL", () => {
    const tags = renderMetadataTags(unconfigured, PAGE_METADATA["case-study"]);
    expect(tags).not.toContain('rel="canonical"');
    expect(tags).not.toContain('property="og:url"');
    expect(createRobotsTxt(unconfigured)).not.toContain("Sitemap:");
    expect(createSitemapXml(unconfigured)).not.toContain("<loc>");
  });

  it("loads and normalizes a custom canonical origin from the build environment", () => {
    expect(
      createSiteConfig({ SITE_CANONICAL_URL: " https://workbench.example.net " }).canonicalUrl,
    ).toBe("https://workbench.example.net/");
  });

  it.each([
    "http://workbench.example.net",
    "https://user:secret@workbench.example.net",
    "https://workbench.example.net:8443",
    "https://workbench.example.net?preview=true",
    "https://workbench.example.net/#section",
    "https://workbench.example.net/case-study",
    "https://ai-workbench.vercel.app",
    "https://vercel.app",
  ])("rejects an unsafe or ephemeral canonical URL: %s", (canonicalUrl) => {
    expect(() => createSiteConfig({ SITE_CANONICAL_URL: canonicalUrl })).toThrow();
  });

  it("generates origin and workbench-path canonical metadata when configured", () => {
    expect(absoluteSiteUrl(configured, "/writing/governing-ai-assisted-delivery/")).toBe(
      "https://portfolio.example/writing/governing-ai-assisted-delivery/",
    );

    const tags = renderMetadataTags(configured, PAGE_METADATA.article);
    expect(tags).toContain('rel="canonical"');
    expect(tags).toContain(
      'href="https://portfolio.example/workbench/writing/governing-ai-assisted-delivery/"',
    );
    expect(tags).toContain('property="og:image"');
    expect(tags).toContain("workbench/assets/social-card.png");
    expect(tags).toContain('property="og:image:type" content="image/png"');
    expect(createRobotsTxt(configured)).toContain("Sitemap: https://portfolio.example/sitemap.xml");
    expect(createSitemapXml(configured)).toContain(
      "<loc>https://portfolio.example/workbench/demo/</loc>",
    );
    expect(createSitemapXml(configured)).toContain("<loc>https://portfolio.example/</loc>");
  });

  it("keeps the portfolio home distinct from Workbench metadata", () => {
    const tags = renderMetadataTags(configured, PAGE_METADATA.home);
    expect(tags).toContain('property="og:site_name" content="Tyler Wilhite"');
    expect(tags).toContain('rel="canonical" href="https://portfolio.example/"');

    const schema = renderStructuredData(configured, "home", PAGE_METADATA.home);
    expect(schema).toContain('"@type":"WebSite"');
    expect(schema).toContain('"name":"Tyler Wilhite"');
    expect(schema).not.toContain('"@type":"SoftwareSourceCode"');
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
