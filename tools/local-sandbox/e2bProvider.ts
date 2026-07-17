import {
  CommandExitError,
  FileType,
  Sandbox,
  TimeoutError,
  type CommandStartOpts,
  type SandboxInfo,
  type SandboxOpts,
} from "e2b";

import { normalizeCapturedOutput } from "./process";
import { sha256Bytes } from "./security";
import type {
  E2BExecutionResult,
  SandboxAvailability,
  SandboxCommandReceipt,
  SandboxExecutionRequest,
  SandboxProvider,
  SandboxUpload,
} from "./contracts";

const SDK_VERSION = "2.34.0";
const DEFAULT_TEMPLATE = "base";
const SANDBOX_TTL_MS = 120_000;
const REMOTE_ROOT = "/home/user";
const REMOTE_WORKSPACE = `${REMOTE_ROOT}/workspace`;
const MAX_CAPTURE_BYTES = 2 * 1024 * 1024;
const MAX_UPLOAD_FILES = 128;
const MAX_UPLOAD_BYTES = 512 * 1024;
const NETWORK_PROBE =
  "node -e \"fetch('https://example.com',{signal:AbortSignal.timeout(3000)}).then(()=>process.exit(42)).catch(()=>process.exit(0))\"";

type E2BCommandResult = {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
};

type E2BCommandOptions = Pick<
  CommandStartOpts,
  "cwd" | "onStderr" | "onStdout" | "requestTimeoutMs" | "timeoutMs"
>;

type E2BEntry = {
  readonly path: string;
  readonly type?: "file" | "dir";
  readonly symlinkTarget?: string | undefined;
};

export type E2BSandboxHandle = {
  readonly sandboxId: string;
  readonly commands: {
    run(command: string, options: E2BCommandOptions): Promise<E2BCommandResult>;
  };
  readonly files: {
    writeFiles(
      files: readonly { readonly path: string; readonly data: string }[],
    ): Promise<unknown>;
    read(path: string): Promise<string>;
    list(path: string): Promise<readonly E2BEntry[]>;
  };
  getInfo(): Promise<SandboxInfo>;
  isRunning(): Promise<boolean>;
  kill(): Promise<boolean>;
};

export type E2BSandboxFactory = {
  create(options: SandboxOpts): Promise<E2BSandboxHandle>;
  listByRunId(runId: string): Promise<readonly string[]>;
  killById(sandboxId: string): Promise<boolean>;
};

function defaultFactory(): E2BSandboxFactory {
  return {
    async create(options) {
      const sandbox = await Sandbox.create(options);
      return {
        sandboxId: sandbox.sandboxId,
        commands: sandbox.commands,
        files: {
          writeFiles: (files) => sandbox.files.writeFiles([...files]),
          read: (path) => sandbox.files.read(path),
          list: (path) => sandbox.files.list(path),
        },
        getInfo: () => sandbox.getInfo(),
        isRunning: () => sandbox.isRunning(),
        kill: () => sandbox.kill(),
      };
    },
    async listByRunId(runId) {
      const paginator = Sandbox.list({
        query: {
          metadata: { project: "ai-delivery-workbench", runId },
          state: ["running", "paused"],
        },
        limit: 100,
      });
      return (await paginator.nextItems()).map((sandbox) => sandbox.sandboxId);
    },
    killById: (sandboxId) => Sandbox.kill(sandboxId),
  };
}

function appendBounded(current: string, value: string): { value: string; truncated: boolean } {
  const combined = current + value;
  if (Buffer.byteLength(combined, "utf8") <= MAX_CAPTURE_BYTES) {
    return { value: combined, truncated: false };
  }
  return {
    value: Buffer.from(combined, "utf8").subarray(0, MAX_CAPTURE_BYTES).toString("utf8"),
    truncated: true,
  };
}

function safeUploadPath(path: string): string {
  if (
    path.length === 0 ||
    path.includes("\\") ||
    path.startsWith("/") ||
    path.split("/").some((part) => part === "" || part === "." || part === "..") ||
    (!path.startsWith("workspace/") && !path.startsWith("artifacts/"))
  ) {
    throw new Error(`E2B rejected unsafe upload path: ${path}`);
  }
  return `${REMOTE_ROOT}/${path}`;
}

