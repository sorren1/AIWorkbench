# Synthetic variance-report toy repository

This is an original, disposable fixture for the local sandbox walkthrough. It contains no external or private code, accepts no visitor input, and has no runtime dependencies beyond Node.js.

The checked-in baseline intentionally fails its two tests: `formatVariance` returns a signed number without the required `over` or `under` label. The sandbox command copies this directory to a temporary workspace, applies one deterministic patch to the approved `src/report.js` target, and demonstrates failing-before/passing-after evidence inside network-disabled Docker containers.
