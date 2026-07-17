import { execFile } from "node:child_process";
import { readFile, readdir, realpath, stat, writeFile } from "node:fs/promises";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";

const execFileAsync = promisify(execFile);
const MAX_FILE_BYTES = 64 * 1024;
const READABLE_EXTENSIONS = new Set([".js", ".json", ".md"]);

type ToyRepositoryContext = {
  readonly root: string;
  readonly writesEnabled: boolean;
};

function result(payload: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload) }],
    structuredContent: payload,
  };
}

async function loadContext(): Promise<ToyRepositoryContext> {
  const configuredRoot = process.env.WB_TOY_REPO_ROOT;
  if (!configuredRoot || !isAbsolute(configuredRoot)) {
    throw new Error("WB_TOY_REPO_ROOT must be an absolute disposable repository path.");
  }
  const root = await realpath(configuredRoot);
  const marker: unknown = JSON.parse(
    await readFile(resolve(root, ".workbench-toy-repository.json"), "utf8"),
  );
  if (
    typeof marker !== "object" ||
    marker === null ||
    !("kind" in marker) ||
    marker.kind !== "disposable-synthetic-toy-repository"
  ) {
    throw new Error("The configured root is not a disposable synthetic toy repository.");
  }
  return { root, writesEnabled: process.env.WB_TOY_REPO_WRITE_ENABLED === "true" };
}

async function boundedPath(
  context: ToyRepositoryContext,
  requestedPath: string,
  mode: "read" | "write",
): Promise<string> {
  if (isAbsolute(requestedPath) || requestedPath.includes("\0")) {
    throw new Error("Absolute and null-containing paths are denied.");
  }
  const candidate = resolve(context.root, requestedPath);
  const inside = candidate === context.root || candidate.startsWith(`${context.root}${sep}`);
  if (!inside || relative(context.root, candidate).split(/[\\/]/u).includes(".git")) {
    throw new Error("Path escapes the disposable repository boundary.");
  }
  const resolvedCandidate = await realpath(candidate);
  if (
    resolvedCandidate !== context.root &&
    !resolvedCandidate.startsWith(`${context.root}${sep}`)
  ) {
    throw new Error("Resolved path escapes the disposable repository boundary.");
  }
  const normalized = relative(context.root, resolvedCandidate).replaceAll("\\", "/");
  if (mode === "write" && !normalized.startsWith("src/")) {
    throw new Error("Controlled writes are limited to src/** in the disposable repository.");
  }
  if (!READABLE_EXTENSIONS.has(extname(resolvedCandidate))) {
    throw new Error("Only the toy repository's text fixture formats are accessible.");
  }
  return resolvedCandidate;
}

async function readBoundedFile(context: ToyRepositoryContext, path: string): Promise<string> {
  const candidate = await boundedPath(context, path, "read");
  const details = await stat(candidate);
  if (!details.isFile() || details.size > MAX_FILE_BYTES) {
    throw new Error("The requested file is unavailable or exceeds the 64 KiB fixture limit.");
  }
  return readFile(candidate, "utf8");
}

