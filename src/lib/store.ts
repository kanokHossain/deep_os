import { useSyncExternalStore } from "react";

export interface ActiveSession {
  id: string;
  task: string;
  startedAt: number;
  /** Planned length in minutes. 0 = open-ended flow session. */
  plannedMin: number;
  /** Set while paused. */
  pausedAt: number | null;
  /** Total time spent paused so far. */
  pausedMs: number;
  parked: number;
  chimed: boolean;
}

export interface InboxItem {
  id: string;
  text: string;
  createdAt: number;
  fromTask: string | null;
  status: "new" | "later";
}

export interface LogEntry {
  id: string;
  task: string;
  startedAt: number;
  endedAt: number;
  focusedMs: number;
  plannedMin: number;
  parked: number;
  outcome: "done" | "stopped";
}

export interface State {
  version: 1;
  active: ActiveSession | null;
  draft: { task: string; plannedMin: number };
  inbox: InboxItem[];
  log: LogEntry[];
}

export type Action =
  | { type: "start"; task: string; startedAt: number; plannedMin: number; now: number }
  | { type: "pause"; now: number }
  | { type: "resume"; now: number }
  | { type: "end"; outcome: LogEntry["outcome"]; now: number }
  | { type: "chimed" }
  | { type: "park"; text: string; now: number }
  | { type: "addInbox"; text: string; now: number }
  | { type: "later"; id: string }
  | { type: "drop"; id: string }
  | { type: "restore"; item: InboxItem; index: number }
  | { type: "promote"; id: string }
  | { type: "setDraft"; task?: string; plannedMin?: number }
  | { type: "clearLog" }
  | { type: "replace"; state: State };

export const emptyState = (): State => ({
  version: 1,
  active: null,
  draft: { task: "", plannedMin: 25 },
  inbox: [],
  log: [],
});

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

/** Focused time so far, excluding pauses. Computed from timestamps, so it never drifts. */
export function elapsedMs(a: ActiveSession, now: number): number {
  const until = a.pausedAt ?? now;
  return Math.max(0, until - a.startedAt - a.pausedMs);
}

export function reduce(state: State, action: Action): State {
  switch (action.type) {
    case "start": {
      const task = action.task.trim();
      if (!task || state.active) return state;
      return {
        ...state,
        active: {
          id: uid(),
          task,
          startedAt: Math.min(action.startedAt, action.now),
          plannedMin: action.plannedMin,
          pausedAt: null,
          pausedMs: 0,
          parked: 0,
          chimed: false,
        },
        draft: { task: "", plannedMin: action.plannedMin },
      };
    }
    case "pause":
      if (!state.active || state.active.pausedAt) return state;
      return { ...state, active: { ...state.active, pausedAt: action.now } };
    case "resume": {
      const a = state.active;
      if (!a || !a.pausedAt) return state;
      return { ...state, active: { ...a, pausedAt: null, pausedMs: a.pausedMs + (action.now - a.pausedAt) } };
    }
    case "end": {
      const a = state.active;
      if (!a) return state;
      const entry: LogEntry = {
        id: a.id,
        task: a.task,
        startedAt: a.startedAt,
        endedAt: action.now,
        focusedMs: elapsedMs(a, action.now),
        plannedMin: a.plannedMin,
        parked: a.parked,
        outcome: action.outcome,
      };
      return { ...state, active: null, log: [entry, ...state.log].slice(0, 1000) };
    }
    case "chimed":
      if (!state.active) return state;
      return { ...state, active: { ...state.active, chimed: true } };
    case "park": {
      const text = action.text.trim();
      if (!text) return state;
      const item: InboxItem = { id: uid(), text, createdAt: action.now, fromTask: state.active?.task ?? null, status: "new" };
      return {
        ...state,
        inbox: [item, ...state.inbox],
        active: state.active ? { ...state.active, parked: state.active.parked + 1 } : null,
      };
    }
    case "addInbox": {
      const text = action.text.trim();
      if (!text) return state;
      return { ...state, inbox: [{ id: uid(), text, createdAt: action.now, fromTask: null, status: "new" }, ...state.inbox] };
    }
    case "later":
      return { ...state, inbox: state.inbox.map((i) => (i.id === action.id ? { ...i, status: "later" } : i)) };
    case "drop":
      return { ...state, inbox: state.inbox.filter((i) => i.id !== action.id) };
    case "restore": {
      if (state.inbox.some((i) => i.id === action.item.id)) return state;
      const inbox = [...state.inbox];
      inbox.splice(Math.min(action.index, inbox.length), 0, action.item);
      return { ...state, inbox };
    }
    case "promote": {
      const item = state.inbox.find((i) => i.id === action.id);
      if (!item) return state;
      return { ...state, inbox: state.inbox.filter((i) => i.id !== action.id), draft: { ...state.draft, task: item.text } };
    }
    case "setDraft":
      return { ...state, draft: { ...state.draft, ...stripUndefined(action) } };
    case "clearLog":
      return { ...state, log: [] };
    case "replace":
      return action.state;
  }
}

function stripUndefined(a: { task?: string; plannedMin?: number }) {
  const out: { task?: string; plannedMin?: number } = {};
  if (a.task !== undefined) out.task = a.task;
  if (a.plannedMin !== undefined) out.plannedMin = a.plannedMin;
  return out;
}

/** Accepts unknown JSON (from storage or a backup file) and returns a valid State or null. */
export function parseState(raw: unknown): State | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<State>;
  if (r.version !== 1 || !Array.isArray(r.inbox) || !Array.isArray(r.log)) return null;
  return {
    version: 1,
    active: r.active && typeof r.active === "object" && typeof r.active.task === "string" ? r.active : null,
    draft: r.draft && typeof r.draft.task === "string" ? r.draft : { task: "", plannedMin: 25 },
    inbox: r.inbox.filter((i) => i && typeof i.text === "string"),
    log: r.log.filter((l) => l && typeof l.task === "string"),
  };
}

// ---------- external store, shared by the main window and the floating window ----------

const KEY = "deepos.v1";

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    return (raw && parseState(JSON.parse(raw))) || emptyState();
  } catch {
    return emptyState();
  }
}

let state: State = typeof window === "undefined" ? emptyState() : load();
const listeners = new Set<() => void>();

export function getState() {
  return state;
}

export function dispatch(action: Action) {
  const next = reduce(state, action);
  if (next === state) return;
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked: keep working in memory */
  }
  listeners.forEach((l) => l());
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

if (typeof window !== "undefined") {
  // Keep several open tabs in sync.
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY || !e.newValue) return;
    try {
      const parsed = parseState(JSON.parse(e.newValue));
      if (parsed) {
        state = parsed;
        listeners.forEach((l) => l());
      }
    } catch {
      /* ignore malformed */
    }
  });
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state));
}
