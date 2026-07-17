import { architecture, meta } from "../data/fixtures";
import type { DownloadSpec } from "../utils/browserActions";

const CLASSIFICATION = "synthetic_public_portfolio_content";
const NOTICE =
  "Independent portfolio prototype. This export describes an original illustrative architecture; it is not evidence of deployed infrastructure.";

export function architectureSummaryJson(): string {
  return JSON.stringify(
    {
      schemaVersion: 1,
      kind: "ai-delivery-workbench-architecture-summary",
      classification: CLASSIFICATION,
      product: meta.product,
      subtitle: meta.subtitle,
      notice: NOTICE,
      planes: architecture.planes.map(({ id, name, tagline, items }) => ({
        id,
        name,
        tagline,
        responsibilities: items,
      })),
      productionBoundary: architecture.productionNote,
      reviewTopics: architecture.reviewTopics,
    },
    null,
    2,
  );
}

export function architectureSummaryMarkdown(): string {
  const planes = architecture.planes
    .map(
      (plane) =>
        `## ${plane.name}\n\n${plane.tagline}\n\n${plane.items.map((item) => `- ${item}`).join("\n")}`,
    )
    .join("\n\n");
  const topics = architecture.reviewTopics.map((topic) => `- ${topic}`).join("\n");
  return `# ${meta.product} architecture summary\n\n> ${NOTICE}\n\n${meta.subtitle}\n\n${planes}\n\n## Production boundary\n\n${architecture.productionNote}\n\n## Engineering review topics\n\n${topics}\n`;
}

export function architectureDownload(format: "json" | "markdown"): DownloadSpec {
  return format === "json"
    ? {
        filename: "ai-delivery-workbench-architecture.json",
        mimeType: "application/json;charset=utf-8",
        contents: architectureSummaryJson(),
      }
    : {
        filename: "ai-delivery-workbench-architecture.md",
        mimeType: "text/markdown;charset=utf-8",
        contents: architectureSummaryMarkdown(),
      };
}
