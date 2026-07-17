# Semantic-distance review

Review date: 2026-07-16

## Scope

The review covered every tracked text file returned by `git ls-files`, including package metadata, source, tests, public HTML, authored guidelines, architecture records, and generated dependency metadata in `package-lock.json`. Historical content reachable only through the preservation tag was not treated as active public-branch content.

Search results are recorded by category and outcome. Prohibited private identifiers are intentionally not reproduced here.

## Categories and outcomes

| Category                              | Review performed                                                                                                                                              | Outcome                                                                                                                                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Known organization identifier         | Compared the active tracked tree against the prohibited identifier documented by the original audit, without printing it.                                     | Zero tracked matches.                                                                                                                                                                          |
| Organization/opportunity targeting    | Searched for organization names, audience-specific assurances, recruiting language, role-targeting language, and prior one-off submission framing.            | Active copy was rewritten as durable portfolio language. Remaining technical uses of “client” refer only to browser/client software APIs, not an organization relationship.                    |
| Proprietary or internal-looking terms | Reviewed issue keys, repository names, branches, schema objects, package names, provider labels, configuration URLs, and architecture vocabulary.             | Values are invented, generic, and presented inside explicitly synthetic fixture contexts. Repository names and URLs use `demo`, `synthetic`, `.invalid`, or equivalent non-production signals. |
| Persona identity                      | Searched all person-like names and initials in fixtures, generated content, reviewer lists, and validation notes.                                             | The active persona is `Alex Morgan · Synthetic demo persona`; secondary actors use explicit `Synthetic` role labels.                                                                           |
| Reference-stack specificity           | Reviewed Jira, GitHub, Angular, .NET, Oracle, AI-provider, and MCP-style wording.                                                                             | The stack is framed as one illustrative adapter set behind vendor-neutral boundaries. Provider identities were replaced with simulated neutral labels.                                         |
| Fixture claims and metrics            | Reviewed counts, durations, test results, percentages, currency thresholds, checks, logs, approval state, and readiness language.                             | Screen-level context and artifact copy classify these values as synthetic fixtures. Functional repository behavior is described separately.                                                    |
| Professional claims                   | Searched for story counts, adoption, users, revenue, awards, performance, and production outcome language.                                                    | Only the approved professional-context statement remains, in separately labeled public sections. No result is attributed to the prototype.                                                     |
| Secrets and private material          | Searched tracked names and contents for environment files, credential patterns, private keys, tokens, personal contact details, and private review artifacts. | No intended secret or private review file is tracked. The publication checklist is ignored by Git.                                                                                             |
| Stale paths and generated artifacts   | Reviewed references to removed `workbench/` runtime files, standalone bundles, and old run instructions.                                                      | Active run instructions point to Vite and `/demo/`; historical paths remain only where the baseline audit or migration map intentionally describes the preserved original state.               |

## Interpretation rules

- A lexical match is reviewed in context. For example, `react-dom/client`, browser client APIs, and client-rendered architecture alternatives are software terms rather than organization references.
- Public vendor and standards names are allowed when they identify an illustrative adapter or documented public influence; they do not imply endorsement, deployment, or copied implementation.
- Historical file paths may remain in audit and migration records, but stale public-facing instructions and submission-only copy may not.
- Synthetic labels must be adjacent at the screen, section, or persistent-shell level whenever a fixture could be mistaken for an observed fact.

## Release gate

Repeat this review after generated build output exists and before the final release commit. A new organization-specific identifier, unexplained internal term, unsupported outcome, unlabeled metric, or tracked private-review file blocks publication.
