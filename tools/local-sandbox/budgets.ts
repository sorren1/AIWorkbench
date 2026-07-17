import { z } from "zod";

import { canonicalJson } from "../../src/demo/control-plane/registry/canonical";
import { sha256Bytes } from "./security";

export const BUDGET_ACTIONS = ["WARN", "STOP_STAGE", "STOP_RUN"] as const;
export type BudgetAction = (typeof BUDGET_ACTIONS)[number];

export const executionBudgetSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  version: z.string().min(1),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
  maximumWallClockDurationMs: z.number().int().positive(),
  maximumStageDurationMs: z.number().int().positive(),
  maximumToolCalls: z.number().int().nonnegative(),
  maximumRepairAttempts: z.number().int().nonnegative(),
  maximumInputTokens: z.number().int().nonnegative().optional(),
  maximumOutputTokens: z.number().int().nonnegative().optional(),
  maximumCostUsd: z.number().nonnegative().optional(),
  actionOnThreshold: z.enum(BUDGET_ACTIONS),
  approachingThresholdRatio: z.number().min(0.5).max(1),
  provenance: z.object({
    classification: z.literal("SYNTHETIC_PUBLIC_POLICY"),
    source: z.literal("CHECKED_IN_REPOSITORY_POLICY"),
  }),
});

export type ExecutionBudget = z.infer<typeof executionBudgetSchema>;
export type BudgetDimension =
  | "WALL_CLOCK_DURATION"
  | "STAGE_DURATION"
  | "TOOL_CALLS"
  | "REPAIR_ATTEMPTS"
  | "INPUT_TOKENS"
  | "OUTPUT_TOKENS"
  | "COST_USD";
export type BudgetStatus = "WITHIN" | "APPROACHING" | "EXCEEDED";

export type BudgetEvent = {
  readonly type: "APPROACHING" | "EXCEEDED";
  readonly dimension: BudgetDimension;
  readonly observed: number;
  readonly limit: number;
  readonly action: BudgetAction;
  readonly elapsedMs: number;
};

export type BudgetDimensionResult = {
  readonly dimension: BudgetDimension;
  readonly observed: number;
  readonly limit: number | null;
  readonly unit: "MILLISECONDS" | "COUNT" | "TOKENS" | "USD";
  readonly measurement: "MEASURED" | "EXACT" | "ACTUAL_PROVIDER_REPORTED" | "ESTIMATED";
  readonly status: BudgetStatus;
};

export type BudgetResult = {
  readonly schemaVersion: 1;
  readonly policy: ExecutionBudget;
  readonly outcome: "WITHIN_BUDGET" | "WARNING" | "STOPPED";
  readonly stopReason: BudgetDimension | null;
  readonly dimensions: readonly BudgetDimensionResult[];
  readonly events: readonly BudgetEvent[];
};

type UsageTotals = {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly costUsd: number;
  readonly tokenMeasurement: "ACTUAL_PROVIDER_REPORTED" | "ESTIMATED" | "EXACT";
  readonly costMeasurement: "ACTUAL_PROVIDER_REPORTED" | "ESTIMATED" | "EXACT";
};

export class BudgetStopError extends Error {
  constructor(
    readonly dimension: BudgetDimension,
    readonly action: Extract<BudgetAction, "STOP_STAGE" | "STOP_RUN">,
  ) {
    super(
      `Execution budget stopped ${action === "STOP_RUN" ? "the run" : "the stage"}: ${dimension}.`,
    );
    this.name = "BudgetStopError";
  }
}

function policyHashInput(policy: Omit<ExecutionBudget, "contentHash">): string {
  return canonicalJson(policy);
}

