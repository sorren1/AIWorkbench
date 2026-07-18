import { architecture } from "../data/fixtures";
import { architectureDownload } from "../exports/architecture";
import type { ArchitecturePlane } from "../data/types";
import { useApp } from "../state/store";
import { downloadTextFile } from "../utils/browserActions";
import { Icon, type IconName } from "../../shared/Icon";
import { Badge, Banner, Btn, Card, CardHead } from "../components/primitives";

/* ============================================================
   AI Delivery Workbench — Screen: Architecture
   An executive/technical explanation of the production design:
   control / execution / context / validation planes.
   ============================================================ */
function PlaneCard({ plane }: { readonly plane: ArchitecturePlane }) {
  return (
    <Card className="wb-u-overflow-hidden">
      <div className={`wb-plane-strip wb-bg-tone--${plane.tone}`} />
      <div className="wb-card-body">
        <div className="wb-flex wb-u-gap-11px">
          <span className={`wb-plane-icon wb-plane-icon--${plane.tone}`}>
            <Icon name={plane.icon} size={20} />
          </span>
          <div>
            <h2 className="wb-u-text-15px wb-u-weight-700">{plane.name}</h2>
            <div className="wb-text-sm wb-muted wb-u-mt-1px">{plane.tagline}</div>
          </div>
        </div>
        <div className="wb-mt-16 wb-u-display-grid wb-u-cols-1fr-1fr wb-u-gap-7px-14px">
          {plane.items.map((it) => (
            <div key={it} className="wb-flex wb-u-gap-8px">
              <span className={`wb-plane-dot wb-bg-tone--${plane.tone}`} aria-hidden="true" />
              <span className="wb-text-sm wb-secondary">{it}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function ArchitectureScreen() {
  const { actions } = useApp();
  const arch = architecture;
  const exportSummary = (format: "json" | "markdown") => {
    try {
      const spec = architectureDownload(format);
      downloadTextFile(spec);
      actions.toast("success", "Architecture exported", spec.filename + " saved locally.");
    } catch (error) {
      actions.toast(
        "error",
        "Export failed",
        error instanceof Error ? error.message : "The browser rejected the download operation.",
      );
    }
  };
  const flow: { label: string; icon: IconName; desc: string }[] = [
    { label: "Suggestion", icon: "sparkles", desc: "AI proposes — never decides" },
    { label: "Implementation", icon: "git-branch", desc: "Drafted on a branch" },
    { label: "Review", icon: "shield-check", desc: "Human gate + checks" },
    { label: "Release", icon: "git-merge", desc: "Controlled, traceable" },
  ];
  return (
    <div className="wb-page wb-page-wide">
      <div className="wb-page-head">
        <div>
          <div className="eyebrow wb-mb-8">
            <Icon name="network" size={13} /> Proposed production design
          </div>
          <h1 className="wb-page-title">Architecture</h1>
          <div className="wb-page-desc">
            The proposed production design separates planes of responsibility so suggestion,
            implementation, review, and release stay distinct, with deterministic artifacts and
            human gates between them.
          </div>
        </div>
        <div className="wb-spacer" />
        <div className="wb-flex wb-wrap wb-u-gap-8px">
          <Badge tone="safe" icon="check">
            Local exports functional
          </Badge>
          <Btn
            size="sm"
            variant="secondary"
            icon="download"
            onClick={() => exportSummary("markdown")}
          >
            Export Markdown
          </Btn>
          <Btn size="sm" variant="secondary" icon="download" onClick={() => exportSummary("json")}>
            Export JSON
          </Btn>
        </div>
      </div>

      {/* Separation-of-concerns flow */}
      <Card className="wb-mb-16">
        <figure
          className="wb-card-body wb-architecture-figure"
          aria-labelledby="architecture-flow-caption"
        >
          <figcaption id="architecture-flow-caption" className="wb-sr-only">
            Delivery responsibility moves from an AI suggestion, to branch-scoped implementation, to
            human review with checks, and finally to a controlled, traceable release.
          </figcaption>
          <div
            aria-hidden="true"
            className="wb-u-display-grid wb-u-cols-repeat-4-1fr wb-u-gap-0 wb-u-items-stretch"
          >
            {flow.map((f, i) => (
              <div key={f.label} className="wb-flex wb-u-gap-12px">
                <div className="wb-u-flex-1">
                  <div className="wb-flex wb-u-gap-9px">
                    <span className="wb-u-w-34px wb-u-h-34px wb-u-radius-radius-md wb-u-bg-accent-soft wb-u-color-accent wb-u-display-inline-flex wb-u-items-center wb-u-justify-center wb-u-flex-none">
                      <Icon name={f.icon} size={17} />
                    </span>
                    <div>
                      <div className="wb-strong wb-u-text-13-5px">{f.label}</div>
                      <div className="wb-muted wb-u-text-11-5px">{f.desc}</div>
                    </div>
                  </div>
                </div>
                {i < flow.length - 1 && (
                  <span className="wb-u-self-center wb-u-color-border-strong wb-u-pr-6px">
                    <Icon name="chevron-right" size={18} />
                  </span>
                )}
              </div>
            ))}
          </div>
        </figure>
      </Card>

      {/* Planes */}
      <div className="wb-grid wb-grid-2 wb-mb-16">
        {arch.planes.map((p) => (
          <PlaneCard key={p.id} plane={p} />
        ))}
      </div>

      <div className="wb-u-display-grid wb-u-cols-minmax-zero-1-5fr-minmax-zero-1fr wb-u-gap-16px wb-u-items-start">
        <Banner tone="warn" title="Production hardening" icon="lock">
          {arch.productionNote}
        </Banner>
        <Card>
          <CardHead icon="cpu" title="Engineering review topics" />
          <div className="wb-card-body">
            <div className="wb-flex wb-wrap wb-u-gap-7px">
              {arch.reviewTopics.map((t) => (
                <span
                  key={t}
                  className="wb-badge wb-badge--neutral wb-u-font-font-sans wb-u-text-12px"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="wb-mt-16" />
      <Banner tone="neutral" icon="shield">
        Independent portfolio architecture. The planes and reference stack are original,
        illustrative designs; external identity, execution, persistence, and integration
        infrastructure are not implemented by this static demo.
      </Banner>
    </div>
  );
}
