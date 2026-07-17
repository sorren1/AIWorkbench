import { architecture } from "../data/fixtures";
import type { ArchitecturePlane } from "../data/types";
import { Icon, type IconName } from "../../shared/Icon";
import { Banner, Card, CardHead } from "../components/primitives";

/* ============================================================
   AI Delivery Workbench — Screen: Architecture
   An executive/technical explanation of the production design:
   control / execution / context / validation planes.
   ============================================================ */
function PlaneCard({ plane }: { readonly plane: ArchitecturePlane }) {
  return (
    <Card style={{ overflow: "hidden" }}>
      <div style={{ height: 3, background: "var(--" + plane.tone + ")" }} />
      <div className="wb-card-body">
        <div className="wb-flex" style={{ gap: 11 }}>
          <span
            style={{
              width: 38,
              height: 38,
              borderRadius: "var(--radius-md)",
              background: "var(--" + plane.tone + "-soft, var(--bg-inset))",
              color: "var(--" + plane.tone + ")",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            <Icon name={plane.icon} size={20} />
          </span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{plane.name}</div>
            <div className="wb-text-sm wb-muted" style={{ marginTop: 1 }}>
              {plane.tagline}
            </div>
          </div>
        </div>
        <div
          className="wb-mt-16"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px 14px" }}
        >
          {plane.items.map((it) => (
            <div key={it} className="wb-flex" style={{ gap: 8 }}>
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "var(--" + plane.tone + ")",
                  flex: "none",
                }}
              />
              <span className="wb-text-sm wb-secondary">{it}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function ArchitectureScreen() {
  const arch = architecture;
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
            <Icon name="network" size={13} /> How I'd productionize it
          </div>
          <div className="wb-page-title">Architecture</div>
          <div className="wb-page-desc">
            A governed AI delivery system separates planes of responsibility so acceleration never
            erodes control. Suggestion, implementation, review, and release stay distinct — with
            deterministic artifacts and human gates between them.
          </div>
        </div>
      </div>

      {/* Separation-of-concerns flow */}
      <Card className="wb-mb-16">
        <div className="wb-card-body">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 0,
              alignItems: "stretch",
            }}
          >
            {flow.map((f, i) => (
              <div key={f.label} className="wb-flex" style={{ gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div className="wb-flex" style={{ gap: 9 }}>
                    <span
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "var(--radius-md)",
                        background: "var(--accent-soft)",
                        color: "var(--accent)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flex: "none",
                      }}
                    >
                      <Icon name={f.icon} size={17} />
                    </span>
                    <div>
                      <div className="wb-strong" style={{ fontSize: 13.5 }}>
                        {f.label}
                      </div>
                      <div className="wb-muted" style={{ fontSize: 11.5 }}>
                        {f.desc}
                      </div>
                    </div>
                  </div>
                </div>
                {i < flow.length - 1 && (
                  <span
                    style={{ alignSelf: "center", color: "var(--border-strong)", paddingRight: 6 }}
                  >
                    <Icon name="chevron-right" size={18} />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Planes */}
      <div className="wb-grid wb-grid-2 wb-mb-16">
        {arch.planes.map((p) => (
          <PlaneCard key={p.id} plane={p} />
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        <Banner tone="warn" title="Production hardening" icon="lock">
          {arch.productionNote}
        </Banner>
        <Card>
          <CardHead icon="cpu" title="Principal-level discussion" />
          <div className="wb-card-body">
            <div className="wb-flex wb-wrap" style={{ gap: 7 }}>
              {arch.principalTopics.map((t) => (
                <span
                  key={t}
                  className="wb-badge wb-badge--neutral"
                  style={{ fontFamily: "var(--font-sans)", fontSize: 12 }}
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
        Clean-room note: this architecture is illustrative and synthetic. It uses no
        previous-employer systems, code, or internal designs — only public-domain enterprise
        finance-software concepts.
      </Banner>
    </div>
  );
}