export function createExecutionBudget(
  overrides: Partial<
    Pick<
      ExecutionBudget,
      | "id"
      | "version"
      | "maximumWallClockDurationMs"
      | "maximumStageDurationMs"
      | "maximumToolCalls"
      | "maximumRepairAttempts"
      | "maximumInputTokens"
      | "maximumOutputTokens"
      | "maximumCostUsd"
      | "actionOnThreshold"
      | "approachingThresholdRatio"
    >
  > = {},
): ExecutionBudget {
  const source: Omit<ExecutionBudget, "contentHash"> = {
    schemaVersion: 1,
    id: overrides.id ?? "budget.local-sandbox-bounded",
    version: overrides.version ?? "1.0.0",
    maximumWallClockDurationMs: overrides.maximumWallClockDurationMs ?? 90_000,
    maximumStageDurationMs: overrides.maximumStageDurationMs ?? 75_000,
    maximumToolCalls: overrides.maximumToolCalls ?? 4,
    maximumRepairAttempts: overrides.maximumRepairAttempts ?? 1,
    ...(overrides.maximumInputTokens === undefined
      ? {}
      : { maximumInputTokens: overrides.maximumInputTokens }),
    ...(overrides.maximumOutputTokens === undefined
      ? {}
      : { maximumOutputTokens: overrides.maximumOutputTokens }),
    ...(overrides.maximumCostUsd === undefined ? {} : { maximumCostUsd: overrides.maximumCostUsd }),
    actionOnThreshold: overrides.actionOnThreshold ?? "STOP_RUN",
    approachingThresholdRatio: overrides.approachingThresholdRatio ?? 0.8,
    provenance: {
      classification: "SYNTHETIC_PUBLIC_POLICY",
      source: "CHECKED_IN_REPOSITORY_POLICY",
    },
  };
  return executionBudgetSchema.parse({
    ...source,
    contentHash: sha256Bytes(policyHashInput(source)),
  });
}

type DimensionInput = Omit<BudgetDimensionResult, "status">;

export class ExecutionBudgetTracker {
  private readonly startedAt: number;
  private readonly stageStartedAt: number;
  private readonly events: BudgetEvent[] = [];
  private readonly approaching = new Set<BudgetDimension>();
  private readonly exceeded = new Set<BudgetDimension>();
  private toolCalls = 0;
  private repairAttempts = 0;
  private usage: UsageTotals = {
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    tokenMeasurement: "EXACT",
    costMeasurement: "EXACT",
  };

  constructor(
    readonly policy: ExecutionBudget,
    private readonly now: () => number = () => performance.now(),
    private readonly onEvent?: (event: BudgetEvent) => void,
  ) {
    this.startedAt = this.now();
    this.stageStartedAt = this.startedAt;
  }

  private status(observed: number, limit: number | null): BudgetStatus {
    if (limit === null) return "WITHIN";
    if (limit === 0) return observed > 0 ? "EXCEEDED" : "WITHIN";
    if (observed > limit) return "EXCEEDED";
    if (observed >= limit * this.policy.approachingThresholdRatio) return "APPROACHING";
    return "WITHIN";
  }

  private evaluate(input: DimensionInput): void {
    if (input.limit === null) return;
    const status = this.status(input.observed, input.limit);
    if (status === "WITHIN") return;
    const seen = status === "APPROACHING" ? this.approaching : this.exceeded;
    if (!seen.has(input.dimension)) {
      seen.add(input.dimension);
      const event: BudgetEvent = {
        type: status,
        dimension: input.dimension,
        observed: input.observed,
        limit: input.limit,
        action: this.policy.actionOnThreshold,
        elapsedMs: Math.max(0, Math.round(this.now() - this.startedAt)),
      };
      this.events.push(event);
      this.onEvent?.(event);
    }
    if (status === "EXCEEDED" && this.policy.actionOnThreshold !== "WARN") {
      throw new BudgetStopError(input.dimension, this.policy.actionOnThreshold);
    }
  }

  checkTime(): void {
    const current = this.now();
    this.evaluate({
      dimension: "WALL_CLOCK_DURATION",
      observed: Math.max(0, Math.round(current - this.startedAt)),
      limit: this.policy.maximumWallClockDurationMs,
      unit: "MILLISECONDS",
      measurement: "MEASURED",
    });
    this.evaluate({
      dimension: "STAGE_DURATION",
      observed: Math.max(0, Math.round(current - this.stageStartedAt)),
      limit: this.policy.maximumStageDurationMs,
      unit: "MILLISECONDS",
      measurement: "MEASURED",
    });
  }

