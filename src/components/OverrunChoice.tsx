import { useEffect, useRef } from "react";
import { cancelFinish, resolveFinish, usePendingFinish } from "../lib/finish";
import { elapsedMs, useStore } from "../lib/store";
import { formatDuration } from "../lib/time";
import { toast } from "./Toast";

/**
 * Shown when someone ends a session that ran well past its plan, usually because the timer
 * was forgotten. Counting the planned time keeps Analytics honest; full time is one tap away.
 */
export function OverrunChoice({ inline = false }: { inline?: boolean }) {
  const pending = usePendingFinish();
  const active = useStore((s) => s.active);
  const firstRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (pending && !inline) firstRef.current?.focus();
  }, [pending, inline]);
  if (!pending || !active) return null;

  const now = Date.now();
  const elapsed = elapsedMs(active, now);
  const over = elapsed - active.plannedMin * 60000;
  const done = pending.outcome === "done" ? "Marked done" : "Stopped. It's waiting in your brain dump.";
  const choose = (count: "planned" | "full") => {
    resolveFinish(count);
    toast(done);
  };

  const body = (
    <>
      <p className="overrun-title" id="overrun-title">
        This session ran {formatDuration(over)} past your {active.plannedMin} min plan.
      </p>
      <p className="overrun-sub">How much focus time should we count?</p>
      <div className="overrun-actions">
        <button ref={firstRef} type="button" className="primary" onClick={() => choose("planned")}>
          {active.plannedMin} min, as planned
        </button>
        <button type="button" className="ghost" onClick={() => choose("full")}>
          Full {formatDuration(elapsed)}
        </button>
      </div>
      <button type="button" className="overrun-cancel" onClick={cancelFinish}>
        Keep the timer running
      </button>
    </>
  );

  if (inline) return <div className="overrun overrun-inline">{body}</div>;
  return (
    <div className="overlay" onClick={cancelFinish}>
      <div
        className="dialog overrun"
        role="dialog"
        aria-modal="true"
        aria-labelledby="overrun-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") cancelFinish();
        }}
      >
        {body}
      </div>
    </div>
  );
}
