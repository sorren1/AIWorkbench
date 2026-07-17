import type { ModelCatalogSnapshot } from "../../../tools/model-gateway/contracts";

export type ModelGatewayPublicStatus = {
  readonly schemaVersion: 1;
  readonly implementation: "LiteLLM";
  readonly implementationVersion: "1.94.0-dev.3+mcp.1.28.1";
  readonly imageDigest: string;
  readonly label:
    "gateway implemented; live provider path not validated" | "validated local gateway integration";
  readonly liveValidated: boolean;
  readonly sourceCommit: string | null;
  readonly catalog: ModelCatalogSnapshot | null;
  readonly disclosure: string;
};
