export type OptionalPublicUrl = string | null;

export type SiteConfigEnvironment = Readonly<Record<string, string | undefined>>;

export type SiteConfig = {
  readonly authorName: string | null;
  readonly canonicalUrl: OptionalPublicUrl;
  readonly repositoryUrl: OptionalPublicUrl;
  readonly resumeUrl: OptionalPublicUrl;
  readonly contactUrl: OptionalPublicUrl;
  readonly analyticsOptIn: boolean;
};

function canonicalUrl(value: string | undefined): OptionalPublicUrl {
  const candidate = value?.trim();
  if (!candidate) return null;

  const parsed = new URL(candidate);
  if (parsed.protocol !== "https:") {
    throw new Error("SITE_CANONICAL_URL must use HTTPS.");
  }
  if (parsed.username || parsed.password) {
    throw new Error("SITE_CANONICAL_URL must not contain credentials.");
  }
  if (parsed.port) {
    throw new Error("SITE_CANONICAL_URL must not contain a non-default port.");
  }
  if (parsed.search || parsed.hash) {
    throw new Error("SITE_CANONICAL_URL must not contain a query string or fragment.");
  }
  if (parsed.pathname !== "/") {
    throw new Error("SITE_CANONICAL_URL must be an origin without a path.");
  }
  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "vercel.app" || hostname.endsWith(".vercel.app")) {
    throw new Error("SITE_CANONICAL_URL must be a stable custom domain, not a preview hostname.");
  }

  parsed.pathname = "/";
  return parsed.toString();
}

export function createSiteConfig(environment: SiteConfigEnvironment = {}): SiteConfig {
  return {
    authorName: null,
    canonicalUrl: canonicalUrl(environment.SITE_CANONICAL_URL),
    repositoryUrl: "https://github.com/sorren1/AIWorkbench",
    resumeUrl: null,
    contactUrl: null,
    analyticsOptIn: false,
  };
}

/**
 * Public identity and outbound links live here so page components never need
 * private contact details. Null values are deliberately omitted from generated
 * metadata and rendered navigation rather than becoming dead placeholders.
 */
export const siteConfig = createSiteConfig();
