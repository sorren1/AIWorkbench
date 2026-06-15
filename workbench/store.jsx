/* ============================================================
   AI Delivery Workbench — App state store
   A small React context store that simulates the platform's
   services entirely in local state: stage runs with timed
   loading, stale cascades, toasts, drawers, modals, PR &
   validation state. No external calls.
   ============================================================ */
const { createContext, useContext, useReducer, useRef, useCallback } = React;
const STAGE_IDS = window.WBData.stageDefs.map((s) => s.id);
const stageIdx = (id) => STAGE_IDS.indexOf(id);

function cloneIssues() {
  const map = {};
  window.WBData.issues.forEach((it) => {
    map[it.key] = { ...it, s: [...it.s], flags: { ...it.flags } };
  });
  return map;
}

const initialState = {
  route: "queue",
  selectedKey: "FIN-1150",
  issues: cloneIssues(),
  toasts: [],
  drawer: null,
  modal: null,
  selectedArtifact: {},
  prState: {},        // key -> { reviewed, status, checks override, approvedForValidation }
  valState: {},       // key -> { decision, scenarioStatus overrides... }
  settings: JSON.parse(JSON.stringify(window.WBData.settings)),
  busy: {},
  filters: { search: "", assignedToMe: false, lifecycle: "", surface: "", hasPR: false, needsReview: false, failed: false, stale: false },
};

let TID = 0;

function reducer(state, a) {
  switch (a.type) {
    case "ROUTE":
      return { ...state, route: a.route, selectedKey: a.key || state.selectedKey };
    case "SELECT_ISSUE":
      return { ...state, selectedKey: a.key, route: a.route || "issue" };
    case "SET_STAGE": {
      const it = state.issues[a.key]; if (!it) return state;
      const s = [...it.s]; s[a.idx] = a.status;
      return { ...state, issues: { ...state.issues, [a.key]: { ...it, s } } };
    }
    case "PATCH_ISSUE": {
      const it = state.issues[a.key]; if (!it) return state;
      return { ...state, issues: { ...state.issues, [a.key]: { ...it, ...a.patch, flags: { ...it.flags, ...(a.patch.flags || {}) } } } };
    }
    case "STALE_FROM": {
      const it = state.issues[a.key]; if (!it) return state;
      const s = it.s.map((v, i) => (i >= a.fromIdx && (v === "done")) ? "stale" : v);
      return { ...state, issues: { ...state.issues, [a.key]: { ...it, s, flags: { ...it.flags, staleDownstream: true } } } };
    }
    case "TOAST_ADD":
      return { ...state, toasts: [...state.toasts, a.toast] };
    case "TOAST_LEAVE":
      return { ...state, toasts: state.toasts.map((t) => t.id === a.id ? { ...t, leaving: true } : t) };
    case "TOAST_REMOVE":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== a.id) };
    case "DRAWER":
      return { ...state, drawer: a.drawer };
    case "MODAL":
      return { ...state, modal: a.modal };
    case "SELECT_ARTIFACT":
      return { ...state, selectedArtifact: { ...state.selectedArtifact, [a.key]: a.name } };
    case "PR":
      return { ...state, prState: { ...state.prState, [a.key]: { ...(state.prState[a.key] || {}), ...a.patch } } };
    case "VAL":
      return { ...state, valState: { ...state.valState, [a.key]: { ...(state.valState[a.key] || {}), ...a.patch } } };
    case "BUSY":
      return { ...state, busy: { ...state.busy, [a.id]: a.on } };
    case "FILTER":
      return { ...state, filters: { ...state.filters, ...a.patch } };
    case "TOGGLE_GOV": {
      const gov = state.settings.governance.map((g) => g.id === a.id && !g.locked ? { ...g, on: !g.on } : g);
      return { ...state, settings: { ...state.settings, governance: gov } };
    }
    default:
      return state;
  }
}

const AppCtx = createContext(null);

function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const toast = useCallback((kind, title, msg) => {
    const id = "t" + (++TID);
    dispatch({ type: "TOAST_ADD", toast: { id, kind, title, msg } });
    setTimeout(() => dispatch({ type: "TOAST_LEAVE", id }), 4200);
    setTimeout(() => dispatch({ type: "TOAST_REMOVE", id }), 4600);
    return id;
  }, []);

  const navigate = useCallback((route, key) => dispatch({ type: "ROUTE", route, key }), []);
  const openIssue = useCallback((key) => dispatch({ type: "SELECT_ISSUE", key, route: "issue" }), []);

  const openLogs = useCallback((key, stageId) => dispatch({ type: "DRAWER", drawer: { type: "logs", key, stageId } }), []);
  const closeDrawer = useCallback(() => dispatch({ type: "DRAWER", drawer: null }), []);
  const openModal = useCallback((modal) => dispatch({ type: "MODAL", modal }), []);
  const closeModal = useCallback(() => dispatch({ type: "MODAL", modal: null }), []);

  const selectArtifact = useCallback((key, name) => dispatch({ type: "SELECT_ARTIFACT", key, name }), []);

  // Run a stage with simulated loading
  const runStage = useCallback((key, stageId, opts = {}) => {
    const idx = stageIdx(stageId);
    const def = window.WBData.stageDefs[idx];
    dispatch({ type: "SET_STAGE", key, idx, status: "run" });
    dispatch({ type: "BUSY", id: key + ":" + stageId, on: true });
    toast("info", "Running " + def.name + "…", "Simulated execution in a clean workspace — no external writes.");
    setTimeout(() => {
      const status = opts.failStatus || "done";
      dispatch({ type: "SET_STAGE", key, idx, status });
      dispatch({ type: "BUSY", id: key + ":" + stageId, on: false });
      if (opts.lifecycle) dispatch({ type: "PATCH_ISSUE", key, patch: { lifecycle: opts.lifecycle } });
      if (opts.onDone) opts.onDone();
      if (status === "done") {
        toast("success", def.name + " complete", opts.doneMsg || "Artifacts recorded with prompt provenance.");
      } else {
        toast("error", def.name + " failed", opts.failMsg || "Verification failed — see logs and retry.");
      }
    }, opts.delay || 1300);
  }, [toast]);

  const setStage = useCallback((key, stageId, status) => dispatch({ type: "SET_STAGE", key, idx: stageIdx(stageId), status }), []);
  const staleFrom = useCallback((key, stageId) => dispatch({ type: "STALE_FROM", key, fromIdx: stageIdx(stageId) }), []);
  const patchIssue = useCallback((key, patch) => dispatch({ type: "PATCH_ISSUE", key, patch }), []);
  const setPR = useCallback((key, patch) => dispatch({ type: "PR", key, patch }), []);
  const setVal = useCallback((key, patch) => dispatch({ type: "VAL", key, patch }), []);
  const setFilter = useCallback((patch) => dispatch({ type: "FILTER", patch }), []);
  const toggleGov = useCallback((id) => dispatch({ type: "TOGGLE_GOV", id }), []);

  const actions = {
    toast, navigate, openIssue, openLogs, closeDrawer, openModal, closeModal,
    selectArtifact, runStage, setStage, staleFrom, patchIssue, setPR, setVal,
    setFilter, toggleGov, dispatch,
  };

  return <AppCtx.Provider value={{ state, actions }}>{children}</AppCtx.Provider>;
}

function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

// Helper: the live (mutable) issue object
function useIssue(key) {
  const { state } = useApp();
  return state.issues[key];
}

Object.assign(window, { AppProvider, useApp, useIssue, stageIdx, STAGE_IDS });
