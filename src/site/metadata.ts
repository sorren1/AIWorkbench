import type { SiteConfig } from "./config";

export type PageKind = "case-study" | "article" | "demo" | "not-found";

export type PageMetadata = {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly type: "website" | "article";
};

export const PAGE_METADATA: Record<PageKind, PageMetadata> = {
  "case-study": {
    title: "AI Delivery Workbench — Governed AI-assisted delivery",
    description:
      "A governed, human-in-the-loop control plane for AI-assisted software delivery, presented as an independent case study and interactive prototype.",
    path: "/",
    type: "website",
  },
  article: {
    title: "Governing AI-assisted delivery — AI Delivery Workbench",
    description:
      "A technical essay about authorization, bounded context, human approval, invalidation, and commit-bound evidence in coding-agent workflows.",
    path: "/writing/governing-ai-assisted-delivery/",
    type: "article",
  },
  demo: {
    title: "AI Delivery Workbench — Interactive portfolio prototype",
    description:
      "Explore the functional local workflow and synthetic evidence model behind AI Delivery Workbench.",
    path: "/demo/",
    type: "website",
  },
  "not-found": {
    title: "Page not found — AI Delivery Workbench",
    description: "The requested AI Delivery Workbench page could not be found.",
    path: "/404.html",
    type: "website",
  },
};

function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function normalizedBaseUrl(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

export function absoluteSiteUrl(config: SiteConfig, path: string): string | null {
  if (!config.canonicalUrl) return null;
  return new URL(path.replace(/^\//, ""), normalizedBaseUrl(config.canonicalUrl)).toString();
}

export function renderMetadataTags(config: SiteConfig, page: PageMetadata): string {
  const pageUrl = absoluteSiteUrl(config, page.path);
  const socialImageUrl = absoluteSiteUrl(config, "/assets/social-card.svg");
  const tags = [
    `<meta property="og:site_name" content="AI Delivery Workbench" />`,
    `<meta property="og:type" content="${page.type}" />`,
    `<meta property="og:title" content="${escapeAttribute(page.title)}" />`,
    `<meta property="og:description" content="${escapeAttribute(page.description)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttribute(page.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttribute(page.description)}" />`,
  ];

  if (pageUrl) {
    tags.push(`<link rel="canonical" href="${escapeAttribute(pageUrl)}" />`);
    tags.push(`<meta property="og:url" content="${escapeAttribute(pageUrl)}" />`);
  }
  if (socialImageUrl) {
    tags.push(`<meta property="og:image" content="${escapeAttribute(socialImageUrl)}" />`);
    tags.push(`<meta property="og:image:width" content="1200" />`);
    tags.push(`<meta property="og:image:height" content="630" />`);
    tags.push(
      `<meta property="og:image:alt" content="AI Delivery Workbench — governed software delivery" />`,
    );
    tags.push(`<meta name="twitter:image" content="${escapeAttribute(socialImageUrl)}" />`);
  }

  return tags.join("\n    ");
}

function projectSchema(config: SiteConfig, pageUrl: string | null): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@type": "SoftwareSourceCode",
    name: "AI Delivery Workbench",
    description: PAGE_METADATA["case-study"].description,
    applicationCategory: "DeveloperApplication",
    programmingLanguage: ["TypeScript", "HTML", "CSS"],
    isAccessibleForFree: true,
    keywords: [
      "AI-assisted software delivery",
      "human-in-the-loop",
      "coding agents",
      "software governance",
    ],
  };
  if (pageUrl) schema.url = pageUrl;
  if (config.repositoryUrl) schema.codeRepository = config.repositoryUrl;
  if (config.authorName) schema.author = { "@type": "Person", name: config.authorName };
  return schema;
}

export function renderStructuredData(
  config: SiteConfig,
  kind: PageKind,
  page: PageMetadata,
): string {
  const pageUrl = absoluteSiteUrl(config, page.path);
  const graph: Record<string, unknown>[] = [projectSchema(config, pageUrl)];

  if (kind === "article") {
    const article: Record<string, unknown> = {
      "@type": "TechArticle",
      headline: "Governing AI-assisted delivery",
      description: page.description,
      about: ["authorization", "context provenance", "human approval", "validation evidence"],
      isPartOf: { "@type": "WebSite", name: "AI Delivery Workbench" },
    };
    if (pageUrl) article.url = pageUrl;
    if (config.authorName) article.author = { "@type": "Person", name: config.authorName };
    graph.push(article);
  }

  const data = { "@context": "https://schema.org", "@graph": graph };
  return `<script type="application/ld+json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>`;
}

export function createRobotsTxt(config: SiteConfig): string {
  const lines = ["User-agent: *", "Allow: /", "Disallow: /404.html"];
  const sitemapUrl = absoluteSiteUrl(config, "/sitemap.xml");
  if (sitemapUrl) lines.push(`Sitemap: ${sitemapUrl}`);
  return `${lines.join("\n")}\n`;
}

export function createSitemapXml(config: SiteConfig): string {
  const publicPaths = [
    PAGE_METADATA["case-study"].path,
    PAGE_METADATA.article.path,
    PAGE_METADATA.demo.path,
  ];
  const entries = publicPaths
    .map((path) => absoluteSiteUrl(config, path))
    .filter((url): url is string => url !== null)
    .map((url) => `  <url><loc>${escapeAttribute(url)}</loc></url>`)
    .join("\n");

  const body = entries ? `${entries}\n` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}</urlset>\n`;
}
