import { describe, expect, it, vi } from "vitest";

import {
  architectureDownload,
  architectureSummaryJson,
  architectureSummaryMarkdown,
} from "../src/demo/exports/architecture";
import {
  createValidationEvidencePack,
  validationEvidenceDownload,
} from "../src/demo/exports/validation";
import { validationFor, artifactsFor } from "../src/demo/data/content";
import { issues } from "../src/demo/data/fixtures";
import { buildDemoDeepLink, parseDemoDeepLink } from "../src/demo/state/deepLinks";
import {
  clearPreferences,
  PREFERENCES_STORAGE_KEY,
  readPreferences,
  writePreferences,
} from "../src/demo/state/preferences";
import { applyDemoScenario, DEMO_SCENARIOS } from "../src/demo/state/scenarios";
import { createInitialState, reducer } from "../src/demo/state/store";
import { artifactDownloadSpec, copyText, downloadTextFile } from "../src/demo/utils/browserActions";
import { isValidBranchPattern } from "../src/demo/screens/SettingsScreen";

describe("functional browser actions", () => {
  it("copies text through the Clipboard API and exposes rejection", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    await copyText("synthetic artifact body");
    expect(writeText).toHaveBeenCalledWith("synthetic artifact body");

    writeText.mockRejectedValueOnce(new Error("permission denied"));
    await expect(copyText("blocked")).rejects.toThrow("permission denied");
  });

  it("creates and invokes a local text download with the requested filename and MIME type", () => {
    const createObjectUrl = vi.fn(() => "blob:synthetic-download");
    const revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectUrl });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function checkDownload(this: HTMLAnchorElement) {
        expect(this.download).toBe("evidence.md");
        expect(this.href).toBe("blob:synthetic-download");
      });

    downloadTextFile({
      filename: "evidence.md",
      mimeType: "text/markdown;charset=utf-8",
      contents: "# Synthetic evidence",
    });

    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    click.mockRestore();
  });

  it("assigns an issue-scoped artifact filename and appropriate MIME type", () => {
    const issue = issues.find((candidate) => candidate.key === "FIN-1150");
    expect(issue).toBeDefined();
    if (!issue) return;
    const artifacts = artifactsFor(issue);
    const jsonArtifact = artifacts.find((artifact) => artifact.type === "JSON");
    const markdownArtifact = artifacts.find((artifact) => artifact.type === "Markdown");
    expect(jsonArtifact).toBeDefined();
    expect(markdownArtifact).toBeDefined();
    if (!jsonArtifact || !markdownArtifact) return;

    expect(artifactDownloadSpec(issue.key, jsonArtifact)).toMatchObject({
      filename: `FIN-1150-${jsonArtifact.name}`,
      mimeType: "application/json;charset=utf-8",
      contents: jsonArtifact.body,
    });
    expect(artifactDownloadSpec(issue.key, markdownArtifact).mimeType).toBe(
      "text/markdown;charset=utf-8",
    );
  });
});

describe("deterministic exports", () => {
  it("exports the architecture summary as synchronized JSON and Markdown", () => {
    const json = JSON.parse(architectureSummaryJson()) as {
      classification?: string;
      planes?: unknown[];
    };
    expect(json.classification).toBe("synthetic_public_portfolio_content");
    expect(json.planes).toHaveLength(4);
    expect(architectureSummaryMarkdown()).toContain("## Control Plane");
    expect(architectureDownload("json").filename).toBe("ai-delivery-workbench-architecture.json");
    expect(architectureDownload("markdown").mimeType).toBe("text/markdown;charset=utf-8");
  });

  it("exports effective synthetic validation state as JSON and Markdown", () => {
    const issue = issues.find((candidate) => candidate.key === "FIN-1150");
    expect(issue).toBeDefined();
    if (!issue) return;
    const base = validationFor(issue);
    const pack = createValidationEvidencePack(issue, base, {
      decision: "Passed",
      evidenceStatus: "Complete",
      notes: [{ author: "Synthetic tester A", time: "just now", text: "Local note" }],
    });
    const json = validationEvidenceDownload(pack, "json");
    const markdown = validationEvidenceDownload(pack, "markdown");
    expect(json.filename).toBe("FIN-1150-synthetic-validation-evidence.json");
    expect(json.contents).toContain('"classification": "synthetic_demo_fixture"');
    expect(markdown.filename).toBe("FIN-1150-synthetic-validation-evidence.md");
    expect(markdown.contents).toContain("No external test system was contacted");
    expect(json.contents).toContain('"browserLocalTesterNoteCount": 1');
    expect(markdown.contents).toContain("1 browser-local tester note was excluded");
    expect(markdown.contents).not.toContain("Local note");
  });
});

