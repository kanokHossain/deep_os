import { useEffect } from "react";
import { dispatch, elapsedMs, type ActiveSession } from "../lib/store";
import { playChime } from "../lib/chime";

/** Plays the chime once when a planned session reaches its length. */
export function useTimeUpChime(active: ActiveSession | null, now: number) {
  useEffect(() => {
    if (!active || !active.plannedMin || active.chimed || active.pausedAt) return;
    if (elapsedMs(active, now) >= active.plannedMin * 60000) {
      dispatch({ type: "chimed" });
      playChime();
    }
  }, [active, now]);
}
