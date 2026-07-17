import { artifactsFor } from "../data/content";
import { issues } from "../data/fixtures";
import type { Route } from "../data/types";
import { isDemoScenarioId, type DemoScenarioId } from "./scenarios";
import type { WorkbenchState } from "./store";

const ROUTES: readonly Route[] = [
  "queue",
  "issue",
  "artifacts",
  "github",
  "validation",
  "approvals",
  "control-plane",
  "trace",
  "architecture",
  "settings",
];
export const SETTINGS_VIEWS = ["jira", "github", "ai", "mcp", "stack", "gov"] as const;
const ISSUE_ROUTES: readonly Route[] = ["issue", "artifacts", "github", "validation"];

export type DemoDeepLink = {
  readonly route?: Route;
  readonly issueKey?: string;
  readonly artifactName?: string;
  readonly subview?: string;
  readonly scenarioId?: DemoScenarioId;
};

function isRoute(value: string | null): value is Route {
  return ROUTES.some((route) => route === value);
}

export function parseDemoDeepLink(url: URL): DemoDeepLink {
  const screen = url.searchParams.get("screen");
  const issueParam = url.searchParams.get("issue");
  const artifactParam = url.searchParams.get("artifact");
  const viewParam = url.searchParams.get("view");
  const scenarioParam = url.searchParams.get("scenario");
  const issue = issues.find((candidate) => candidate.key === issueParam);
  const route = isRoute(screen) ? screen : undefined;
  const artifact =
    route === "artifacts" && issue && artifactParam
      ? artifactsFor(issue).find((candidate) => candidate.name === artifactParam)
      : undefined;
  const subview =
    route === "settings" && SETTINGS_VIEWS.some((candidate) => candidate === viewParam)
      ? viewParam
      : undefined;

  return {
    ...(route ? { route } : {}),
    ...(issue ? { issueKey: issue.key } : {}),
    ...(artifact ? { artifactName: artifact.name } : {}),
    ...(subview ? { subview } : {}),
    ...(isDemoScenarioId(scenarioParam) ? { scenarioId: scenarioParam } : {}),
  };
}

export function buildDemoDeepLink(state: WorkbenchState, currentUrl: URL): URL {
  const url = new URL(currentUrl.toString());
  if (state.route === "queue") url.searchParams.delete("screen");
  else url.searchParams.set("screen", state.route);

  if (ISSUE_ROUTES.includes(state.route)) url.searchParams.set("issue", state.selectedKey);
  else url.searchParams.delete("issue");

  const artifact = state.selectedArtifact[state.selectedKey];
  if (state.route === "artifacts" && artifact) url.searchParams.set("artifact", artifact);
  else url.searchParams.delete("artifact");

  if (state.route === "settings" && state.subview && state.subview !== "jira") {
    url.searchParams.set("view", state.subview);
  } else {
    url.searchParams.delete("view");
  }

  if (state.scenarioId === "baseline") url.searchParams.delete("scenario");
  else url.searchParams.set("scenario", state.scenarioId);
  return url;
}
