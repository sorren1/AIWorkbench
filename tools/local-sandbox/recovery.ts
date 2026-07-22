import { lstat, mkdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

import { z } from "zod";

import type { SandboxProvider, SandboxProviderKind } from "./contracts";

const recoveryStateSchema = z.object({
  schemaVersion: z.literal(1),
  classification: z.literal("LOCAL_SANDBOX_RECOVERY_STATE"),
  runId: z.string().regex(/^sandbox-[a-z0-9-]+$/),
  provider: z.enum(["LOCAL_DOCKER", "E2B"]),
  workspaceRelativePath: z.string().regex(/^workspaces\/sandbox-[a-z0-9-]+$/),
  createdAt: z.iso.datetime(),
});

export type SandboxRecoveryState = z.infer<typeof recoveryStateSchema>;

export type SandboxCleanupResult = {
  readonly runId: string;
  readonly providerAttempts: readonly string[];
  readonly temporaryWorkspaceRemoved: boolean;
  readonly recoveryStateRemoved: boolean;
};

function assertRunId(runId: string): void {
  if (!/^sandbox-[a-z0-9-]+$/.test(runId)) throw new Error("Unsafe sandbox run ID.");
}

function recoveryRoot(projectRoot: string): string {
  return resolve(projectRoot, ".workbench/local-sandbox");
}

function workspaceRoot(projectRoot: string): string {
  return resolve(recoveryRoot(projectRoot), "workspaces");
}

function stateRoot(projectRoot: string): string {
  return resolve(recoveryRoot(projectRoot), "runs");
}

function contained(root: string, candidate: string): boolean {
  const path = relative(root, candidate);
  return path === "" || (!path.startsWith(`..${sep}`) && path !== ".." && !isAbsolute(path));
}

async function assertNoSymlinkSegments(root: string, candidate: string): Promise<void> {
  if (!contained(root, candidate)) throw new Error("Sandbox recovery path escaped its owned root.");
  const parts = relative(root, candidate).split(sep).filter(Boolean);
  let cursor = root;
  for (const part of parts) {
    cursor = resolve(cursor, part);
    const status = await lstat(cursor).catch((error: unknown) => {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
      throw error;
    });
    if (!status) return;
    if (status.isSymbolicLink()) throw new Error("Sandbox recovery rejected a symbolic link.");
  }
}

function paths(
  projectRoot: string,
  runId: string,
): {
  readonly workspace: string;
  readonly state: string;
} {
  assertRunId(runId);
  return {
    workspace: resolve(workspaceRoot(projectRoot), runId),
    state: resolve(stateRoot(projectRoot), `${runId}.json`),
  };
}

export async function createSandboxRecoveryState(input: {
  readonly projectRoot: string;
  readonly runId: string;
  readonly provider: SandboxProviderKind;
  readonly createdAt: string;
}): Promise<{ readonly state: SandboxRecoveryState; readonly workspace: string }> {
  const ownedRoot = recoveryRoot(input.projectRoot);
  const ownedPaths = paths(input.projectRoot, input.runId);
  await assertNoSymlinkSegments(input.projectRoot, ownedRoot);
  await mkdir(stateRoot(input.projectRoot), { recursive: true });
  await mkdir(workspaceRoot(input.projectRoot), { recursive: true });
  await assertNoSymlinkSegments(ownedRoot, ownedPaths.state);
  await assertNoSymlinkSegments(ownedRoot, ownedPaths.workspace);
  const state = recoveryStateSchema.parse({
    schemaVersion: 1,
    classification: "LOCAL_SANDBOX_RECOVERY_STATE",
    runId: input.runId,
    provider: input.provider,
    workspaceRelativePath: `workspaces/${input.runId}`,
    createdAt: input.createdAt,
  });
  await writeFile(ownedPaths.state, `${JSON.stringify(state, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });
  return { state, workspace: ownedPaths.workspace };
}

export async function readSandboxRecoveryState(
  projectRoot: string,
  runId: string,
): Promise<SandboxRecoveryState | null> {
  const ownedRoot = recoveryRoot(projectRoot);
  const ownedPaths = paths(projectRoot, runId);
  await assertNoSymlinkSegments(projectRoot, ownedRoot);
  await assertNoSymlinkSegments(ownedRoot, ownedPaths.state);
  const raw = await readFile(ownedPaths.state, "utf8").catch((error: unknown) => {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
    throw error;
  });
  if (!raw) return null;
  const state = recoveryStateSchema.parse(JSON.parse(raw) as unknown);
  if (state.runId !== runId || state.workspaceRelativePath !== `workspaces/${runId}`) {
    throw new Error("Sandbox recovery state does not match the requested run.");
  }
  return state;
}

async function removeOwnedWorkspace(projectRoot: string, runId: string): Promise<boolean> {
  const ownedRoot = recoveryRoot(projectRoot);
  const root = workspaceRoot(projectRoot);
  const workspace = paths(projectRoot, runId).workspace;
  await assertNoSymlinkSegments(projectRoot, ownedRoot);
  await assertNoSymlinkSegments(ownedRoot, root);
  await assertNoSymlinkSegments(root, workspace);
  const canonicalRoot = await realpath(root);
  const canonicalWorkspace = await realpath(workspace).catch((error: unknown): string | null => {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
    throw error;
  });
  if (canonicalWorkspace && !contained(canonicalRoot, canonicalWorkspace)) {
    throw new Error("Sandbox recovery workspace escaped its owned root.");
  }
  await rm(workspace, { recursive: true, force: true });
  return !(await lstat(workspace)
    .then(() => true)
    .catch(() => false));
}

export async function cleanupOwnedSandboxRun(input: {
  readonly projectRoot: string;
  readonly runId: string;
  readonly provider: SandboxProvider;
  readonly signal: AbortSignal;
  readonly requireState?: boolean;
}): Promise<SandboxCleanupResult> {
  const state = await readSandboxRecoveryState(input.projectRoot, input.runId);
  if (input.requireState && !state) throw new Error(`No recovery state for ${input.runId}.`);
  if (!state) {
    return {
      runId: input.runId,
      providerAttempts: [],
      temporaryWorkspaceRemoved: true,
      recoveryStateRemoved: true,
    };
  }
  if (state.provider !== input.provider.kind) {
    throw new Error("Sandbox recovery provider does not match the owned run state.");
  }

  const providerCleanup: Promise<{
    readonly attempts: readonly string[];
    readonly error: unknown;
  }> = input.provider.cleanup(input.runId, input.signal).then(
    (attempts) => ({ attempts, error: null }),
    (error: unknown) => ({ attempts: [] as readonly string[], error }),
  );
  const temporaryWorkspaceRemoved = await removeOwnedWorkspace(input.projectRoot, input.runId);
  const { attempts: providerAttempts, error: providerError } = await providerCleanup;
  let recoveryStateRemoved = false;
  if (!providerError && temporaryWorkspaceRemoved) {
    const statePath = paths(input.projectRoot, input.runId).state;
    await assertNoSymlinkSegments(recoveryRoot(input.projectRoot), statePath);
    await rm(statePath, { force: true });
    recoveryStateRemoved = true;
  }
  if (providerError) throw new Error("Sandbox provider cleanup failed.", { cause: providerError });
  return {
    runId: input.runId,
    providerAttempts,
    temporaryWorkspaceRemoved,
    recoveryStateRemoved,
  };
}

export async function recoverSandboxRun(input: {
  readonly projectRoot: string;
  readonly runId: string;
  readonly providerFor: (kind: SandboxProviderKind) => SandboxProvider;
  readonly signal: AbortSignal;
}): Promise<SandboxCleanupResult> {
  const state = await readSandboxRecoveryState(input.projectRoot, input.runId);
  if (!state) {
    return {
      runId: input.runId,
      providerAttempts: [],
      temporaryWorkspaceRemoved: true,
      recoveryStateRemoved: true,
    };
  }
  return cleanupOwnedSandboxRun({
    projectRoot: input.projectRoot,
    runId: input.runId,
    provider: input.providerFor(state.provider),
    signal: input.signal,
    requireState: true,
  });
}
