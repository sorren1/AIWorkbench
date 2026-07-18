export type DeploymentBindingEnvironment = Readonly<Record<string, string | undefined>>;

export type ReleaseDeploymentIdentity = {
  readonly releaseTag: string;
  readonly auditedCommit: string;
  readonly evidenceParentCommit: string;
  readonly codeqlRunUrl: string;
  readonly codeqlSourceCommit: string;
};

export type VerifiedDeploymentBinding = {
  readonly schemaVersion: 1;
  readonly provider: "VERCEL";
  readonly releaseTag: string;
  readonly auditedCommit: string;
  readonly evidenceParentCommit: string;
  readonly evidenceCommit: string;
  readonly deployedCommit: string;
  readonly relation: "TAGGED_EVIDENCE_CHILD_OF_AUDITED_COMMIT";
  readonly codeql: {
    readonly runUrl: string;
    readonly sourceCommit: string;
    readonly releaseBlockingFindings: 0;
  };
  readonly verified: true;
};

const commitPattern = /^[a-f0-9]{40}$/u;

function required(environment: DeploymentBindingEnvironment, name: string): string {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`Vercel release build requires ${name}.`);
  return value;
}

export function resolveDeploymentBinding(
  environment: DeploymentBindingEnvironment,
  identity: ReleaseDeploymentIdentity | null,
): VerifiedDeploymentBinding | null {
  if (environment.VERCEL !== "1") return null;
  if (!identity) {
    throw new Error("Vercel release build requires checked-in audited release evidence.");
  }

  const deployedCommit = required(environment, "VERCEL_GIT_COMMIT_SHA");
  const approvedDeploymentCommit = required(environment, "APPROVED_DEPLOYMENT_COMMIT_SHA");
  const approvedAuditedCommit = required(environment, "APPROVED_AUDITED_COMMIT_SHA");
  const approvedReleaseTag = required(environment, "APPROVED_RELEASE_TAG");
  if (!commitPattern.test(deployedCommit) || !commitPattern.test(approvedDeploymentCommit)) {
    throw new Error("Vercel deployment commit bindings must be full lowercase Git SHAs.");
  }
  if (deployedCommit !== approvedDeploymentCommit) {
    throw new Error(
      "VERCEL_GIT_COMMIT_SHA does not match APPROVED_DEPLOYMENT_COMMIT_SHA; refusing deployment.",
    );
  }
  if (approvedAuditedCommit !== identity.auditedCommit) {
    throw new Error("APPROVED_AUDITED_COMMIT_SHA does not match the checked-in release evidence.");
  }
  if (identity.evidenceParentCommit !== identity.auditedCommit) {
    throw new Error("The evidence parent is not the audited release commit.");
  }
  if (identity.codeqlSourceCommit !== identity.auditedCommit) {
    throw new Error("Hosted CodeQL evidence is not bound to the audited release commit.");
  }
  if (approvedReleaseTag !== identity.releaseTag) {
    throw new Error("APPROVED_RELEASE_TAG does not match the checked-in release evidence.");
  }

  return {
    schemaVersion: 1,
    provider: "VERCEL",
    releaseTag: identity.releaseTag,
    auditedCommit: identity.auditedCommit,
    evidenceParentCommit: identity.evidenceParentCommit,
    evidenceCommit: deployedCommit,
    deployedCommit,
    relation: "TAGGED_EVIDENCE_CHILD_OF_AUDITED_COMMIT",
    codeql: {
      runUrl: identity.codeqlRunUrl,
      sourceCommit: identity.codeqlSourceCommit,
      releaseBlockingFindings: 0,
    },
    verified: true,
  };
}
