import {
  createContext,
  useCallback,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";

import { issues as issueFixtures, settings, stageDefs } from "../data/fixtures";
import type {
  Issue,
  IssueFlags,
  Lifecycle,
  Route,
  StageId,
  StageStatus,
  TesterNote,
  ValidationStatus,
  WorkbenchSettings,
} from "../data/types";
import type { IconName } from "../../shared/Icon";

export const STAGE_IDS: readonly StageId[] = stageDefs.map(({ id }) => id);

export function stageIdx(id: StageId): number {
  const index = STAGE_IDS.indexOf(id);
  if (index < 0) throw new Error(`Unknown stage: ${id}`);
  return index;
}

export type ToastKind = "success" | "warn" | "error" | "info";
export type Toast = {
  id: string;
  kind: ToastKind;
  title: string;
  msg: string;
  leaving?: boolean;
};

export type LogDrawer = { type: "logs"; key: string; stageId: StageId };
export type WorkbenchModal = {
  title: string;
  body: ReactNode;
  icon?: IconName;
  tone?: "warn" | "danger";
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
};

export type PullRequestOverride = {
  diffReviewed?: boolean;
  checklistAll?: boolean;
  status?: string;
  reviewer?: string;
  approvedForValidation?: boolean;
};

export type ValidationOverride = {
  scenarios?: Record<string, ValidationStatus>;
  started?: boolean;
  evidenceStatus?: ValidationStatus;
  decision?: ValidationStatus;
  notes?: TesterNote[];
};

export type QueueFilters = {
  search: string;
  assignedToMe: boolean;
  lifecycle: string;
  surface: string;
  hasPR: boolean;
  needsReview: boolean;
  failed: boolean;
  stale: boolean;
};

export type WorkbenchState = {
  route: Route;
  selectedKey: string;
  issues: Record<string, Issue>;
  toasts: Toast[];
  drawer: LogDrawer | null;
  modal: WorkbenchModal | null;
  selectedArtifact: Record<string, string>;
  prState: Record<string, PullRequestOverride>;
  valState: Record<string, ValidationOverride>;
  settings: WorkbenchSettings;
  busy: Record<string, boolean>;
  filters: QueueFilters;
};

export type IssuePatch = Partial<Omit<Issue, "flags" | "s">> & { flags?: IssueFlags };

export type Action =
  | { type: "ROUTE"; route: Route; key?: string }
  | { type: "SELECT_ISSUE"; key: string; route?: Route }
  | { type: "SET_STAGE"; key: string; idx: number; status: StageStatus }
  | { type: "PATCH_ISSUE"; key: string; patch: IssuePatch }
  | { type: "STALE_FROM"; key: string; fromIdx: number }
  | { type: "TOAST_ADD"; toast: Toast }
  | { type: "TOAST_LEAVE"; id: string }
  | { type: "TOAST_REMOVE"; id: string }
  | { type: "DRAWER"; drawer: LogDrawer | null }
  | { type: "MODAL"; modal: WorkbenchModal | null }
  | { type: "SELECT_ARTIFACT"; key: string; name: string }
  | { type: "PR"; key: string; patch: PullRequestOverride }
  | { type: "VAL"; key: string; patch: ValidationOverride }
  | { type: "BUSY"; id: string; on: boolean }
  | { type: "FILTER"; patch: Partial<QueueFilters> }
  | { type: "TOGGLE_GOV"; id: string };

function cloneIssues(): Record<string, Issue> {
  const cloned: Record<string, Issue> = {};
  for (const issue of issueFixtures) {
    cloned[issue.key] = { ...issue, s: [...issue.s], flags: { ...issue.flags } };
  }
  return cloned;
}

export function createInitialState(): WorkbenchState {
  return {
    route: "queue",
    selectedKey: "FIN-1150",
    issues: cloneIssues(),
    toasts: [],
    drawer: null,
    modal: null,
    selectedArtifact: {},
    prState: {},
    valState: {},
    settings: structuredClone(settings),
    busy: {},
    filters: {
      search: "",
      assignedToMe: false,
      lifecycle: "",
      surface: "",
      hasPR: false,
      needsReview: false,
      failed: false,
      stale: false,
    },
  };
}

export function reducer(state: WorkbenchState, action: Action): WorkbenchState {
  switch (action.type) {
    case "ROUTE":
      return { ...state, route: action.route, selectedKey: action.key ?? state.selectedKey };
    case "SELECT_ISSUE":
      return { ...state, selectedKey: action.key, route: action.route ?? "issue" };
    case "SET_STAGE": {
      const issue = state.issues[action.key];
      if (!issue || action.idx < 0 || action.idx >= issue.s.length) return state;
      const stages = [...issue.s];
      stages[action.idx] = action.status;
      return {
        ...state,
        issues: { ...state.issues, [action.key]: { ...issue, s: stages } },
      };
    }
    case "PATCH_ISSUE": {
      const issue = state.issues[action.key];
      if (!issue) return state;
      return {
        ...state,
        issues: {
          ...state.issues,
          [action.key]: {
            ...issue,
            ...action.patch,
            flags: { ...issue.flags, ...action.patch.flags },
          },
        },
      };
    }
    case "STALE_FROM": {
      const issue = state.issues[action.key];
      if (!issue) return state;
      const stages = issue.s.map((status, index) =>
        index >= action.fromIdx && status === "done" ? "stale" : status,
      );
      return {
        ...state,
        issues: {
          ...state.issues,
          [action.key]: {
            ...issue,
            s: stages,
            flags: { ...issue.flags, staleDownstream: true },
          },
        },
      };
    }
    case "TOAST_ADD":
      return { ...state, toasts: [...state.toasts, action.toast] };
    case "TOAST_LEAVE":
      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === action.id ? { ...toast, leaving: true } : toast,
        ),
      };
    case "TOAST_REMOVE":
      return { ...state, toasts: state.toasts.filter((toast) => toast.id !== action.id) };
    case "DRAWER":
      return { ...state, drawer: action.drawer };
    case "MODAL":
      return { ...state, modal: action.modal };
    case "SELECT_ARTIFACT":
      return {
        ...state,
        selectedArtifact: { ...state.selectedArtifact, [action.key]: action.name },
      };
    case "PR":
      return {
        ...state,
        prState: {
          ...state.prState,
          [action.key]: { ...state.prState[action.key], ...action.patch },
        },
      };
    case "VAL":
      return {
        ...state,
        valState: {
          ...state.valState,
          [action.key]: { ...state.valState[action.key], ...action.patch },
        },
      };
    case "BUSY":
      return { ...state, busy: { ...state.busy, [action.id]: action.on } };
    case "FILTER":
      return { ...state, filters: { ...state.filters, ...action.patch } };
    case "TOGGLE_GOV": {
      const governance = state.settings.governance.map((setting) =>
        setting.id === action.id && !setting.locked ? { ...setting, on: !setting.on } : setting,
      );
      return { ...state, settings: { ...state.settings, governance } };
    }
  }
}

