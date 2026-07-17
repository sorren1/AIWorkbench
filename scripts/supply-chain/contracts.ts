import { z } from "zod";

const sha256Image = z.string().regex(/@sha256:[a-f0-9]{64}$/);

export const toolingSchema = z.object({
  schemaVersion: z.literal(1),
  gitleaks: z.object({ version: z.string().min(1), image: sha256Image }),
  trivy: z.object({ version: z.string().min(1), image: sha256Image }),
  cycloneDxNpm: z.object({ version: z.string().min(1) }),
  codeql: z.object({
    version: z.string().min(1),
    actionSha: z.string().regex(/^[a-f0-9]{40}$/),
  }),
  sandbox: z.object({
    image: z.string().min(1),
    dockerfile: z.string().min(1),
    baseImage: sha256Image,
  }),
  policy: z.object({
    dependencyFailureSeverities: z.array(z.enum(["high", "critical"])).min(1),
    containerFailureSeverities: z.array(z.enum(["HIGH", "CRITICAL"])).min(1),
    secretFindingLimit: z.literal(0),
    staticAnalysisFindingLimit: z.literal(0),
  }),
});

export type SupplyChainTooling = z.infer<typeof toolingSchema>;

export const suppressionSchema = z.object({
  schemaVersion: z.literal(1),
  entries: z.array(
    z.object({
      id: z.string().regex(/^SUP-[0-9]{4}-[0-9]{3}$/),
      scanner: z.enum(["gitleaks", "eslint", "container-policy", "npm-audit", "trivy"]),
      ruleId: z.string().min(1),
      path: z.string().min(1),
      reason: z.string().min(20),
      reviewer: z.string().min(1),
      reviewOn: z.iso.date(),
      expiresOn: z.iso.date(),
    }),
  ),
});

export type SupplyChainSuppressions = z.infer<typeof suppressionSchema>;
export type SupplyChainSuppression = SupplyChainSuppressions["entries"][number];

export const licensePolicySchema = z.object({
  schemaVersion: z.literal(1),
  allowedExpressions: z.array(z.string().min(1)).min(1),
  deniedExpressions: z.array(z.string().min(1)),
  requireDeclaredLicense: z.boolean(),
});

export type LicensePolicy = z.infer<typeof licensePolicySchema>;

export type ControlStatus = "PASSED" | "CONFIGURED_NOT_RUN" | "NOT_APPLICABLE";

export type ReleaseControlSummary = {
  readonly id: string;
  readonly label: string;
  readonly status: ControlStatus;
  readonly scanner: string;
  readonly version: string;
  readonly target: string;
  readonly findingCount: number | null;
  readonly detail: string;
};

export type ReleaseSummary = {
  readonly schemaVersion: 1;
  readonly generatedAt: string;
  readonly source: {
    readonly baseCommit: string;
    readonly revisionKind: "COMMIT" | "WORKTREE";
    readonly treeDigest: string;
  };
  readonly controls: readonly ReleaseControlSummary[];
  readonly artifacts: readonly {
    readonly kind: "SARIF" | "SBOM" | "INVENTORY" | "SUMMARY";
    readonly name: string;
    readonly sha256: string;
  }[];
  readonly suppressions: {
    readonly active: number;
    readonly expired: number;
  };
};

export type SarifFinding = {
  readonly ruleId: string;
  readonly level: "none" | "note" | "warning" | "error";
  readonly message: string;
  readonly path: string;
  readonly line?: number;
  readonly column?: number;
};
