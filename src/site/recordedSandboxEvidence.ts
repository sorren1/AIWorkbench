import {
  readLatestValidatedEvidence,
  type ValidatedSandboxEvidencePack,
} from "../../tools/local-sandbox/evidence";

export type RecordedSandboxEvidenceRender = {
  readonly html: string;
  readonly jsonName: string;
  readonly markdownName: string;
  readonly traceName: string | null;
  readonly json: string;
  readonly markdown: string;
  readonly trace: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function exitLabel(exitCode: number | null, timedOut: boolean): string {
  if (timedOut) return "Timed out";
  return exitCode === 0 ? "Passed · exit 0" : `Failed · exit ${exitCode ?? "unavailable"}`;
}

function runtimeLabel(pack: ValidatedSandboxEvidencePack): string {
  if (pack.schemaVersion === 1) return pack.tools.imageDigest;
  if (pack.tools.provider === "LOCAL_DOCKER") {
    return pack.tools.imageDigest;
  }
  return `E2B ${pack.tools.template} · SDK ${pack.tools.sdkVersion}`;
}

function boundaryLabel(pack: ValidatedSandboxEvidencePack): string {
  if (pack.schemaVersion === 1) {
    return `${pack.boundary.limits.cpuCount} CPU · ${pack.boundary.limits.memoryMb} MiB · ${pack.boundary.limits.processLimit} processes · network none`;
  }
  const limits = pack.boundary.limits;
  if (limits.provider.kind === "LOCAL_DOCKER") {
    return `${limits.provider.cpuCount} CPU · ${limits.provider.memoryMb} MiB · ${limits.provider.processLimit} processes · network none`;
  }
  return `${limits.provider.cpuCount} CPU · ${limits.provider.memoryMb} MiB reported by E2B · ${limits.commandTimeoutMs} ms command timeout · outbound probe blocked`;
}

export async function renderRecordedSandboxEvidence(
  projectRoot: string,
): Promise<RecordedSandboxEvidenceRender | null> {
  const latest = await readLatestValidatedEvidence(projectRoot);
  if (!latest) return null;
  const pack = latest.pack;
  const commands = [...pack.prePatchExecution.commands, ...pack.postPatchExecution.commands].filter(
    (command) => command.id !== "tool-versions",
  );
  const commandRows = commands
    .map(
      (command) => `<tr>
        <th scope="row">${escapeHtml(command.id)}</th>
        <td><span class="site-status ${command.exitCode === 0 ? "site-status--functional" : "site-status--expected-failure"}">${escapeHtml(exitLabel(command.exitCode, command.timedOut))}</span></td>
        <td>${command.durationMs} ms · measured locally</td>
      </tr>`,
    )
    .join("");
  const html = `<div class="site-recorded-run">
    <div class="site-recorded-run__summary">
      <div>
        <p class="site-kicker site-kicker--functional">Validated checked-in evidence</p>
        <h3>Failing before, passing after one allow-listed patch.</h3>
        <p>This is a build-time rendering of a recorded local Docker run. The visitor's browser does not execute code, start a container, accept a patch, or call a local service.</p>
      </div>
      <span class="site-status site-status--functional">${escapeHtml(pack.run.status)}</span>
    </div>
    <dl class="site-evidence-facts">
      <div><dt>Source commit</dt><dd><code>${escapeHtml(pack.run.sourceCommit.slice(0, 12))}</code> · working tree ${escapeHtml(pack.run.sourceWorkingTree.toLowerCase())}</dd></div>
      <div><dt>Changed path</dt><dd><code>${escapeHtml(pack.change.path)}</code> · only approved target</dd></div>
      <div><dt>Execution boundary</dt><dd>${escapeHtml(boundaryLabel(pack))}</dd></div>
      <div><dt>Evidence digest</dt><dd><code>${escapeHtml(pack.evidenceDigest)}</code></dd></div>
      <div><dt>Context-pack digest</dt><dd><code>${escapeHtml(pack.governance.contextPackDigest)}</code></dd></div>
      ${
        pack.schemaVersion === 3
          ? `<div><dt>Trace ID</dt><dd><code>${escapeHtml(pack.observability.trace.traceId)}</code></dd></div>
      <div><dt>Trace artifact digest</dt><dd><code>${escapeHtml(pack.observability.trace.artifactSha256)}</code></dd></div>
      <div><dt>Budget outcome</dt><dd>${escapeHtml(pack.observability.budget.outcome)} | ${pack.observability.budget.dimensions.find((item) => item.dimension === "TOOL_CALLS")?.observed ?? 0} tool calls | ${pack.observability.budget.dimensions.find((item) => item.dimension === "REPAIR_ATTEMPTS")?.observed ?? 0} repair attempt</dd></div>
      <div><dt>Model accounting</dt><dd>${pack.observability.accounting.total.modelCalls} calls | $${pack.observability.accounting.total.costUsd} | ${escapeHtml(pack.observability.accounting.total.costMeasurement.toLowerCase().replaceAll("_", " "))}</dd></div>`
          : ""
      }
      <div><dt>Sandbox runtime</dt><dd><code>${escapeHtml(runtimeLabel(pack))}</code></dd></div>
    </dl>
    <div class="site-table-wrap" tabindex="0" role="region" aria-label="Recorded sandbox command results">
      <table class="site-matrix site-recorded-run__commands">
        <caption class="site-sr-only">Measured command results from the recorded local Docker run.</caption>
        <thead><tr><th scope="col">Command</th><th scope="col">Result</th><th scope="col">Duration basis</th></tr></thead>
        <tbody>${commandRows}</tbody>
      </table>
    </div>
    <details class="site-recorded-run__diff">
      <summary>Inspect the recorded unified diff</summary>
      <pre><code>${escapeHtml(pack.change.unifiedDiff)}</code></pre>
    </details>
    <div class="site-actions">
      <a class="site-secondary-action" href="./recorded-evidence/${escapeHtml(latest.index.latest.json)}">Open validated JSON evidence</a>
      <a class="site-text-action" href="./recorded-evidence/${escapeHtml(latest.index.latest.markdown)}">Open Markdown summary</a>
      ${
        pack.schemaVersion === 3
          ? `<a class="site-text-action" href="./demo/?screen=trace">Inspect accessible Run Trace</a>
      <a class="site-text-action" href="./recorded-evidence/${escapeHtml(pack.observability.trace.artifact)}">Open normalized trace JSON</a>`
          : ""
      }
      <a class="site-text-action" data-config-link="repository" data-source-path="docs/vertical-slice-walkthrough.md" hidden target="_blank">Run it locally from source</a>
    </div>
  </div>`;
  return {
    html,
    jsonName: latest.index.latest.json,
    markdownName: latest.index.latest.markdown,
    traceName: pack.schemaVersion === 3 ? pack.observability.trace.artifact : null,
    json: latest.json,
    markdown: latest.markdown,
    trace: latest.traceJson,
  };
}
