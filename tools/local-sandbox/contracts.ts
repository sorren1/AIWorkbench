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
  readonly commands: readonly SandboxCommand[];
  readonly limits: SandboxLimits;
};

export type SandboxExecutionResult = {
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

export type SandboxAvailability = {
  readonly available: boolean;
  readonly dockerClientVersion: string | null;
  readonly dockerServerVersion: string | null;
  readonly image: string;
  readonly imageDigest: string | null;
  readonly detail: string;
};

/**
 * Executes repository-owned commands in an isolated local runtime. Implementations
 * receive a controller-created workspace and never accept arbitrary visitor input.
 */
export type SandboxProvider = {
  readonly kind: "LOCAL_DOCKER";
  inspect(): Promise<SandboxAvailability>;
  prepare(): Promise<SandboxAvailability>;
  execute(request: SandboxExecutionRequest): Promise<SandboxExecutionResult>;
  cleanup(runId: string): Promise<readonly string[]>;
};
