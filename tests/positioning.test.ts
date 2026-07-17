import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { issues, meta, settings } from "../src/demo/data/fixtures";

const SUBTITLE = "A governed, human-in-the-loop control plane for AI-assisted software delivery.";
const DISCLOSURE =
  "Independent portfolio prototype. All code, copy, fixtures, workflows, and visuals in this project were created from scratch using synthetic data. No employer or client code, prompts, schemas, screenshots, repositories, internal documentation, or confidential information were used. External Jira, GitHub, AI, database, and enterprise MCP-style operations are simulated; the interactive UI, local workflow state machine, and bounded toy-repository MCP fixture are functional. The public browser never connects to the local MCP process.";
const PROFESSIONAL_CONTEXT =
  "In professional work, I built a related governed AI-assisted delivery platform that supported approximately 50 production stories through human-reviewed pull requests. This public prototype is a separate implementation and contains none of that system’s code or data.";

function normalizedFile(path: string): string {
  return readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\s+/g, " ");
}

describe("public positioning", () => {
  it("keeps canonical claims consistent across public surfaces", () => {
    const home = normalizedFile("index.html");
    const readme = normalizedFile("README.md");

    expect(meta.subtitle).toBe(SUBTITLE);
    expect(meta.aboutNote).toBe(DISCLOSURE);
    expect(meta.professionalContext).toBe(PROFESSIONAL_CONTEXT);
    expect(home).toContain(SUBTITLE);
    expect(home).toContain(DISCLOSURE);
    expect(home).toContain(PROFESSIONAL_CONTEXT);
    expect(readme).toContain(SUBTITLE);
    expect(readme).toContain(DISCLOSURE);
    expect(readme).toContain(PROFESSIONAL_CONTEXT);
  });

  it("makes fixture identity and repository provenance explicit", () => {
    expect(meta.user).toEqual({
      name: "Alex Morgan",
      role: "Synthetic demo persona",
      initials: "AM",
    });

    const actors = issues.flatMap((issue) => [issue.assignee, issue.reviewer, issue.tester]);
    expect(
      actors.every(
        (actor) => actor === "—" || actor === meta.user.name || actor.startsWith("Synthetic "),
      ),
    ).toBe(true);
    expect(settings.jira.baseUrl.endsWith(".invalid")).toBe(true);
    expect(settings.github.org.startsWith("synthetic-")).toBe(true);
    expect(settings.github.repos.every((repository) => repository.name.startsWith("demo-"))).toBe(
      true,
    );
  });
});
