export type OptionalPublicUrl = string | null;

export type SiteConfig = {
  readonly authorName: string | null;
  readonly canonicalUrl: OptionalPublicUrl;
  readonly repositoryUrl: OptionalPublicUrl;
  readonly resumeUrl: OptionalPublicUrl;
  readonly contactUrl: OptionalPublicUrl;
  readonly analyticsOptIn: boolean;
};

/**
 * Public identity and outbound links live here so page components never need
 * private contact details. Null values are deliberately omitted from generated
 * metadata and rendered navigation rather than becoming dead placeholders.
 */
export const siteConfig: SiteConfig = {
  authorName: null,
  canonicalUrl: null,
  repositoryUrl: "https://github.com/sorren1/AIWorkbench",
  resumeUrl: null,
  contactUrl: null,
  analyticsOptIn: false,
};