  beforeToolCall(): void {
    this.checkTime();
    this.evaluate({
      dimension: "TOOL_CALLS",
      observed: this.toolCalls + 1,
      limit: this.policy.maximumToolCalls,
      unit: "COUNT",
      measurement: "EXACT",
    });
    this.toolCalls += 1;
  }

  beforeRepairAttempt(): void {
    this.checkTime();
    this.evaluate({
      dimension: "REPAIR_ATTEMPTS",
      observed: this.repairAttempts + 1,
      limit: this.policy.maximumRepairAttempts,
      unit: "COUNT",
      measurement: "EXACT",
    });
    this.repairAttempts += 1;
  }

  setUsage(usage: UsageTotals): void {
    this.usage = usage;
    this.evaluate({
      dimension: "INPUT_TOKENS",
      observed: usage.inputTokens,
      limit: this.policy.maximumInputTokens ?? null,
      unit: "TOKENS",
      measurement: usage.tokenMeasurement,
    });
    this.evaluate({
      dimension: "OUTPUT_TOKENS",
      observed: usage.outputTokens,
      limit: this.policy.maximumOutputTokens ?? null,
      unit: "TOKENS",
      measurement: usage.tokenMeasurement,
    });
    this.evaluate({
      dimension: "COST_USD",
      observed: usage.costUsd,
      limit: this.policy.maximumCostUsd ?? null,
      unit: "USD",
      measurement: usage.costMeasurement,
    });
  }

  snapshot(stopReason: BudgetDimension | null = null): BudgetResult {
    const current = this.now();
    const dimensions: readonly DimensionInput[] = [
      {
        dimension: "WALL_CLOCK_DURATION",
        observed: Math.max(0, Math.round(current - this.startedAt)),
        limit: this.policy.maximumWallClockDurationMs,
        unit: "MILLISECONDS",
        measurement: "MEASURED",
      },
      {
        dimension: "STAGE_DURATION",
        observed: Math.max(0, Math.round(current - this.stageStartedAt)),
        limit: this.policy.maximumStageDurationMs,
        unit: "MILLISECONDS",
        measurement: "MEASURED",
      },
      {
        dimension: "TOOL_CALLS",
        observed: this.toolCalls,
        limit: this.policy.maximumToolCalls,
        unit: "COUNT",
        measurement: "EXACT",
      },
      {
        dimension: "REPAIR_ATTEMPTS",
        observed: this.repairAttempts,
        limit: this.policy.maximumRepairAttempts,
        unit: "COUNT",
        measurement: "EXACT",
      },
      {
        dimension: "INPUT_TOKENS",
        observed: this.usage.inputTokens,
        limit: this.policy.maximumInputTokens ?? null,
        unit: "TOKENS",
        measurement: this.usage.tokenMeasurement,
      },
      {
        dimension: "OUTPUT_TOKENS",
        observed: this.usage.outputTokens,
        limit: this.policy.maximumOutputTokens ?? null,
        unit: "TOKENS",
        measurement: this.usage.tokenMeasurement,
      },
      {
        dimension: "COST_USD",
        observed: this.usage.costUsd,
        limit: this.policy.maximumCostUsd ?? null,
        unit: "USD",
        measurement: this.usage.costMeasurement,
      },
    ];
    const results = dimensions.map((item) => ({
      ...item,
      status: this.status(item.observed, item.limit),
    }));
    return {
      schemaVersion: 1,
      policy: this.policy,
      outcome: stopReason ? "STOPPED" : this.events.length > 0 ? "WARNING" : "WITHIN_BUDGET",
      stopReason,
      dimensions: results,
      events: [...this.events],
    };
  }
}

