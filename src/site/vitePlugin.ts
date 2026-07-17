import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Plugin } from "vite";

import { modelGatewayStatus } from "../demo/model-gateway/generated";
import type { ModelGatewayPublicStatus } from "../demo/model-gateway/status";
import type { SiteConfig } from "./config";
import {
  renderRecordedSandboxEvidence,
  type RecordedSandboxEvidenceRender,
} from "./recordedSandboxEvidence";
import {
  createRobotsTxt,
  createSitemapXml,
  PAGE_METADATA,
  renderMetadataTags,
  renderStructuredData,
  type PageKind,
} from "./metadata";
import { renderStaticHostHeaders } from "./securityHeaders";
import { renderSupplyChainEvidence } from "./supplyChainEvidence";

type Excerpt = {
  readonly sourcePath: string;
  readonly marker: string;
};

const EXCERPTS: Record<string, Excerpt> = {
  "typed-transitions": {
    sourcePath: "src/demo/state/store.tsx",
    marker: "typed-transitions",
  },
  "stale-invalidation": {
    sourcePath: "src/demo/state/store.tsx",
    marker: "stale-invalidation",
  },
  "artifact-provenance": {
    sourcePath: "src/demo/data/types.ts",
    marker: "artifact-provenance",
  },
  "changed-file-classification": {
    sourcePath: "src/demo/data/types.ts",
    marker: "changed-file-classification",
  },
  "human-approval-gate": {
    sourcePath: "src/demo/screens/GitHubScreen.tsx",
    marker: "human-approval-gate",
  },
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function readExcerpt(root: string, excerpt: Excerpt): string {
  const source = readFileSync(resolve(root, excerpt.sourcePath), "utf8");
  const startToken = `excerpt:start:${excerpt.marker}`;
  const endToken = `excerpt:end:${excerpt.marker}`;
  const start = source.indexOf(startToken);
  const end = source.indexOf(endToken);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`Missing synchronized excerpt markers for ${excerpt.marker}`);
  }
  const contentStart = source.indexOf("\n", start);
  if (contentStart < 0) throw new Error(`Malformed excerpt marker for ${excerpt.marker}`);
  return source.slice(contentStart + 1, end).trim();
}

function pageKindFromHtml(html: string): PageKind {
  const match = /<body[^>]*data-page="(case-study|article|demo|not-found)"/.exec(html);
  switch (match?.[1]) {
    case "case-study":
    case "article":
    case "demo":
    case "not-found":
      return match[1];
    default:
      throw new Error("Every HTML entry must declare a supported data-page value");
  }
}

function replaceConfigLinks(html: string, config: SiteConfig): string {
  const links: Record<"repository" | "resume" | "contact", string | null> = {
    repository: config.repositoryUrl,
    resume: config.resumeUrl,
    contact: config.contactUrl,
  };
  const pattern =
    /<a\b([^>]*\bdata-config-link="(repository|resume|contact)"[^>]*)>([\s\S]*?)<\/a\s*>/g;

  return html.replace(pattern, (_match: string, attrs: string, key: string, label: string) => {
    if (key !== "repository" && key !== "resume" && key !== "contact") return "";
    const configuredUrl = links[key];
    if (!configuredUrl) return "";
    const sourcePathMatch = /\bdata-source-path="([^"]+)"/.exec(attrs);
    const destination = sourcePathMatch?.[1]
      ? `${configuredUrl.replace(/\/$/, "")}/blob/main/${sourcePathMatch[1]}`
      : configuredUrl;
    const cleanAttributes = attrs
      .replace(/\s*data-config-link="[^"]+"/, "")
      .replace(/\s*data-source-path="[^"]+"/, "")
      .replace(/\s+hidden\b/, "");
    return `<a${cleanAttributes} href="${escapeHtml(destination)}" rel="noopener noreferrer">${label}</a>`;
  });
}

function replaceExcerpts(html: string, root: string): string {
  return html.replace(
    /<code\b([^>]*\bdata-code-excerpt="([^"]+)"[^>]*)>[\s\S]*?<\/code>/g,
    (_match: string, attrs: string, key: string) => {
      const excerpt = EXCERPTS[key];
      if (!excerpt) throw new Error(`Unknown source excerpt: ${key}`);
      const cleanAttributes = attrs.replace(/\s*data-code-excerpt="[^"]+"/, "");
      return `<code${cleanAttributes}>${escapeHtml(readExcerpt(root, excerpt))}</code>`;
    },
  );
}

