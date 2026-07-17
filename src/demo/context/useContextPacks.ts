import { useEffect, useState } from "react";

import { stageDefs } from "../data/fixtures";
import type { StageId } from "../data/types";
import type { ContextPack } from "./contracts";
import { buildContextPack } from "./runtime";

type ContextPackState = {
  readonly packs: ReadonlyMap<StageId, ContextPack>;
  readonly error: string | null;
};

export function useContextPacks(subject: string): ContextPackState {
  const [state, setState] = useState<ContextPackState>({ packs: new Map(), error: null });

  useEffect(() => {
    let active = true;
    void Promise.all(
      stageDefs.map(async ({ id }) => [id, await buildContextPack(subject, id)] as const),
    )
      .then((entries) => {
        if (active) setState({ packs: new Map(entries), error: null });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          packs: new Map(),
          error: error instanceof Error ? error.message : "Context packs could not be assembled.",
        });
      });
    return () => {
      active = false;
    };
  }, [subject]);

  return state;
}