export type UsageMeasurement = "ACTUAL_PROVIDER_REPORTED" | "ESTIMATED" | "EXACT_ZERO_NO_MODEL";

export type ModelUsageRecord = {
  readonly stage: "implement";
  readonly modelPolicyId: string;
  readonly modelIdentifier: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly costUsd: number;
  readonly tokenMeasurement: UsageMeasurement;
  readonly costMeasurement: UsageMeasurement;
  readonly pricingSource: {
    readonly id: string;
    readonly version: string;
    readonly effectiveAt: string | null;
  };
};

export type RunAccounting = {
  readonly schemaVersion: 1;
  readonly records: readonly ModelUsageRecord[];
  readonly stages: readonly {
    readonly stage: "implement";
    readonly modelCalls: number;
    readonly inputTokens: number;
    readonly outputTokens: number;
    readonly costUsd: number;
    readonly tokenMeasurement: UsageMeasurement;
    readonly costMeasurement: UsageMeasurement;
  }[];
  readonly total: {
    readonly modelCalls: number;
    readonly inputTokens: number;
    readonly outputTokens: number;
    readonly costUsd: number;
    readonly tokenMeasurement: UsageMeasurement;
    readonly costMeasurement: UsageMeasurement;
  };
};

function aggregateMeasurement(
  records: readonly ModelUsageRecord[],
  key: "tokenMeasurement" | "costMeasurement",
): UsageMeasurement {
  if (records.length === 0) return "EXACT_ZERO_NO_MODEL";
  if (records.some((record) => record[key] === "ESTIMATED")) return "ESTIMATED";
  return "ACTUAL_PROVIDER_REPORTED";
}

export type UsageAccountant = {
  record(record: ModelUsageRecord): void;
  snapshot(): RunAccounting;
};

export class ProviderNeutralUsageAccountant implements UsageAccountant {
  private readonly records: ModelUsageRecord[] = [];

  record(record: ModelUsageRecord): void {
    if (record.inputTokens < 0 || record.outputTokens < 0 || record.costUsd < 0) {
      throw new Error("Usage accounting values cannot be negative.");
    }
    this.records.push(record);
  }

  snapshot(): RunAccounting {
    const inputTokens = this.records.reduce((total, record) => total + record.inputTokens, 0);
    const outputTokens = this.records.reduce((total, record) => total + record.outputTokens, 0);
    const costUsd = Number(
      this.records.reduce((total, record) => total + record.costUsd, 0).toFixed(8),
    );
    const tokenMeasurement = aggregateMeasurement(this.records, "tokenMeasurement");
    const costMeasurement = aggregateMeasurement(this.records, "costMeasurement");
    return {
      schemaVersion: 1,
      records: [...this.records],
      stages: [
        {
          stage: "implement",
          modelCalls: this.records.length,
          inputTokens,
          outputTokens,
          costUsd,
          tokenMeasurement,
          costMeasurement,
        },
      ],
      total: {
        modelCalls: this.records.length,
        inputTokens,
        outputTokens,
        costUsd,
        tokenMeasurement,
        costMeasurement,
      },
    };
  }
}

export function accountingBudgetUsage(accounting: RunAccounting): UsageTotals {
  const exactToken = accounting.total.tokenMeasurement === "EXACT_ZERO_NO_MODEL";
  const exactCost = accounting.total.costMeasurement === "EXACT_ZERO_NO_MODEL";
  return {
    inputTokens: accounting.total.inputTokens,
    outputTokens: accounting.total.outputTokens,
    costUsd: accounting.total.costUsd,
    tokenMeasurement: exactToken
      ? "EXACT"
      : accounting.total.tokenMeasurement === "ESTIMATED"
        ? "ESTIMATED"
        : "ACTUAL_PROVIDER_REPORTED",
    costMeasurement: exactCost
      ? "EXACT"
      : accounting.total.costMeasurement === "ESTIMATED"
        ? "ESTIMATED"
        : "ACTUAL_PROVIDER_REPORTED",
  };
}
