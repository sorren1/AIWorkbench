# Recorded real sandbox run

- Classification: RECORDED_REAL_LOCAL_SANDBOX_EVIDENCE
- Status: FAILED
- Run: sandbox-20260717t073023-bf1ecca8
- Source commit: 48d911c3e376231c7a7df36c105461ff70fc7f15
- Source working tree: MODIFIED
- Evidence digest: f3fdbd62804cd42e80a01a7fff4d4a682a48f017094796ad76777f130603e680
- Context-pack digest: d8d5dbbaa47e89551e634d849a80f31399e16870a30ad64a5abedadf0655d0c8
- Docker image: node@sha256:1b2479dd35a99687d6638f5976fd235e26c5b37e8122f786fcd5fe231d63de5b
- Network during execution: disabled
- Container user: 65532:65532
- Limits: 0.5 CPU, 256 MiB memory, 64 processes, 30000 ms per command

## Result

The checked-in synthetic test fails before the controlled patch. For a successful scenario, the build and tests pass after the only changed path, `src/report.js`, is patched.

- pre-test: exit 1 (6147 ms)
- build: exit 0 (6110 ms)
- test: exit 1 (6095 ms)

## Unified diff

```diff
diff --git a/src/report.js b/src/report.js
index dbf3576..a03ed7f 100644
--- a/src/report.js
+++ b/src/report.js
@@ -1,3 +1,4 @@
 export function formatVariance(actual, budget) {
-  return `Variance: ${actual - budget}`;
+  const difference = actual - budget;
+  return `Variance: ${difference} over`;
 }
```

## Safety boundary

Recorded evidence from an explicitly invoked local command against repository-owned synthetic fixtures. The static public website does not execute code, accept patches, start containers, or expose this runner as a service.
