import type { SupplyChainSuppression } from "./contracts";

export function normalizeSuppressionPath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^file:\/\//, "");
}

export function validateSuppressionPolicy(
  entries: readonly SupplyChainSuppression[],
  today: string,
): void {
  const ids = new Set<string>();
  const selectors = new Set<string>();
  for (const entry of entries) {
    if (ids.has(entry.id)) throw new Error(`Duplicate suppression ID: ${entry.id}`);
    ids.add(entry.id);

    const selector = `${entry.scanner}\0${entry.ruleId}\0${normalizeSuppressionPath(entry.path)}`;
    if (selectors.has(selector)) {
      throw new Error(`Duplicate suppression selector: ${entry.scanner}/${entry.ruleId}`);
    }
    selectors.add(selector);

    if (entry.expiresOn < today || entry.reviewOn > entry.expiresOn) {
      throw new Error(`Expired or invalid supply-chain suppression: ${entry.id}`);
    }
  }
}
