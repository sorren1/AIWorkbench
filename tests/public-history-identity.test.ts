import { describe, expect, it } from "vitest";

import {
  isPermittedPublicCommitIdentity,
  OWNER_PUBLIC_EMAIL,
} from "../scripts/publicHistoryIdentity";

const dependabotEmail = "49699333+dependabot[bot]@users.noreply.github.com";
const githubWebEmail = "noreply@github.com";

describe("public-history commit identity policy", () => {
  it("requires the owner identity throughout release lineage", () => {
    expect(isPermittedPublicCommitIdentity(OWNER_PUBLIC_EMAIL, OWNER_PUBLIC_EMAIL, true)).toBe(
      true,
    );
    expect(isPermittedPublicCommitIdentity(OWNER_PUBLIC_EMAIL, githubWebEmail, true)).toBe(true);
    expect(isPermittedPublicCommitIdentity(dependabotEmail, githubWebEmail, true)).toBe(false);
  });

  it("recognizes exact provider identities only on review-only refs", () => {
    expect(isPermittedPublicCommitIdentity(OWNER_PUBLIC_EMAIL, githubWebEmail, false)).toBe(true);
    expect(isPermittedPublicCommitIdentity(dependabotEmail, githubWebEmail, false)).toBe(true);
    expect(isPermittedPublicCommitIdentity("someone@example.com", githubWebEmail, false)).toBe(
      false,
    );
    expect(isPermittedPublicCommitIdentity(dependabotEmail, OWNER_PUBLIC_EMAIL, false)).toBe(false);
  });
});
