import { execFile } from "node:child_process";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const fixtureRoot = resolve(import.meta.dirname, "../../fixtures/toy-repository");

export type DisposableToyRepository = {
  readonly root: string;
  cleanup: () => Promise<void>;
};

export async function createDisposableToyRepository(): Promise<DisposableToyRepository> {
  const root = await mkdtemp(resolve(tmpdir(), "ai-delivery-workbench-toy-"));
  await cp(fixtureRoot, root, { recursive: true });
  await execFileAsync("git", ["init", "--quiet"], { cwd: root });
  await execFileAsync("git", ["config", "user.name", "Synthetic Fixture"], { cwd: root });
  await execFileAsync("git", ["config", "user.email", "fixture@example.invalid"], {
    cwd: root,
  });
  await execFileAsync("git", ["add", "."], { cwd: root });
  await execFileAsync("git", ["commit", "--quiet", "-m", "synthetic baseline"], { cwd: root });
  return {
    root,
    cleanup: async () => {
      await rm(root, { recursive: true, force: true });
    },
  };
}

export function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