describe("deep links, scenarios, reset, and harmless preferences", () => {
  it("parses validated screen, issue, artifact, scenario, and settings subview links", () => {
    expect(
      parseDemoDeepLink(
        new URL(
          "https://portfolio.invalid/demo/?screen=artifacts&issue=FIN-1150&artifact=spec.md&scenario=clean-walkthrough",
        ),
      ),
    ).toEqual({
      route: "artifacts",
      issueKey: "FIN-1150",
      artifactName: "spec.md",
      scenarioId: "clean-walkthrough",
    });
    expect(
      parseDemoDeepLink(new URL("https://portfolio.invalid/demo/?screen=settings&view=gov")),
    ).toMatchObject({ route: "settings", subview: "gov" });
    expect(
      parseDemoDeepLink(
        new URL("https://portfolio.invalid/demo/?screen=artifacts&issue=PRIVATE-1&artifact=x"),
      ),
    ).toEqual({ route: "artifacts" });
    expect(
      parseDemoDeepLink(
        new URL(
          "https://portfolio.invalid/demo/?screen=not-a-screen&issue=FIN-1150&artifact=spec.md&view=gov",
        ),
      ),
    ).toEqual({});
    expect(
      parseDemoDeepLink(
        new URL("https://portfolio.invalid/demo/?screen=queue&issue=FIN-1150&artifact=spec.md"),
      ),
    ).toEqual({ route: "queue" });
  });

  it("serializes only the current public demo selection", () => {
    const state = createInitialState();
    state.route = "artifacts";
    state.selectedKey = "FIN-1150";
    state.selectedArtifact = { "FIN-1150": "spec.md" };
    const url = buildDemoDeepLink(state, new URL("https://portfolio.invalid/demo/?walkthrough=1"));
    expect(url.searchParams.get("screen")).toBe("artifacts");
    expect(url.searchParams.get("issue")).toBe("FIN-1150");
    expect(url.searchParams.get("artifact")).toBe("spec.md");
    expect(url.searchParams.get("walkthrough")).toBe("1");
  });

  it("loads every named scenario from the same deterministic baseline", () => {
    expect(DEMO_SCENARIOS).toHaveLength(5);
    const ready = applyDemoScenario(createInitialState(), "ready-review");
    expect([ready.route, ready.selectedKey]).toEqual(["github", "FIN-1077"]);
    const failed = applyDemoScenario(createInitialState(), "failed-verification");
    expect(failed.valState["FIN-1301"]?.decision).toBe("Failed");
    const stale = applyDemoScenario(createInitialState(), "stale-downstream");
    expect(stale.issues["FIN-1198"]?.s).toContain("stale");
    const clean = applyDemoScenario(createInitialState(), "clean-walkthrough");
    expect(clean.issues["FIN-1150"]?.s).toEqual([
      "done",
      "done",
      "done",
      "done",
      "done",
      "done",
      "done",
      "review",
    ]);
  });

  it("returns all reducer-backed demo state to the exact baseline", () => {
    const modified = applyDemoScenario(createInitialState(), "clean-walkthrough");
    modified.filters.search = "changed";
    modified.artifactReviews["FIN-1150:spec.md"] = "Changes requested";
    const reset = reducer(modified, { type: "RESET" });
    expect(reset).toEqual(createInitialState());
  });

  it("versions, reads, and clears only the harmless theme preference", () => {
    localStorage.clear();
    writePreferences(localStorage, "dark");
    expect(JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? "{}")).toEqual({
      version: 1,
      theme: "dark",
    });
    expect(readPreferences(localStorage).theme).toBe("dark");
    clearPreferences(localStorage);
    expect(readPreferences(localStorage).theme).toBe("light");
  });

  it("performs real local branch-pattern validation", () => {
    expect(isValidBranchPattern("feature/{issueKey}-{slug}")).toBe(true);
    expect(isValidBranchPattern("feature/{issueKey}")).toBe(false);
    expect(isValidBranchPattern("release/{issueKey}-{slug}")).toBe(false);
  });
});