export type RunStageOptions = {
  failStatus?: Exclude<StageStatus, "run">;
  lifecycle?: Lifecycle;
  onDone?: () => void;
  doneMsg?: string;
  failMsg?: string;
  delay?: number;
};

export type WorkbenchActions = {
  toast: (kind: ToastKind, title: string, msg: string) => string;
  navigate: (route: Route, key?: string) => void;
  openIssue: (key: string) => void;
  openLogs: (key: string, stageId: StageId) => void;
  closeDrawer: () => void;
  openModal: (modal: WorkbenchModal) => void;
  closeModal: () => void;
  selectArtifact: (key: string, name: string) => void;
  runStage: (key: string, stageId: StageId, options?: RunStageOptions) => void;
  setStage: (key: string, stageId: StageId, status: StageStatus) => void;
  staleFrom: (key: string, stageId: StageId) => void;
  patchIssue: (key: string, patch: IssuePatch) => void;
  setPR: (key: string, patch: PullRequestOverride) => void;
  setVal: (key: string, patch: ValidationOverride) => void;
  setFilter: (patch: Partial<QueueFilters>) => void;
  toggleGov: (id: string) => void;
  dispatch: Dispatch<Action>;
};

type AppContextValue = { state: WorkbenchState; actions: WorkbenchActions };
const AppContext = createContext<AppContextValue | null>(null);
let toastId = 0;

