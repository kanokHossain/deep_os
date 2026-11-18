import { useNow } from "../hooks/useNow";
import { useTimeUpChime } from "../hooks/useTimeUpChime";
import { dispatch, elapsedMs, useStore } from "../lib/store";
import { formatClock } from "../lib/time";
import { ParkBox } from "./ParkBox";

/** What the always-on-top floating window shows. */
export function MiniWindow({ win, onClose }: { win: Window; onClose: () => void }) {
  const active = useStore((s) => s.active);
  const now = useNow(win);
  useTimeUpChime(active, now);

  if (!active) {
    return (
      <div className="mini">
        <p className="mini-task">Session finished.</p>
        <button type="button" className="ghost small" onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  const el = elapsedMs(active, now);
  const planned = active.plannedMin * 60000;
  const over = planned > 0 && el > planned;

  return (
    <div className="mini">
      <p className="mini-task" title={active.task}>
        {active.task}
      </p>
      <div className={over ? "mini-clock over" : "mini-clock"}>
        {planned ? (over ? `+${formatClock(el - planned)}` : formatClock(planned - el)) : formatClock(el)}
      </div>
      {planned > 0 && (
        <div className={over ? "bar over" : "bar"}>
          <i style={{ width: `${Math.min(100, (el / planned) * 100)}%` }} />
        </div>
      )}
      <ParkBox task={active.task} compact />
      <div className="mini-actions">
        {active.pausedAt ? (
          <button type="button" className="ghost small" onClick={() => dispatch({ type: "resume", now: Date.now() })}>
            Resume
          </button>
        ) : (
          <button type="button" className="ghost small" onClick={() => dispatch({ type: "pause", now: Date.now() })}>
            Pause
          </button>
        )}
        <button type="button" className="primary small" onClick={() => dispatch({ type: "end", outcome: "done", now: Date.now() })}>
          Done
        </button>
      </div>
    </div>
  );
}
