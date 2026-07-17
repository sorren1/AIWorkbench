import { resolve } from "node:path";

import { sha256Bytes } from "./security";
import { normalizeCapturedOutput, runProcess } from "./process";
import type {
  SandboxCommandReceipt,
  SandboxExecutionRequest,
  SandboxExecutionResult,
  SandboxProvider,
  LocalDockerAvailability,
} from "./contracts";

const DEFAULT_IMAGE = "ai-delivery-workbench-sandbox:node-22.23.1";
const SANDBOX_BUILD_CONTEXT = resolve(import.meta.dirname, "../../ops/sandbox");
const CONTAINER_USER = "65532:65532";

function safeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, "-")
    .slice(0, 58);
}

export class LocalDockerSandboxProvider implements SandboxProvider {
  readonly kind = "LOCAL_DOCKER" as const;

  constructor(private readonly image = DEFAULT_IMAGE) {}

  async inspect(): Promise<LocalDockerAvailability> {
    const version = await runProcess({
      executable: "docker",
      args: ["version", "--format", "{{.Client.Version}}|{{.Server.Version}}"],
      timeoutMs: 10_000,
    });
    if (version.exitCode !== 0) {
      return {
        provider: "LOCAL_DOCKER",
        available: false,
        dockerClientVersion: null,
        dockerServerVersion: null,
        image: this.image,
        imageDigest: null,
        detail: normalizeCapturedOutput(version.stderr || version.stdout),
      };
    }
    const [client = null, server = null] = normalizeCapturedOutput(version.stdout).split("|");
    const image = await runProcess({
      executable: "docker",
      args: [
        "image",
        "inspect",
        this.image,
        "--format",
        "{{if .RepoDigests}}{{index .RepoDigests 0}}{{else}}{{.Id}}{{end}}",
      ],
      timeoutMs: 10_000,
    });
    const imageDigest = image.exitCode === 0 ? normalizeCapturedOutput(image.stdout) : null;
    return {
      provider: "LOCAL_DOCKER",
      available: imageDigest !== null && imageDigest.length > 0,
      dockerClientVersion: client,
      dockerServerVersion: server,
      image: this.image,
      imageDigest,
      detail:
        imageDigest === null
          ? `Docker Engine is available, but ${this.image} has not been built.`
          : "Docker Engine and the exact sandbox image are available.",
    };
  }

  async prepare(): Promise<LocalDockerAvailability> {
    const current = await this.inspect();
    if (current.available || current.dockerClientVersion === null) return current;
    const build = await runProcess({
      executable: "docker",
      args: ["build", "--tag", this.image, SANDBOX_BUILD_CONTEXT],
      timeoutMs: 180_000,
      maxOutputBytes: 2 * 1024 * 1024,
    });
    if (build.exitCode !== 0) {
      return {
        ...current,
        detail: `Docker image build failed: ${normalizeCapturedOutput(build.stderr || build.stdout)}`,
      };
    }
    return this.inspect();
  }

  async execute(request: SandboxExecutionRequest): Promise<SandboxExecutionResult> {
    const availability = await this.inspect();
    if (!availability.available || !availability.imageDigest) {
      throw new Error(`Local Docker sandbox unavailable: ${availability.detail}`);
    }
    const receipts: SandboxCommandReceipt[] = [];
    const cleanupAttempts: string[] = [];
    for (const command of request.commands) {
      const containerName = safeName(`adw-${request.runId}-${request.phase}-${command.id}`);
      const startedAt = new Date().toISOString();
      const dockerArguments = [
        "run",
        "--rm",
        "--name",
        containerName,
        "--label",
        `ai-delivery-workbench.run=${request.runId}`,
        "--network",
        "none",
        "--user",
        CONTAINER_USER,
        "--read-only",
        "--tmpfs",
        `/tmp:rw,noexec,nosuid,size=${request.limits.tmpfsMb}m`,
        "--cap-drop",
        "ALL",
        "--security-opt",
        "no-new-privileges:true",
        "--cpus",
        String(request.limits.cpuCount),
        "--memory",
        `${request.limits.memoryMb}m`,
        "--memory-swap",
        `${request.limits.memoryMb}m`,
        "--pids-limit",
        String(request.limits.processLimit),
        "--workdir",
        "/workspace",
        "--mount",
        `type=bind,src=${request.workspaceRoot},dst=/workspace,readonly`,
        "--env",
        "HOME=/tmp",
        "--env",
        "TMPDIR=/tmp",
        availability.imageDigest,
        ...command.argv,
      ];
      const result = await runProcess({
        executable: "docker",
        args: dockerArguments,
        timeoutMs: request.limits.timeoutMs,
        maxOutputBytes: 2 * 1024 * 1024,
      });
      if (result.timedOut) {
        const cleanup = await runProcess({
          executable: "docker",
          args: ["rm", "--force", containerName],
          timeoutMs: 10_000,
        });
        cleanupAttempts.push(
          `${containerName}:${cleanup.exitCode === 0 ? "removed" : "already-removed-or-unavailable"}`,
        );
      }
      const replacements = [request.workspaceRoot];
      const stdout = normalizeCapturedOutput(result.stdout, replacements);
      const stderr = normalizeCapturedOutput(result.stderr, replacements);
      receipts.push({
        id: command.id,
        argv: command.argv,
        containerName,
        startedAt,
        durationMs: result.durationMs,
        exitCode: result.exitCode,
        timedOut: result.timedOut,
        stdout,
        stderr,
        stdoutSha256: sha256Bytes(stdout),
        stderrSha256: sha256Bytes(stderr),
        outputTruncated: result.outputTruncated,
      });
    }
    return {
      provider: "LOCAL_DOCKER",
      image: availability.image,
      imageDigest: availability.imageDigest,
      networkMode: "none",
      user: CONTAINER_USER,
      readOnlyRootFilesystem: true,
      noNewPrivileges: true,
      commands: receipts,
      cleanupAttempts,
    };
  }

  async cleanup(runId: string): Promise<readonly string[]> {
    const listed = await runProcess({
      executable: "docker",
      args: ["ps", "--all", "--quiet", "--filter", `label=ai-delivery-workbench.run=${runId}`],
      timeoutMs: 10_000,
    });
    const ids = normalizeCapturedOutput(listed.stdout)
      .split("\n")
      .filter((id) => id.length > 0);
    const attempts: string[] = [];
    for (const id of ids) {
      const removed = await runProcess({
        executable: "docker",
        args: ["rm", "--force", id],
        timeoutMs: 10_000,
      });
      attempts.push(`${id}:${removed.exitCode === 0 ? "removed" : "remove-failed"}`);
    }
    return attempts;
  }
}

export const defaultDockerImage = DEFAULT_IMAGE;
