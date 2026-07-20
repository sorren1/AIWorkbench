import type { SiteConfig } from "./config";
import { absoluteSiteUrl } from "./metadata";

export const SECURITY_TXT_PATH = "/.well-known/security.txt";

export function createSecurityTxt(config: SiteConfig, source: string): string {
  if (/^Canonical:/imu.test(source)) {
    throw new Error("The security.txt source must not contain a static Canonical field.");
  }

  const canonicalUrl = absoluteSiteUrl(config, SECURITY_TXT_PATH);
  const fields = [canonicalUrl ? `Canonical: ${canonicalUrl}` : null, source.trim()];
  return `${fields.filter((field): field is string => Boolean(field)).join("\n")}\n`;
}
