import { spawn } from "node:child_process";
import { resolve } from "node:path";

import { lintableTrackedSourcePaths, trackedSourcePaths } from "./trackedSourceInventory";

const root = resolve(import.meta.dirname, "..");
const eslint = resolve(root, "node_modules/eslint/bin/eslint.js");
const paths = lintableTrackedSourcePaths(await trackedSourcePaths(root));
if (paths.length === 0) throw new Error("The tracked-source inventory contains no lintable files.");

const exitCode = await new Promise<number>((accept, reject) => {
  const child = spawn(process.execPath, [eslint, ...paths, ...process.argv.slice(2)], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    shell: false,
    windowsHide: true,
  });
  child.once("error", reject);
  child.once("close", (code) => accept(code ?? 1));
});
if (exitCode !== 0) process.exitCode = exitCode;
else process.stdout.write(`Linted ${paths.length} explicitly tracked source files.\n`);
