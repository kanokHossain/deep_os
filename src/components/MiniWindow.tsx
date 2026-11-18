import { useState } from "react";
import { useNow } from "../hooks/useNow";
import { useTimeUpChime } from "../hooks/useTimeUpChime";
import { unlockAudio } from "../lib/chime";
import { dispatch, elapsedMs, useStore } from "../lib/store";
import { formatClock } from "../lib/time";
import { CheckIcon, PauseIcon, PlayIcon } from "./Icons";
import { ParkBox } from "./ParkBox";

/**
 * The pop-out window. It floats above every app on the computer and can be dragged anywhere.
 * With no task running it lets you start one; during a task it shows the clock and a park box.
 */
export function MiniWindow({ win }: { win: Window; onClose: () => void }) {
  const active = useStore((s) => s.active);
  const draft = useStore((s) => s.draft);
  const waiting = useStore((s) => s.inbox.filter((i) => i.status === "new").length);
  const now = useNow(win);
  const [task, setTask] = useState(draft.task);
  useTimeUpChime(active, now);

  if (!active) {
    return (
      <div className="mini">
        <p className="mini-title">What deserves your focus now?</p>
        <form
          className="mini-start"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            if (!task.trim()) return;
            unlockAudio();
            const n = Date.now();
            dispatch({ type: "start", task, startedAt: n, plannedMin: draft.plannedMin, now: n });
            setTask("");
          }}
        >
          <input value={task} onChange={(e) => setTask(e.target.value)} placeholder="Name your task" aria-label="Task" />
          <button type="submit" className="primary small">
            Start {draft.plannedMin ? `${draft.plannedMin}m` : ""}
          </button>
        </form>
        <ParkBox task="your day" compact />
        {waiting > 0 && <p className="mini-note">{waiting} thought{waiting > 1 ? "s" : ""} in your brain dump</p>}
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
            aria-label="Done"
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