function validateUpload(file: SandboxUpload): string {
  const remotePath = safeUploadPath(file.path);
  const expectedClassification = file.path.startsWith("workspace/")
    ? "SYNTHETIC_TOY_REPOSITORY"
    : "APPROVED_GENERATED_ARTIFACT";
  if (file.classification !== expectedClassification) {
    throw new Error(`E2B rejected upload classification for ${file.path}.`);
  }
  if (sha256Bytes(file.content) !== file.sha256) {
    throw new Error(`E2B rejected upload hash mismatch for ${file.path}.`);
  }
  return remotePath;
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

function commandLine(argv: readonly string[]): string {
  return argv.map(shellQuote).join(" ");
}

function digestUploads(uploads: readonly SandboxUpload[]): string {
  return sha256Bytes(
    JSON.stringify(
      [...uploads]
        .map(({ path, sha256 }) => ({ path, sha256 }))
        .sort((left, right) => left.path.localeCompare(right.path)),
    ),
  );
}

async function listFiles(
  sandbox: E2BSandboxHandle,
  directory: string,
  files: string[],
): Promise<void> {
  const entries = [...(await sandbox.files.list(directory))].sort((left, right) =>
    left.path.localeCompare(right.path),
  );
  for (const entry of entries) {
    if (entry.symlinkTarget) throw new Error(`E2B rejected remote symbolic link: ${entry.path}`);
    if (entry.type === FileType.DIR) {
      await listFiles(sandbox, entry.path, files);
    } else if (entry.type === FileType.FILE) {
      files.push(entry.path);
    } else {
      throw new Error(`E2B rejected unsupported remote entry: ${entry.path}`);
    }
  }
}

async function remoteSnapshot(
  sandbox: E2BSandboxHandle,
): Promise<readonly { readonly path: string; readonly sha256: string }[]> {
  const paths: string[] = [];
  for (const directory of [`${REMOTE_ROOT}/workspace`, `${REMOTE_ROOT}/artifacts`]) {
    await listFiles(sandbox, directory, paths);
  }
  const files = await Promise.all(
    paths.map(async (path) => ({
      path: path.slice(REMOTE_ROOT.length + 1),
      sha256: sha256Bytes(await sandbox.files.read(path)),
    })),
  );
  return files.sort((left, right) => left.path.localeCompare(right.path));
}

function changedRemoteFiles(
  uploads: readonly SandboxUpload[],
  remote: readonly { readonly path: string; readonly sha256: string }[],
): readonly string[] {
  const expected = new Map(uploads.map((file) => [file.path, file.sha256]));
  const observed = new Map(remote.map((file) => [file.path, file.sha256]));
  return [...new Set([...expected.keys(), ...observed.keys()])]
    .filter((path) => expected.get(path) !== observed.get(path))
    .sort();
}

async function runCommand(
  sandbox: E2BSandboxHandle,
  request: SandboxExecutionRequest,
  command: SandboxExecutionRequest["commands"][number],
): Promise<SandboxCommandReceipt> {
  const startedAt = new Date().toISOString();
  const started = performance.now();
  let stdout = "";
  let stderr = "";
  let outputTruncated = false;
  let exitCode: number | null = null;
  let timedOut = false;
  const onStdout = (data: string): void => {
    const appended = appendBounded(stdout, data);
    stdout = appended.value;
    outputTruncated ||= appended.truncated;
  };
  const onStderr = (data: string): void => {
    const appended = appendBounded(stderr, data);
    stderr = appended.value;
    outputTruncated ||= appended.truncated;
  };
  try {
    const result = await sandbox.commands.run(commandLine(command.argv), {
      cwd: REMOTE_WORKSPACE,
      timeoutMs: request.limits.timeoutMs,
      requestTimeoutMs: request.limits.timeoutMs + 5_000,
      onStdout,
      onStderr,
    });
    exitCode = result.exitCode;
    if (stdout.length === 0) stdout = result.stdout;
    if (stderr.length === 0) stderr = result.stderr;
  } catch (error) {
    if (error instanceof CommandExitError) {
      exitCode = error.exitCode;
      if (stdout.length === 0) stdout = error.stdout;
      if (stderr.length === 0) stderr = error.stderr;
    } else if (error instanceof TimeoutError) {
      timedOut = true;
    } else {
      throw error;
    }
  }
  stdout = normalizeCapturedOutput(stdout);
  stderr = normalizeCapturedOutput(stderr);
  return {
    id: command.id,
    argv: command.argv,
    containerName: `e2b:${sandbox.sandboxId}`,
    startedAt,
    durationMs: Math.max(0, Math.round(performance.now() - started)),
    exitCode,
    timedOut,
    stdout,
    stderr,
    stdoutSha256: sha256Bytes(stdout),
    stderrSha256: sha256Bytes(stderr),
    outputTruncated,
  };
}

async function verifyNetworkDenied(sandbox: E2BSandboxHandle, timeoutMs: number): Promise<void> {
  const info = await sandbox.getInfo();
  if (info.allowInternetAccess !== false) {
    throw new Error("E2B did not report allowInternetAccess=false; refusing an isolation claim.");
  }
  try {
    const result = await sandbox.commands.run(NETWORK_PROBE, {
      cwd: REMOTE_WORKSPACE,
      timeoutMs: Math.min(timeoutMs, 5_000),
      requestTimeoutMs: Math.min(timeoutMs, 5_000) + 5_000,
    });
    if (result.exitCode !== 0) throw new Error("E2B outbound-denial probe returned unexpectedly.");
  } catch (error) {
    if (error instanceof CommandExitError && error.exitCode === 42) {
      throw new Error("E2B outbound-denial probe reached the public internet.", {
        cause: error,
      });
    }
    throw error;
  }
}

export class E2BSandboxProvider implements SandboxProvider {
  readonly kind = "E2B" as const;
  private readonly activeByRun = new Map<string, Set<string>>();

  constructor(
    private readonly factory: E2BSandboxFactory = defaultFactory(),
    private readonly template = DEFAULT_TEMPLATE,
    private readonly apiKeyConfigured = () => Boolean(process.env.E2B_API_KEY),
  ) {}

  inspect(): Promise<SandboxAvailability> {
    const configured = this.apiKeyConfigured();
    return Promise.resolve({
      provider: "E2B",
      available: configured,
      sdkVersion: SDK_VERSION,
      template: this.template,
      apiKeyConfigured: configured,
      detail: configured
        ? "E2B_API_KEY is configured; live availability is checked only by an explicit run."
        : "E2B_API_KEY is not configured. The optional provider is implemented but not live-validated.",
    });
  }

  prepare(): Promise<SandboxAvailability> {
    return this.inspect();
  }

  async execute(request: SandboxExecutionRequest): Promise<E2BExecutionResult> {
    if (!this.apiKeyConfigured()) {
      throw new Error(
        "E2B provider requires E2B_API_KEY. Local Docker remains the default provider.",
      );
    }
    if (request.uploads.length === 0 || request.uploads.length > MAX_UPLOAD_FILES) {
      throw new Error(`E2B upload count must be between 1 and ${MAX_UPLOAD_FILES}.`);
    }
    if (new Set(request.uploads.map((file) => file.path)).size !== request.uploads.length) {
      throw new Error("E2B rejected duplicate upload paths.");
    }
    const uploadedBytes = request.uploads.reduce(
      (total, file) => total + Buffer.byteLength(file.content, "utf8"),
      0,
    );
    if (uploadedBytes > MAX_UPLOAD_BYTES) {
      throw new Error(`E2B upload exceeds the ${MAX_UPLOAD_BYTES}-byte fixture limit.`);
    }
    const remoteFiles = request.uploads.map((file) => ({
      path: validateUpload(file),
      data: file.content,
    }));
    const sandbox = await this.factory.create({
      template: this.template,
      timeoutMs: SANDBOX_TTL_MS,
      secure: true,
      allowInternetAccess: false,
      network: { denyOut: ["0.0.0.0/0"], allowPublicTraffic: false },
      lifecycle: { onTimeout: "kill", autoResume: false },
      metadata: {
        project: "ai-delivery-workbench",
        runId: request.runId,
        phase: request.phase,
        classification: "synthetic-public-fixture",
      },
    });
    const active = this.activeByRun.get(request.runId) ?? new Set<string>();
    active.add(sandbox.sandboxId);
    this.activeByRun.set(request.runId, active);
    const cleanupAttempts: string[] = [];
    let cleanupVerified: boolean;
    let info: SandboxInfo | undefined;
    let receipts: SandboxCommandReceipt[] = [];
    let remote: readonly { readonly path: string; readonly sha256: string }[];
    try {
      await sandbox.files.writeFiles(remoteFiles);
      await verifyNetworkDenied(sandbox, request.limits.timeoutMs);
      info = await sandbox.getInfo();
      for (const command of request.commands) {
        receipts = [...receipts, await runCommand(sandbox, request, command)];
      }
      remote = await remoteSnapshot(sandbox);
      const changed = changedRemoteFiles(request.uploads, remote);
      if (changed.length > 0) {
        throw new Error(`E2B remote workspace changed unexpectedly: ${changed.join(", ")}`);
      }
    } finally {
      let killConfirmed: boolean;
      try {
        const killed = await sandbox.kill();
        killConfirmed = killed;
        cleanupAttempts.push(`${sandbox.sandboxId}:${killed ? "killed" : "already-absent"}`);
      } catch (error) {
        cleanupAttempts.push(
          `${sandbox.sandboxId}:kill-error:${error instanceof Error ? error.message : "unknown"}`,
        );
        const fallback = await this.factory.killById(sandbox.sandboxId).catch(() => false);
        killConfirmed = fallback;
        cleanupAttempts.push(`${sandbox.sandboxId}:fallback-${fallback ? "killed" : "failed"}`);
      }
      cleanupVerified = killConfirmed;
      try {
        const running = await sandbox.isRunning();
        cleanupVerified = !running;
        cleanupAttempts.push(
          `${sandbox.sandboxId}:${running ? "still-running" : "inactive-verified"}`,
        );
      } catch (error) {
        cleanupAttempts.push(
          `${sandbox.sandboxId}:status-unavailable:${error instanceof Error ? error.message : "unknown"}`,
        );
      }
      if (cleanupVerified) active.delete(sandbox.sandboxId);
    }
    if (!cleanupVerified)
      throw new Error(`E2B sandbox cleanup could not be verified: ${sandbox.sandboxId}`);
    if (!info) throw new Error("E2B sandbox metadata was not captured.");
    const uploadedTreeDigest = digestUploads(request.uploads);
    const remoteTreeDigest = sha256Bytes(JSON.stringify(remote));
    return {
      provider: "E2B",
      image: this.template,
      imageDigest: null,
      networkMode: "deny-all-verified",
      user: "user",
      readOnlyRootFilesystem: null,
      noNewPrivileges: null,
      commands: receipts,
      cleanupAttempts,
      providerMetadata: {
        sdkVersion: SDK_VERSION,
        sandboxId: sandbox.sandboxId,
        templateId: info.templateId,
        envdVersion: info.envdVersion,
        cpuCount: info.cpuCount,
        memoryMb: info.memoryMB,
        sandboxTimeoutMs: SANDBOX_TTL_MS,
        lifecycleOnTimeout: "kill",
        allowInternetAccess: false,
        networkVerification: "OUTBOUND_PROBE_BLOCKED",
        uploadedFileCount: request.uploads.length,
        uploadedBytes,
        uploadedTreeDigest,
        remoteTreeDigest,
        remoteChangedFiles: [],
        cleanupVerified,
      },
    };
  }

  async cleanup(runId: string): Promise<readonly string[]> {
    const known = this.activeByRun.get(runId) ?? new Set<string>();
    const attempts: string[] = [];
    const discovered = await this.factory.listByRunId(runId).catch((error: unknown) => {
      attempts.push(
        `discovery-error:${error instanceof Error ? error.message : "unknown cleanup error"}`,
      );
      return [];
    });
    const ids = [...new Set([...known, ...discovered])].sort();
    for (const id of ids) {
      const killed = await this.factory.killById(id).catch(() => false);
      attempts.push(`${id}:${killed ? "killed" : "already-absent-or-kill-failed"}`);
      if (killed) known.delete(id);
    }
    if (known.size === 0) this.activeByRun.delete(runId);
    return attempts;
  }

  activeSandboxIds(): readonly string[] {
    return [...this.activeByRun.values()].flatMap((ids) => [...ids]).sort();
  }
}

export const e2bProviderSdkVersion = SDK_VERSION;
export const e2bSandboxTimeoutMs = SANDBOX_TTL_MS;
