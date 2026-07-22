export type ShutdownSignal = "SIGINT" | "SIGTERM";

export type CleanupOperation = {
  readonly name: string;
  readonly run: (signal: AbortSignal) => Promise<void>;
};

export type LifecycleOptions = {
  readonly cleanupTimeoutMs?: number;
};

export class ShutdownRequestedError extends Error {
  constructor(readonly signal: ShutdownSignal) {
    super(`Shutdown requested by ${signal}.`);
    this.name = "ShutdownRequestedError";
  }
}

export class LifecycleCleanupError extends Error {
  constructor(readonly failedOperations: readonly string[]) {
    super(`Cleanup failed for: ${failedOperations.join(", ")}.`);
    this.name = "LifecycleCleanupError";
  }
}

function timeoutError(name: string): Error {
  const error = new Error(`Cleanup timed out for ${name}.`);
  error.name = "TimeoutError";
  return error;
}

async function boundedCleanup(operation: CleanupOperation, timeoutMs: number): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(timeoutError(operation.name)), timeoutMs);
  try {
    await Promise.race([
      operation.run(controller.signal),
      new Promise<never>((_resolve, reject) => {
        controller.signal.addEventListener(
          "abort",
          () => {
            const reason: unknown = controller.signal.reason;
            reject(reason instanceof Error ? reason : new Error("Cleanup was aborted."));
          },
          { once: true },
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export class CleanupLifecycle {
  readonly signal: AbortSignal;
  readonly cleanupTimeoutMs: number;
  private readonly controller = new AbortController();
  private readonly operations: CleanupOperation[] = [];
  private cleanupPromise: Promise<void> | null = null;
  private shutdownSignal: ShutdownSignal | null = null;

  constructor(options: LifecycleOptions = {}) {
    this.signal = this.controller.signal;
    this.cleanupTimeoutMs = options.cleanupTimeoutMs ?? 10_000;
    if (!Number.isInteger(this.cleanupTimeoutMs) || this.cleanupTimeoutMs < 100) {
      throw new Error("cleanupTimeoutMs must be an integer of at least 100 ms.");
    }
  }

  get interruptedBy(): ShutdownSignal | null {
    return this.shutdownSignal;
  }

  register(operation: CleanupOperation): void {
    if (this.cleanupPromise) {
      throw new Error(`Cannot register cleanup after shutdown started: ${operation.name}.`);
    }
    if (this.operations.some((candidate) => candidate.name === operation.name)) {
      throw new Error(`Cleanup operation is already registered: ${operation.name}.`);
    }
    this.operations.push(operation);
  }

  requestShutdown(signal: ShutdownSignal): boolean {
    if (this.shutdownSignal) return false;
    this.shutdownSignal = signal;
    this.controller.abort(new ShutdownRequestedError(signal));
    return true;
  }

  throwIfAborted(): void {
    this.signal.throwIfAborted();
  }

  cleanup(): Promise<void> {
    if (this.cleanupPromise) return this.cleanupPromise;
    this.cleanupPromise = this.runCleanup();
    return this.cleanupPromise;
  }

  private async runCleanup(): Promise<void> {
    const failed: string[] = [];
    for (const operation of [...this.operations].reverse()) {
      try {
        await boundedCleanup(operation, this.cleanupTimeoutMs);
      } catch {
        failed.push(operation.name);
      }
    }
    if (failed.length > 0) throw new LifecycleCleanupError(failed);
  }
}

export function isShutdownError(error: unknown): error is ShutdownRequestedError {
  return error instanceof ShutdownRequestedError;
}

export async function runSignalAwareCli(
  task: (lifecycle: CleanupLifecycle) => Promise<void>,
  options: LifecycleOptions = {},
): Promise<number> {
  const lifecycle = new CleanupLifecycle(options);
  let taskError: unknown;
  let cleanupError: unknown;

  const onSignal = (signal: ShutdownSignal): void => {
    const started = lifecycle.requestShutdown(signal);
    process.stderr.write(
      started
        ? `Shutdown requested by ${signal}; cleanup started with a ${lifecycle.cleanupTimeoutMs} ms per-operation limit.\n`
        : `Shutdown already in progress after ${lifecycle.interruptedBy}; ${signal} did not start duplicate cleanup.\n`,
    );
    void lifecycle.cleanup().catch(() => undefined);
  };
  const onSigint = (): void => onSignal("SIGINT");
  const onSigterm = (): void => onSignal("SIGTERM");
  process.on("SIGINT", onSigint);
  process.on("SIGTERM", onSigterm);

  try {
    await task(lifecycle);
  } catch (error) {
    taskError = error;
  } finally {
    try {
      await lifecycle.cleanup();
    } catch (error) {
      cleanupError = error;
    }
    process.off("SIGINT", onSigint);
    process.off("SIGTERM", onSigterm);
  }

  if (cleanupError) {
    process.stderr.write(
      `${cleanupError instanceof Error ? cleanupError.message : "Lifecycle cleanup failed."}\n`,
    );
  }
  if (taskError && !(isShutdownError(taskError) && lifecycle.interruptedBy)) {
    process.stderr.write(`${taskError instanceof Error ? taskError.message : "Command failed."}\n`);
  }
  if (lifecycle.interruptedBy === "SIGINT") return 130;
  if (lifecycle.interruptedBy === "SIGTERM") return 143;
  return taskError || cleanupError ? 1 : 0;
}