export function AppProvider({ children }: { readonly children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  const toast = useCallback((kind: ToastKind, title: string, msg: string) => {
    const id = `t${++toastId}`;
    dispatch({ type: "TOAST_ADD", toast: { id, kind, title, msg } });
    window.setTimeout(() => dispatch({ type: "TOAST_LEAVE", id }), 4200);
    window.setTimeout(() => dispatch({ type: "TOAST_REMOVE", id }), 4600);
    return id;
  }, []);

  const navigate = useCallback(
    (route: Route, key?: string) => dispatch({ type: "ROUTE", route, ...(key ? { key } : {}) }),
    [],
  );
  const openIssue = useCallback(
    (key: string) => dispatch({ type: "SELECT_ISSUE", key, route: "issue" }),
    [],
  );
  const openLogs = useCallback(
    (key: string, stageId: StageId) =>
      dispatch({ type: "DRAWER", drawer: { type: "logs", key, stageId } }),
    [],
  );
  const closeDrawer = useCallback(() => dispatch({ type: "DRAWER", drawer: null }), []);
  const openModal = useCallback((modal: WorkbenchModal) => dispatch({ type: "MODAL", modal }), []);
  const closeModal = useCallback(() => dispatch({ type: "MODAL", modal: null }), []);
  const selectArtifact = useCallback(
    (key: string, name: string) => dispatch({ type: "SELECT_ARTIFACT", key, name }),
    [],
  );

  const runStage = useCallback(
    (key: string, stageId: StageId, options: RunStageOptions = {}) => {
      const index = stageIdx(stageId);
      const definition = stageDefs[index];
      if (!definition) throw new Error(`Missing definition for stage: ${stageId}`);
      dispatch({ type: "SET_STAGE", key, idx: index, status: "run" });
      dispatch({ type: "BUSY", id: `${key}:${stageId}`, on: true });
      toast(
        "info",
        `Running ${definition.name}…`,
        "Simulated execution in a clean workspace — no external writes.",
      );
      window.setTimeout(() => {
        const status = options.failStatus ?? "done";
        dispatch({ type: "SET_STAGE", key, idx: index, status });
        dispatch({ type: "BUSY", id: `${key}:${stageId}`, on: false });
        if (options.lifecycle) {
          dispatch({ type: "PATCH_ISSUE", key, patch: { lifecycle: options.lifecycle } });
        }
        options.onDone?.();
        if (status === "done") {
          toast(
            "success",
            `${definition.name} complete`,
            options.doneMsg ?? "Artifacts recorded with prompt provenance.",
          );
        } else {
          toast(
            "error",
            `${definition.name} failed`,
            options.failMsg ?? "Verification failed — see logs and retry.",
          );
        }
      }, options.delay ?? 1300);
    },
    [toast],
  );

  const setStage = useCallback(
    (key: string, stageId: StageId, status: StageStatus) =>
      dispatch({ type: "SET_STAGE", key, idx: stageIdx(stageId), status }),
    [],
  );
  const staleFrom = useCallback(
    (key: string, stageId: StageId) =>
      dispatch({ type: "STALE_FROM", key, fromIdx: stageIdx(stageId) }),
    [],
  );
  const patchIssue = useCallback(
    (key: string, patch: IssuePatch) => dispatch({ type: "PATCH_ISSUE", key, patch }),
    [],
  );
  const setPR = useCallback(
    (key: string, patch: PullRequestOverride) => dispatch({ type: "PR", key, patch }),
    [],
  );
  const setVal = useCallback(
    (key: string, patch: ValidationOverride) => dispatch({ type: "VAL", key, patch }),
    [],
  );
  const setFilter = useCallback(
    (patch: Partial<QueueFilters>) => dispatch({ type: "FILTER", patch }),
    [],
  );
  const toggleGov = useCallback((id: string) => dispatch({ type: "TOGGLE_GOV", id }), []);

  const actions: WorkbenchActions = {
    toast,
    navigate,
    openIssue,
    openLogs,
    closeDrawer,
    openModal,
    closeModal,
    selectArtifact,
    runStage,
    setStage,
    staleFrom,
    patchIssue,
    setPR,
    setVal,
    setFilter,
    toggleGov,
    dispatch,
  };

  return <AppContext.Provider value={{ state, actions }}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}

export function useIssue(key: string): Issue {
  const { state } = useApp();
  const issue = state.issues[key];
  if (!issue) throw new Error(`Unknown issue: ${key}`);
  return issue;
}
