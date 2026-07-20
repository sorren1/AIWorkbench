export const OWNER_PUBLIC_EMAIL = "89358652+sorren1@users.noreply.github.com";

const DEPENDABOT_PUBLIC_EMAIL = "49699333+dependabot[bot]@users.noreply.github.com";
const GITHUB_WEB_COMMITTER_EMAIL = "noreply@github.com";

export function isPermittedPublicCommitIdentity(
  authorEmail: string | undefined,
  committerEmail: string | undefined,
  isReleaseLineage: boolean,
): boolean {
  if (authorEmail === OWNER_PUBLIC_EMAIL && committerEmail === OWNER_PUBLIC_EMAIL) return true;
  if (isReleaseLineage || committerEmail !== GITHUB_WEB_COMMITTER_EMAIL) return false;

  return authorEmail === OWNER_PUBLIC_EMAIL || authorEmail === DEPENDABOT_PUBLIC_EMAIL;
}
