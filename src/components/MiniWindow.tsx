import { useNow } from "../hooks/useNow";
import { useTimeUpChime } from "../hooks/useTimeUpChime";
import { dispatch, elapsedMs, useStore } from "../lib/store";
import { formatClock } from "../lib/time";
import { CheckIcon, PauseIcon, PlayIcon } from "./Icons";
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
  const pct = planned ? Math.min(100, (el / planned) * 100) : ((el % 3600000) / 3600000) * 100;

  return (
    <div className={active.pausedAt ? "mini paused" : "mini"}>
      <div className="mini-top">
        <p className="mini-task" title={active.task}>
          {active.task}
        </p>
        <div className="mini-actions">
          <button
            type="button"
            className="round small-round"
            aria-label={active.pausedAt ? "Resume" : "Pause"}
            onClick={() => dispatch({ type: active.pausedAt ? "resume" : "pause", now: Date.now() })}
          >
            {active.pausedAt ? <PlayIcon /> : <PauseIcon />}
          </button>
          <button
            type="button"
            className="round small-round done"
            aria-label="Task done"
            onClick={() => dispatch({ type: "end", outcome: "done", now: Date.now() })}
          >
            <CheckIcon />
          </button>
        </div>
      </div>
      <div className={over ? "mini-clock over" : "mini-clock"}>
        {planned ? (over ? `+${formatClock(el - planned)}` : formatClock(planned - el)) : formatClock(el)}
      </div>
      <div className={over ? "mini-bar over" : "mini-bar"}>
        <i style={{ width: `${pct}%` }} />
      </div>
      <ParkBox task={active.task} compact />
    </div>
  );
}
