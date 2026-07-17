import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { E2BSandboxProvider } from "../tools/local-sandbox/e2bProvider";
import { validateEvidencePack } from "../tools/local-sandbox/evidence";
import { runSandboxSlice } from "../tools/local-sandbox/runner";

const projectRoot = resolve(import.meta.dirname, "..");

describe("live E2B sandbox provider", () => {
  it.skipIf(!process.env.E2B_API_KEY)(
    "runs the complete synthetic vertical slice and verifies cleanup",
    { timeout: 180_000 },
    async () => {
      const provider = new E2BSandboxProvider();
      const pack = await runSandboxSlice({ projectRoot, provider, writeEvidence: false });
      expect(pack.run.status).toBe("SUCCEEDED");
      expect(pack.tools.provider).toBe("E2B");
      expect(pack.prePatchExecution.provider).toBe("E2B");
      expect(pack.postPatchExecution.provider).toBe("E2B");
      expect(provider.activeSandboxIds()).toEqual([]);
      expect((await validateEvidencePack(pack)).valid).toBe(true);
    },
  );
});
