import { z } from "zod";

const sha256Image = z.string().regex(/@sha256:[a-f0-9]{64}$/);

export const toolingSchema = z.object({
  schemaVersion: z.literal(1),
  gitleaks: z.object({ version: z.string().min(1), image: sha256Image }),
  trivy: z.object({ version: z.string().min(1), image: sha256Image }),
  cosign: z.object({ version: z.string().min(1), image: sha256Image }),
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
  liteLlm: z.object({
    image: z.string().min(1),
    dockerfile: z.string().min(1),
    context: z.string().min(1),
    requirements: z.string().min(1),
    requirementsSha256: z.string().regex(/^[a-f0-9]{64}$/),
    upstreamImage: sha256Image,
    cosignPublicKey: z.string().min(1),
    cosignPublicKeySha256: z.string().regex(/^[a-f0-9]{64}$/),
    minimumVersions: z.object({
      "python-3.13": z.string().min(1),
      "python-3.13-base": z.string().min(1),
      ddtrace: z.string().min(1),
      mcp: z.string().min(1),
      pyasn1: z.string().min(1),
    }),
  }),
  postgres: z.object({ image: sha256Image }),
  policy: z.object({
    dependencyFailureSeverities: z.array(z.enum(["high", "critical"])).min(1),
    containerFailureSeverities: z.array(z.enum(["HIGH", "CRITICAL"])).min(1),
    secretFindingLimit: z.literal(0),
    staticAnalysisFindingLimit: z.literal(0),
  }),
});

export type SupplyChainTooling = z.infer<typeof toolingSchema>;

const exactSuppressionSelector = z
  .string()
  .min(1)
  .refine((value) => !value.includes("*"), "Suppression selectors must not contain wildcards.");

const suppressionEntrySchema = z
  .object({
    id: z.string().regex(/^SUP-[0-9]{4}-[0-9]{3}$/),
    scanner: z.enum(["gitleaks", "eslint", "container-policy", "npm-audit", "trivy"]),
    ruleId: exactSuppressionSelector,
    path: exactSuppressionSelector,
    reason: z.string().min(20),
    reviewer: z.string().min(1),
    reviewOn: z.iso.date(),
    expiresOn: z.iso.date(),
  })
  .refine((entry) => entry.reviewOn <= entry.expiresOn, {
    message: "Suppression reviewOn must be on or before expiresOn.",
    path: ["expiresOn"],
  });

export const suppressionSchema = z.object({
  schemaVersion: z.literal(1),
  entries: z.array(suppressionEntrySchema),
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
  readonly evidenceUrl?: string;
  readonly sourceCommit?: string;
};

export type ReleaseSummary = {
  readonly schemaVersion: 3;
  readonly generatedAt: string;
  readonly source: {
    readonly baseCommit: string;
    readonly revisionKind: "COMMIT" | "WORKTREE";
    readonly treeDigest: string;
  };
  readonly release: {
    readonly tag: string;
    readonly auditedCommit: string;
  } | null;
  readonly evidence: {
    readonly parentCommit: string;
    readonly commitPolicy: "DIRECT_CHILD_SUMMARY_ONLY";
    readonly allowedPaths: readonly ["public/security/release-summary.json"];
  } | null;
  readonly deployment: {
    readonly provider: "VERCEL";
    readonly commitEnvironment: "VERCEL_GIT_COMMIT_SHA";
    readonly approvedCommitEnvironment: "APPROVED_DEPLOYMENT_COMMIT_SHA";
    readonly relation: "TAGGED_EVIDENCE_CHILD_OF_AUDITED_COMMIT";
  };
  readonly controls: readonly ReleaseControlSummary[];
  readonly artifacts: readonly {
    readonly kind: "SARIF" | "SBOM" | "INVENTORY" | "PROVENANCE" | "SUMMARY";
    readonly name: string;
    readonly sha256: string;
  }[];
  readonly suppressions: {
    readonly active: number;
    readonly expired: number;
  };
  readonly runtimeImages: readonly RuntimeImageSummary[];
};

export type RuntimeImageSummary = {
  readonly role: "sandbox" | "litellm" | "postgresql";
  readonly displayName: string;
  readonly reference: string;
  readonly scannedDigest: string;
  readonly sbomArtifact: string;
  readonly provenance: {
    readonly status: "DIGEST_PINNED_BUILD" | "VERIFIED_UPSTREAM_SIGNATURE" | "DIGEST_PINNED";
    readonly detail: string;
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
