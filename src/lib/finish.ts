import { useSyncExternalStore } from "react";
import { dispatch, elapsedMs, getState, type LogEntry } from "./store";

/** A session this far past its plan asks how much time to count. */
export const OVERRUN_ASK_MS = 15 * 60000;

type Pending = { outcome: LogEntry["outcome"] } | null;
let pending: Pending = null;
const listeners = new Set<() => void>();
const set = (p: Pending) => {
  pending = p;
  listeners.forEach((l) => l());
};

export function usePendingFinish(): Pending {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => pending,
  );
}

/** How far past its planned length the running session is (0 when not over, or open-ended). */
export function overrunMs(now: number): number {
  const a = getState().active;
  if (!a || !a.plannedMin) return 0;
  return Math.max(0, elapsedMs(a, now) - a.plannedMin * 60000);
}

/**
 * End the running session. If it ran well past its plan (someone likely forgot the timer),
 * ask first whether to count the planned time or the full time. Returns true if it ended now.
 */
export function finishSession(outcome: LogEntry["outcome"]): boolean {
  if (!getState().active) return false;
  if (overrunMs(Date.now()) > OVERRUN_ASK_MS) {
    set({ outcome });
    return false;
  }
  dispatch({ type: "end", outcome, now: Date.now() });
  return true;
}

/** Answer the overrun question: count the planned length, or everything. */
export function resolveFinish(count: "planned" | "full") {
  const a = getState().active;
  const p = pending;
  set(null);
  if (!a || !p) return;
  const now = Date.now();
  const focusedMs = count === "planned" ? a.plannedMin * 60000 : elapsedMs(a, now);
  dispatch({ type: "end", outcome: p.outcome, now, focusedMs });
}

export function cancelFinish() {
  set(null);
}
