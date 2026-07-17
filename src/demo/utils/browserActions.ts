import type { Artifact } from "../data/types";

export type DownloadSpec = {
  readonly filename: string;
  readonly mimeType: string;
  readonly contents: string;
};

export async function copyText(text: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard access is unavailable in this browser context.");
  }
  await navigator.clipboard.writeText(text);
}

export function downloadTextFile(spec: DownloadSpec): void {
  const blob = new Blob([spec.contents], { type: spec.mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = spec.filename;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

export function artifactDownloadSpec(issueKey: string, artifact: Artifact): DownloadSpec {
  return {
    filename: `${issueKey}-${artifact.name}`,
    mimeType:
      artifact.type === "JSON" ? "application/json;charset=utf-8" : "text/markdown;charset=utf-8",
    contents: artifact.body,
  };
}