async function listTextFiles(root: string, current = root): Promise<string[]> {
  const paths: string[] = [];
  for (const entry of await readdir(current, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const absolute = resolve(current, entry.name);
    if (entry.isDirectory()) paths.push(...(await listTextFiles(root, absolute)));
    if (entry.isFile() && READABLE_EXTENSIONS.has(extname(entry.name))) {
      paths.push(relative(root, absolute).replaceAll("\\", "/"));
    }
  }
  return paths.sort();
}

export function registerRepositorySearch(server: McpServer, context: ToyRepositoryContext): void {
  server.registerTool(
    "tool.repository.search",
    {
      title: "Repository search",
      description: "Search synthetic text files inside the disposable toy repository.",
      inputSchema: z.object({ query: z.string().min(1).max(120), path: z.string().optional() }),
      outputSchema: z.object({
        matches: z.array(
          z.object({ path: z.string(), line: z.number().int().positive(), excerpt: z.string() }),
        ),
      }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ query, path }) => {
      const files = path ? [path] : await listTextFiles(context.root);
      const matches: { path: string; line: number; excerpt: string }[] = [];
      for (const file of files) {
        const contents = await readBoundedFile(context, file);
        for (const [index, line] of contents.split(/\r?\n/u).entries()) {
          if (line.toLocaleLowerCase().includes(query.toLocaleLowerCase())) {
            matches.push({ path: file, line: index + 1, excerpt: line.trim().slice(0, 160) });
          }
          if (matches.length >= 20) break;
        }
        if (matches.length >= 20) break;
      }
      return result({ matches });
    },
  );
}

export function registerRepositoryFileRead(server: McpServer, context: ToyRepositoryContext): void {
  server.registerTool(
    "tool.repository.file.read",
    {
      title: "Repository file read",
      description: "Read one UTF-8 file inside the disposable toy repository.",
      inputSchema: z.object({ path: z.string().min(1).max(240) }),
      outputSchema: z.object({ path: z.string(), contents: z.string() }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ path }) => result({ path, contents: await readBoundedFile(context, path) }),
  );
}

export function registerControlledPatch(server: McpServer, context: ToyRepositoryContext): void {
  server.registerTool(
    "tool.repository.patch.controlled",
    {
      title: "Controlled patch",
      description: "Replace one exact occurrence in a toy-repository src/** file.",
      inputSchema: z.object({
        path: z.string().min(1).max(240),
        expected: z.string().min(1).max(4000),
        replacement: z.string().max(4000),
      }),
      outputSchema: z.object({ path: z.string(), changed: z.boolean() }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ path, expected, replacement }) => {
      if (!context.writesEnabled) {
        throw new Error(
          "The trusted control plane did not enable bounded writes for this process.",
        );
      }
      const candidate = await boundedPath(context, path, "write");
      const contents = await readBoundedFile(context, path);
      const first = contents.indexOf(expected);
      if (first < 0) return result({ path, changed: false });
      if (contents.slice(first + expected.length).includes(expected)) {
        throw new Error("Controlled patch requires an expected string that occurs exactly once.");
      }
      await writeFile(
        candidate,
        `${contents.slice(0, first)}${replacement}${contents.slice(first + expected.length)}`,
        "utf8",
      );
      return result({ path, changed: true });
    },
  );
}

export function registerDiffInspection(server: McpServer, context: ToyRepositoryContext): void {
  server.registerTool(
    "tool.repository.diff.inspect",
    {
      title: "Diff inspection",
      description: "Inspect the current diff in the disposable toy repository.",
      inputSchema: z.object({}),
      outputSchema: z.object({ diff: z.string(), changedPaths: z.array(z.string()) }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      const { stdout: diff } = await execFileAsync(
        "git",
        ["diff", "--no-ext-diff", "--unified=3", "--", "src", "test"],
        { cwd: context.root, timeout: 3000, maxBuffer: MAX_FILE_BYTES },
      );
      const { stdout: names } = await execFileAsync(
        "git",
        ["diff", "--name-only", "--", "src", "test"],
        { cwd: context.root, timeout: 3000, maxBuffer: MAX_FILE_BYTES },
      );
      return result({
        diff,
        changedPaths: names
          .split(/\r?\n/u)
          .map((name) => name.trim())
          .filter(Boolean),
      });
    },
  );
}

export function registerSandboxValidation(server: McpServer, context: ToyRepositoryContext): void {
  server.registerTool(
    "tool.sandbox.command",
    {
      title: "Sandbox validation",
      description: "Run the fixed node --test command in the disposable toy repository.",
      inputSchema: z.object({ command: z.literal("validate") }),
      outputSchema: z.object({
        exitCode: z.number().int(),
        stdout: z.string(),
        stderr: z.string(),
      }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      try {
        const { stdout, stderr } = await execFileAsync(process.execPath, ["--test"], {
          cwd: context.root,
          timeout: 8000,
          maxBuffer: MAX_FILE_BYTES,
          env: { PATH: process.env.PATH ?? "" },
        });
        return result({ exitCode: 0, stdout, stderr });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Validation process failed.";
        return result({ exitCode: 1, stdout: "", stderr: message });
      }
    },
  );
}

export async function createToyRepositoryMcpServer(): Promise<McpServer> {
  const context = await loadContext();
  const server = new McpServer({ name: "ai-delivery-workbench-toy-repository", version: "1.0.0" });
  registerRepositorySearch(server, context);
  registerRepositoryFileRead(server, context);
  registerControlledPatch(server, context);
  registerDiffInspection(server, context);
  registerSandboxValidation(server, context);
  return server;
}

async function main(): Promise<void> {
  const server = await createToyRepositoryMcpServer();
  const transport = new StdioServerTransport();
  process.on("SIGINT", () => {
    void server.close().finally(() => process.exit(0));
  });
  await server.connect(transport);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  void main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown MCP server failure";
    process.stderr.write(`${message}\n`);
    process.exit(1);
  });
}
