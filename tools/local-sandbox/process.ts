import { spawn } from "node:child_process";

export type ProcessRequest = {
  readonly executable: string;
  readonly args: readonly string[];
  readonly cwd?: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly timeoutMs: number;
  readonly maxOutputBytes?: number;
  readonly signal?: AbortSignal | undefined;
};

export type ProcessResult = {
  readonly exitCode: number | null;
  readonly timedOut: boolean;
  readonly durationMs: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly outputTruncated: boolean;
  readonly aborted: boolean;
};

function appendBounded(current: string, chunk: Buffer, maximum: number): [string, boolean] {
  const next = current + chunk.toString("utf8");
  if (Buffer.byteLength(next, "utf8") <= maximum) return [next, false];
  return [Buffer.from(next, "utf8").subarray(0, maximum).toString("utf8"), true];
}

export async function runProcess(request: ProcessRequest): Promise<ProcessResult> {
  request.signal?.throwIfAborted();
  const started = performance.now();
  const maximum = request.maxOutputBytes ?? 1024 * 1024;
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let outputTruncated = false;
    let timedOut = false;
    let aborted = false;
    let settled = false;
    const child = spawn(request.executable, [...request.args], {
      cwd: request.cwd,
      env: request.env,
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.on("data", (chunk: Buffer) => {
      const [next, truncated] = appendBounded(stdout, chunk, maximum);
      stdout = next;
      outputTruncated ||= truncated;
    });
    child.stderr.on("data", (chunk: Buffer) => {
      const [next, truncated] = appendBounded(stderr, chunk, maximum);
      stderr = next;
      outputTruncated ||= truncated;
    });
    const finish = (exitCode: number | null, spawnError?: Error): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      request.signal?.removeEventListener("abort", onAbort);
      if (spawnError) stderr = `${stderr}${stderr ? "\n" : ""}${spawnError.message}`;
      resolve({
        exitCode,
        timedOut,
        durationMs: Math.max(0, Math.round(performance.now() - started)),
        stdout,
        stderr,
        outputTruncated,
        aborted,
      });
    };
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, request.timeoutMs);
    const onAbort = (): void => {
      aborted = true;
      child.kill("SIGKILL");
    };
    request.signal?.addEventListener("abort", onAbort, { once: true });
    if (request.signal?.aborted) onAbort();
    child.once("error", (error) => finish(null, error));
    child.once("close", (code) => finish(code));
  });
}

function stripAnsiColorCodes(value: string): string {
  const escape = String.fromCharCode(27);
  let output = value;
  let start = output.indexOf(`${escape}[`);
  while (start >= 0) {
    const end = output.indexOf("m", start + 2);
    if (end < 0) break;
    const parameters = output.slice(start + 2, end);
    let validParameters = true;
    for (let index = 0; index < parameters.length; index += 1) {
      const code = parameters.charCodeAt(index);
      if (code !== 59 && (code < 48 || code > 57)) validParameters = false;
    }
    if (!validParameters) break;
    output = output.slice(0, start) + output.slice(end + 1);
    start = output.indexOf(`${escape}[`, start);
  }
  return output;
}

export function normalizeCapturedOutput(
  value: string,
  replacements: readonly string[] = [],
): string {
  let normalized = stripAnsiColorCodes(value).replaceAll("\r\n", "\n").replaceAll("\r", "\n");
  for (const replacement of [...replacements].sort((left, right) => right.length - left.length)) {
    if (replacement) normalized = normalized.replaceAll(replacement, "<TEMP_WORKSPACE>");
  }
  return normalized.trimEnd();
}
