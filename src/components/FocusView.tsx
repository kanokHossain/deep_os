import { useEffect, useRef, useState } from "react";
import { unlockAudio } from "../lib/chime";
import { dispatch, elapsedMs, useStore, type ActiveSession } from "../lib/store";
import { formatClock, formatDuration, formatTime, startFromTimeInput, timeInputValue } from "../lib/time";
import { ParkBox } from "./ParkBox";
import { toast } from "./Toast";

const PRESETS = [15, 25, 45, 60, 90, 0];

interface Floating {
  supported: boolean;
  isOpen: boolean;
  open: () => Promise<boolean>;
}

export function FocusView({ now, floating, goInbox }: { now: number; floating: Floating; goInbox: () => void }) {
  const active = useStore((s) => s.active);
  return active ? (
    <ActiveSessionCard active={active} now={now} floating={floating} />
  ) : (
    <StartScreen goInbox={goInbox} />
  );
}

function ActiveSessionCard({ active, now, floating }: { active: ActiveSession; now: number; floating: Floating }) {
  const parkRef = useRef<HTMLInputElement>(null);
  const el = elapsedMs(active, now);
  const planned = active.plannedMin * 60000;
  const left = planned - el;
  const paused = active.pausedAt !== null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test((document.activeElement?.tagName ?? "").toUpperCase());
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        parkRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section className="card session" aria-labelledby="task-heading">
      <div>
        <div className="eyebrow">{paused ? "Paused" : "Working on"}</div>
        <h1 id="task-heading">{active.task}</h1>
      </div>
      <div className={paused ? "clock paused" : "clock"} aria-label="Focused time">
        {formatClock(el)}
      </div>
      {planned > 0 && (
        <div className={left < 0 ? "bar over" : "bar"}>
          <i style={{ width: `${Math.min(100, (el / planned) * 100)}%` }} />
        </div>
      )}
      <div className="meta">
        <span>
          Started <strong>{formatTime(active.startedAt)}</strong>
        </span>
        {planned > 0 ? (
          left >= 0 ? (
            <span>
              <strong>{formatClock(left)}</strong> left of {active.plannedMin} min
            </span>
          ) : (
            <span>
              Over plan by <strong>{formatClock(-left)}</strong>
            </span>
          )
        ) : (
          <span>Open session</span>
        )}
        <span>
          Parked <strong>{active.parked}</strong>
        </span>
      </div>

      <ParkBox ref={parkRef} task={active.task} />

      <div className="row">
        <button type="button" className="primary" onClick={() => dispatch({ type: "end", outcome: "done", now: Date.now() })}>
          Task done
        </button>
        {paused ? (
          <button type="button" className="ghost" onClick={() => dispatch({ type: "resume", now: Date.now() })}>
            Resume
          </button>
        ) : (
          <button type="button" className="ghost" onClick={() => dispatch({ type: "pause", now: Date.now() })}>
            Pause
          </button>
        )}
        <button type="button" className="ghost" onClick={() => dispatch({ type: "end", outcome: "stopped", now: Date.now() })}>
          Stop for now
        </button>
        {floating.supported && !floating.isOpen && (
          <button
            type="button"
            className="ghost"
            onClick={async () => {
              if (!(await floating.open())) toast("Your browser blocked the floating window");
            }}
          >
            Float on top
          </button>
        )}
      </div>
      <p className="hint">
        Press <kbd>P</kbd> to park a thought.
        {floating.supported ? " Float on top keeps a mini timer above your other apps." : ""}
      </p>
    </section>
  );
}

function StartScreen({ goInbox }: { goInbox: () => void }) {
  const draft = useStore((s) => s.draft);
  const log = useStore((s) => s.log);
  const inbox = useStore((s) => s.inbox);
  const [mountedAt] = useState(() => Date.now());
  const [startTime, setStartTime] = useState(() => timeInputValue(Date.now()));
  const [dismissed, setDismissed] = useState<string | null>(null);
  const taskRef = useRef<HTMLInputElement>(null);

  const last = log[0];
  const showSummary = last && last.endedAt >= mountedAt - 1000 && dismissed !== last.id;
  const waiting = inbox.filter((i) => i.status === "new").length;
  const firstVisit = log.length === 0 && inbox.length === 0;

  useEffect(() => {
    if (draft.task) taskRef.current?.focus();
  }, [draft.task]);

  return (
    <>
      {showSummary && (
        <section className="card summary">
          <h2>
            {last.outcome === "done" ? "Done." : "Paused."} {formatDuration(last.focusedMs)} on {last.task}
          </h2>
          <p className="hint">
            {last.parked
              ? `You parked ${last.parked} thought${last.parked > 1 ? "s" : ""} instead of chasing ${last.parked > 1 ? "them" : "it"}.`
              : "No thoughts parked. Clean session."}
          </p>
          <div className="row">
            {waiting > 0 && (
              <button type="button" className="ghost small" onClick={goInbox}>
                Review inbox ({waiting})
              </button>
            )}
            <button type="button" className="ghost small" onClick={() => setDismissed(last.id)}>
              Dismiss
            </button>
          </div>
        </section>
      )}

      <section className="card" aria-labelledby="start-heading">
        <h1 id="start-heading">What's the one thing?</h1>
        <form
          className="stack"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.task.trim()) return;
            unlockAudio();
            const n = Date.now();
            dispatch({ type: "start", task: draft.task, startedAt: startFromTimeInput(startTime, n), plannedMin: draft.plannedMin, now: n });
          }}
        >
          <div className="field">
            <label htmlFor="task-input">Task</label>
            <input
              ref={taskRef}
              id="task-input"
              type="text"
              required
              maxLength={160}
              placeholder="e.g. Draft the release notes"
              value={draft.task}
              onChange={(e) => dispatch({ type: "setDraft", task: e.target.value })}
            />
          </div>
          <div className="row align-end">
            <div className="field">
              <label htmlFor="start-input">Start time</label>
              <input id="start-input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="field grow">
              <span className="label" id="plan-label">
                Planned length
              </span>
              <div className="chips" role="group" aria-labelledby="plan-label">
                {PRESETS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className="chip"
                    aria-pressed={draft.plannedMin === m}
                    onClick={() => dispatch({ type: "setDraft", plannedMin: m })}
                  >
                    {m ? `${m} min` : "Open"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="row">
            <button type="submit" className="primary">
              Start focusing
            </button>
            <p className="hint grow">Started already? Set the start time earlier.</p>
          </div>
        </form>
      </section>

      {firstVisit && (
        <section className="how" aria-label="How it works">
          <div>
            <b>1. Pick one task</b>
            <span>Name it and start the clock. Only this task matters now.</span>
          </div>
          <div>
            <b>2. Park every other thought</b>
            <span>An idea or to-do pops up? Type it into the park box and get back to work.</span>
          </div>
          <div>
            <b>3. Review later</b>
            <span>After the session, go through your inbox: focus on it, keep it for later, or drop it.</span>
          </div>
        </section>
      )}
    </>
  );
}