function renderModelGatewayStatus(): string {
  const status: ModelGatewayPublicStatus = modelGatewayStatus;
  const statusClass = status.liveValidated
    ? "site-status site-status--functional"
    : "site-status site-status--planned";
  const evidence = status.liveValidated
    ? `A sanitized recorded catalog and local run are bound to source commit ${escapeHtml(status.sourceCommit?.slice(0, 12) ?? "unknown")}.`
    : "No live provider credential or successful live run was available for this revision.";
  return `<tr>
    <th scope="row">Optional scoped local model gateway</th>
    <td><span class="${statusClass}">${escapeHtml(status.label)}</span></td>
    <td>A typed offline adapter and an explicit LiteLLM local profile enforce model allow lists, scoped virtual credentials, fallback order, token/cost/time budgets, model-call traces, and cleanup. ${evidence} The static site never calls the gateway.</td>
  </tr>`;
}

export function portfolioSitePlugin(root: string, siteConfig: SiteConfig): Plugin {
  let recordedEvidence: RecordedSandboxEvidenceRender | null = null;
  return {
    name: "portfolio-site-generator",
    configureServer(server) {
      server.middlewares.use("/recorded-evidence", (request, response, next) => {
        void renderRecordedSandboxEvidence(root)
          .then((current) => {
            if (!current) {
              next();
              return;
            }
            const requestedName = (request.url ?? "/").split("?", 1)[0]?.replace(/^\//, "");
            const assets = [
              {
                name: current.jsonName,
                body: current.json,
                type: "application/json; charset=utf-8",
              },
              {
                name: current.markdownName,
                body: current.markdown,
                type: "text/markdown; charset=utf-8",
              },
              ...(current.traceName && current.trace
                ? [
                    {
                      name: current.traceName,
                      body: current.trace,
                      type: "application/json; charset=utf-8",
                    },
                  ]
                : []),
            ];
            const asset = assets.find((candidate) => candidate.name === requestedName);
            if (!asset) {
              next();
              return;
            }
            response.statusCode = 200;
            response.setHeader("Content-Type", asset.type);
            response.setHeader("Cache-Control", "no-store");
            response.end(asset.body);
          })
          .catch(next);
      });
    },
    transformIndexHtml: {
      order: "pre",
      async handler(html) {
        const kind = pageKindFromHtml(html);
        const page = PAGE_METADATA[kind];
        let withMetadata = html
          .replace("<!-- site:generated-head -->", renderMetadataTags(siteConfig, page))
          .replace("<!-- site:structured-data -->", renderStructuredData(siteConfig, kind, page))
          .replace("<!-- site:model-gateway-status -->", renderModelGatewayStatus())
          .replace("<!-- site:supply-chain-evidence -->", await renderSupplyChainEvidence(root));
        if (withMetadata.includes("<!-- site:recorded-sandbox-evidence -->")) {
          recordedEvidence = await renderRecordedSandboxEvidence(root);
          withMetadata = withMetadata.replace(
            "<!-- site:recorded-sandbox-evidence -->",
            recordedEvidence?.html ??
              '<div class="site-recorded-run"><p>No validated recorded run is checked in. Run <code>npm run demo:sandbox</code> locally with Docker, then validate the emitted evidence before publication.</p></div>',
          );
        }
        return replaceConfigLinks(replaceExcerpts(withMetadata, root), siteConfig);
      },
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "_headers", source: renderStaticHostHeaders() });
      this.emitFile({ type: "asset", fileName: "robots.txt", source: createRobotsTxt(siteConfig) });
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: createSitemapXml(siteConfig),
      });
      if (recordedEvidence) {
        this.emitFile({
          type: "asset",
          fileName: `recorded-evidence/${recordedEvidence.jsonName}`,
          source: recordedEvidence.json,
        });
        this.emitFile({
          type: "asset",
          fileName: `recorded-evidence/${recordedEvidence.markdownName}`,
          source: recordedEvidence.markdown,
        });
        if (recordedEvidence.traceName && recordedEvidence.trace) {
          this.emitFile({
            type: "asset",
            fileName: `recorded-evidence/${recordedEvidence.traceName}`,
            source: recordedEvidence.trace,
          });
        }
      }
    },
  };
}
