import type { IconName } from "../../shared/Icon";

export type Route =
  | "queue"
  | "issue"
  | "artifacts"
  | "github"
  | "validation"
  | "control-plane"
  | "architecture"
  | "settings";

export type StageId =
  "seed" | "intake" | "spec" | "plan" | "targets" | "implement" | "verify" | "review";

export type StageStatus = "done" | "ready" | "run" | "fail" | "stale" | "review" | "none";
export type Tone = "safe" | "accent" | "danger" | "warn" | "neutral" | "secure" | "info";
export type Risk = "Low" | "Medium" | "High";
export type Surface = "Angular" | "C#/.NET" | "Oracle" | "Full Stack" | "AI";
export type Lifecycle =
  | "Backlog"
  | "Intake"
  | "Spec"
  | "Planning"
  | "Implementation"
  | "Verification"
  | "Review Ready"
  | "Blocked";

export type Meta = {
  product: string;
  subtitle: string;
  disclaimer: string;
  aboutNote: string;
  professionalContext: string;
  version: string;
  user: { name: string; role: string; initials: string };
};

export type StageDefinition = {
  id: StageId;
  name: string;
  icon: IconName;
  desc: string;
};

export type StatusDefinition = { label: string; tone: Tone; icon: IconName };
export type RiskDefinition = { tone: Tone; icon: IconName };

export type IssueFlags = {
  hasPR?: boolean;
  needsReview?: boolean;
  failedVerification?: boolean;
  staleDownstream?: boolean;
  primary?: boolean;
};

export type Issue = {
  key: string;
  title: string;
  domain: string;
  surface: Surface;
  lifecycle: Lifecycle;
  risk: Risk;
  branch: string;
  pr: number | null;
  prStatus: string;
  lastRun: string;
  artifacts: number;
  assignee: string;
  reviewer: string;
  tester: string;
  s: StageStatus[];
  next: { label: string; target: Route };
  flags: IssueFlags;
};

export type RepositorySetting = { name: string; role: string; default: string };
export type GovernanceSetting = { id: string; label: string; on: boolean; locked?: boolean };

export type WorkbenchSettings = {
  jira: {
    baseUrl: string;
    projectKey: string;
    queryMode: string;
    jql: string;
    status: string;
  };
  github: {
    org: string;
    repos: RepositorySetting[];
    branchPattern: string;
    prTarget: string;
    status: string;
  };
  ai: {
    primary: string;
    secondary: string;
    design: string;
    maxRun: string;
    humanApprovalBeforePR: boolean;
    autoMerge: boolean;
    autoDeploy: boolean;
  };
  stack: Record<string, string>;
  governance: GovernanceSetting[];
};

export type McpServer = {
  name: string;
  icon: IconName;
  status: string;
  purpose: string;
  boundary: string;
  allowed: string[];
  disallowed: string[];
};

export type ArchitecturePlane = {
  id: string;
  name: string;
  icon: IconName;
  tone: Tone;
  tagline: string;
  items: string[];
};

export type Architecture = {
  planes: ArchitecturePlane[];
  productionNote: string;
  reviewTopics: string[];
};

export type GeneratedStage = StageDefinition & {
  status: StageStatus;
  promptVersion: string;
  startedAt: string;
  completedAt: string;
  artifacts: string[];
  logsAvailable: boolean;
  reviewerActionRequired: boolean;
};

/* excerpt:start:artifact-provenance */
export type ArtifactType = "JSON" | "Markdown";
export type ArtifactMeta = { type: ArtifactType; stage: StageId; risk: Risk };
export type Artifact = {
  id: string;
  name: string;
  type: ArtifactType;
  stage: string;
  stageId: StageId;
  timestamp: string;
  reviewStatus: string;
  risk: Risk;
  lang: "json" | "md";
  body: string;
};
/* excerpt:end:artifact-provenance */

/* excerpt:start:changed-file-classification */
export type PullRequestFile = {
  path: string;
  category: string;
  add: number;
  del: number;
  status: "expected" | "unexpected";
};
/* excerpt:end:changed-file-classification */
export type PullRequestCheck = { name: string; status: string; detail: string };
export type PullRequestReviewer = { name: string; role: string; state: string };
export type PullRequestChecklistItem = { label: string; done: boolean };
export type PullRequestData = {
  number: number | null;
  title: string;
  status: string;
  branch: string;
  target: string;
  author: string;
  created: string;
  commits: number;
  files: PullRequestFile[];
  unexpected: number;
  unresolvedComments: number;
  summary: string;
  checks: PullRequestCheck[];
  reviewers: PullRequestReviewer[];
  checklist: PullRequestChecklistItem[];
  mergeReady: boolean;
  empty?: boolean;
};

export type ValidationStatus =
  "Passed" | "In Progress" | "Failed" | "Blocked" | "Not Started" | "Pending" | "Complete";
export type AcceptanceCriterion = { id: string; text: string; status: ValidationStatus };
export type ValidationScenario = { name: string; status: ValidationStatus; note: string };
export type TesterNote = { author: string; time: string; text: string };
export type ValidationData = {
  decision: ValidationStatus;
  branch: string;
  commitSha: string;
  evidenceStatus: ValidationStatus;
  acceptance: AcceptanceCriterion[];
  scenarios: ValidationScenario[];
  oracleAssumptions: string[];
  apiNotes: string[];
  uiNotes: string[];
  a11y: ValidationStatus;
  security: ValidationStatus;
  testerNotes: TesterNote[];
  empty?: boolean;
};
