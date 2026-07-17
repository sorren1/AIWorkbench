export type SandboxProviderKind = "LOCAL_DOCKER" | "E2B";

export type SandboxCommandId = "tool-versions" | "pre-test" | "build" | "test";

export type SandboxLimits = {
  readonly cpuCount: number;
  readonly memoryMb: number;
  readonly processLimit: number;
  readonly timeoutMs: number;
  readonly tmpfsMb: number;
};

export type SandboxCommand = {
  readonly id: SandboxCommandId;
  readonly argv: readonly [string, ...string[]];
};

export type SandboxUpload = {
  readonly path: string;
  readonly content: string;
  readonly sha256: string;
  readonly classification: "SYNTHETIC_TOY_REPOSITORY" | "APPROVED_GENERATED_ARTIFACT";
};

export type SandboxCommandReceipt = {
  readonly id: SandboxCommandId;
  readonly argv: readonly string[];
  readonly containerName: string;
  readonly startedAt: string;
  readonly durationMs: number;
  readonly exitCode: number | null;
  readonly timedOut: boolean;
  readonly stdout: string;
  readonly stderr: string;
  readonly stdoutSha256: string;
  readonly stderrSha256: string;
  readonly outputTruncated: boolean;
};

export type SandboxExecutionRequest = {
  readonly runId: string;
  readonly phase: "before-patch" | "after-patch";
  readonly workspaceRoot: string;
  readonly uploads: readonly SandboxUpload[];
  readonly commands: readonly SandboxCommand[];
  readonly limits: SandboxLimits;
};

export type LocalDockerExecutionResult = {
  readonly provider: "LOCAL_DOCKER";
  readonly image: string;
  readonly imageDigest: string;
  readonly networkMode: "none";
  readonly user: string;
  readonly readOnlyRootFilesystem: true;
  readonly noNewPrivileges: true;
  readonly commands: readonly SandboxCommandReceipt[];
  readonly cleanupAttempts: readonly string[];
};

export type E2BExecutionResult = {
  readonly provider: "E2B";
  readonly image: string;
  readonly imageDigest: null;
  readonly networkMode: "deny-all-verified";
  readonly user: string;
  readonly readOnlyRootFilesystem: null;
  readonly noNewPrivileges: null;
  readonly commands: readonly SandboxCommandReceipt[];
  readonly cleanupAttempts: readonly string[];
  readonly providerMetadata: {
    readonly sdkVersion: string;
    readonly sandboxId: string;
    readonly templateId: string;
    readonly envdVersion: string;
    readonly cpuCount: number;
    readonly memoryMb: number;
    readonly sandboxTimeoutMs: number;
    readonly lifecycleOnTimeout: "kill";
    readonly allowInternetAccess: false;
    readonly networkVerification: "OUTBOUND_PROBE_BLOCKED";
    readonly uploadedFileCount: number;
    readonly uploadedBytes: number;
    readonly uploadedTreeDigest: string;
    readonly remoteTreeDigest: string;
    readonly remoteChangedFiles: readonly string[];
    readonly cleanupVerified: true;
  };
};

export type SandboxExecutionResult = LocalDockerExecutionResult | E2BExecutionResult;

export type LocalDockerAvailability = {
  readonly provider: "LOCAL_DOCKER";
  readonly available: boolean;
  readonly dockerClientVersion: string | null;
  readonly dockerServerVersion: string | null;
  readonly image: string;
  readonly imageDigest: string | null;
  readonly detail: string;
};

export type E2BAvailability = {
  readonly provider: "E2B";
  readonly available: boolean;
  readonly sdkVersion: string;
  readonly template: string;
  readonly apiKeyConfigured: boolean;
  readonly detail: string;
};

export type SandboxAvailability = LocalDockerAvailability | E2BAvailability;

/**
 * Executes repository-owned commands in an isolated runtime. Implementations
 * receive a controller-created workspace and an explicit synthetic upload
 * manifest; they never accept arbitrary visitor input.
 */
export type SandboxProvider = {
  readonly kind: SandboxProviderKind;
  inspect(): Promise<SandboxAvailability>;
  prepare(): Promise<SandboxAvailability>;
  execute(request: SandboxExecutionRequest): Promise<SandboxExecutionResult>;
  cleanup(runId: string): Promise<readonly string[]>;
};
