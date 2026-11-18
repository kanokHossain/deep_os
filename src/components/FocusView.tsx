import { useEffect, useRef, useState } from "react";
import { unlockAudio } from "../lib/chime";
import { dispatch, elapsedMs, useStore, type ActiveSession } from "../lib/store";
import { dayKey, formatClock, formatDuration, formatTime, startFromTimeInput, timeInputValue } from "../lib/time";
import { CheckIcon, PauseIcon, PlayIcon, StopIcon } from "./Icons";
import { ParkBox } from "./ParkBox";
import { Ring } from "./Ring";

const PRESETS = [15, 25, 45, 60, 90, 0];

// Example tasks for the empty task box; one is picked per visit.
const EXAMPLES = [
  "Start focusing on product requirement preparation",
  "Start focusing on the client proposal draft",
  "Start focusing on reviewing pull requests",
  "Start focusing on the weekly status report",
  "Start focusing on sprint planning notes",
];

export function FocusView({ now, goInbox }: { now: number; goInbox: () => void }) {
  const active = useStore((s) => s.active);
  return active ? <ActiveSessionView active={active} now={now} /> : <StartScreen goInbox={goInbox} />;
}

function ActiveSessionView({ active, now }: { active: ActiveSession; now: number }) {
  const parkRef = useRef<HTMLInputElement>(null);
  const el = elapsedMs(active, now);
  const planned = active.plannedMin * 60000;
  const left = planned - el;
  const over = planned > 0 && left < 0;
  const paused = active.pausedAt !== null;
  // Open sessions loop the ring once an hour.
  const progress = planned ? el / planned : (el % 3600000) / 3600000;


  return (
    <section className="session" aria-labelledby="task-heading">
      <header className="session-head">
        <span className={paused ? "status paused" : "status live"}>{paused ? "Paused. Take a breath." : "In focus"}</span>
        <h1 id="task-heading">{active.task}</h1>
      </header>

      <Ring progress={progress} over={over} paused={paused}>
        <div className="clock" aria-label="Focused time">
          {formatClock(el)}
        </div>
        <div className="clock-sub">
          {planned ? (over ? `${formatClock(-left)} over plan` : `${formatClock(left)} left`) : "Open session"}
        </div>
      </Ring>

      <div className="controls">
        <button
          type="button"
          className="round"
          aria-label={paused ? "Resume" : "Pause"}
          title={paused ? "Resume (Space)" : "Pause (Space)"}
          onClick={() => dispatch({ type: paused ? "resume" : "pause", now: Date.now() })}
        >
          {paused ? <PlayIcon /> : <PauseIcon />}
        </button>
        <button type="button" className="primary big" onClick={() => dispatch({ type: "end", outcome: "done", now: Date.now() })}>
          <CheckIcon /> Done
        </button>
        <button
          type="button"
          className="round"
          aria-label="Stop for now"
          title="Stop for now (S)"
          onClick={() => dispatch({ type: "end", outcome: "stopped", now: Date.now() })}
        >
          <StopIcon />
        </button>
      </div>

      <div className="session-meta">
        Started {formatTime(active.startedAt)}
        {active.plannedMin ? ` for ${active.plannedMin} min` : ""}
        {active.parked ? ` · ${active.parked} thought${active.parked === 1 ? "" : "s"} off your mind` : ""}
      </div>

      <ParkBox ref={parkRef} task={active.task} />
    </section>
  );
}

function greeting(now: number) {
  const h = new Date(now).getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function StartScreen({ goInbox }: { goInbox: () => void }) {
  const draft = useStore((s) => s.draft);
  const log = useStore((s) => s.log);
  const inbox = useStore((s) => s.inbox);
  const [mountedAt] = useState(() => Date.now());
  const [startTime, setStartTime] = useState(() => timeInputValue(Date.now()));
  const [showTime, setShowTime] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const taskRef = useRef<HTMLInputElement>(null);
  const [example] = useState(() => EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)]);

  const last = log[0];
  const showSummary = last && last.endedAt >= mountedAt - 1000 && dismissed !== last.id;
  const waiting = inbox.filter((i) => i.status === "new").length;
  const firstVisit = log.length === 0 && inbox.length === 0;
  const today = dayKey(Date.now());
  const todays = log.filter((l) => dayKey(l.startedAt) === today);
  const todayMs = todays.reduce((sum, l) => sum + l.focusedMs, 0);
  const todayParked = todays.reduce((sum, l) => sum + l.parked, 0);

  useEffect(() => {
    taskRef.current?.focus();
  }, [draft.task === ""]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = () => {
    if (!draft.task.trim()) {
      taskRef.current?.focus();
      return;
    }
    unlockAudio();
    const n = Date.now();
    dispatch({
      type: "start",
      task: draft.task,
      startedAt: showTime ? startFromTimeInput(startTime, n) : n,
      plannedMin: draft.plannedMin,
      now: n,
    });
  };

  return (
    <section className="start" aria-labelledby="start-heading">
      {showSummary && (
        <div className="surface-msg" role="status">
          <CheckIcon />
          <div>
            <strong>
              {last.outcome === "done" ? "Done" : "Paused"}: {formatDuration(last.focusedMs)} on {last.task}.
            </strong>
            <span>
              {last.parked
                ? ` ${last.parked} thought${last.parked > 1 ? "s" : ""} parked instead of chased. They're waiting in your brain dump.`
                : " Nothing pulled you away. Clear mind."}
            </span>
          </div>
          <div className="row">
            {waiting > 0 && (
              <button type="button" className="ghost small" onClick={goInbox}>
                Sort them now
              </button>
            )}
            <button type="button" className="ghost small" onClick={() => setDismissed(last.id)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <p className="hello">{greeting(Date.now())}. Everything else can wait.</p>
      <h1 id="start-heading">What deserves your focus now?</h1>

      <form
        className="start-form"
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          start();
        }}
      >
        <input
          ref={taskRef}
          id="task-input"
          className="task-input"
          type="text"
          maxLength={160}
          aria-label="Task"
          placeholder={example}
          value={draft.task}
          onChange={(e) => dispatch({ type: "setDraft", task: e.target.value })}
        />

        <div className="dive-row">
          <div className="chips" role="group" aria-label="Session length">
            {PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                className="chip"
                aria-pressed={draft.plannedMin === m}
                onClick={() => dispatch({ type: "setDraft", plannedMin: m })}
              >
                {m ? `${m}m` : "Open"}
              </button>
            ))}
          </div>
          <button type="submit" className="primary big dive">
            Start focus
          </button>
        </div>

        <div className="start-extra">
          {showTime ? (
            <label className="inline-time">
              Started at
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </label>
          ) : (
            <button type="button" className="link" onClick={() => setShowTime(true)}>
              Already started? Set an earlier start time
            </button>
          )}
          {waiting > 0 && !showSummary && (
            <button type="button" className="link" onClick={goInbox}>
              {waiting} thought{waiting > 1 ? "s" : ""} waiting in your brain dump
            </button>
          )}
        </div>
      </form>

      {todays.length > 0 && (
        <section className="today-tiles" aria-label="Today so far">
          <div className="tile tile-main">
            <span className="tile-label">Focused today</span>
            <b className="tile-value">{formatDuration(todayMs)}</b>
            <div className="tile-bar" aria-hidden="true">
              {todays
                .slice()
                .reverse()
                .map((l) => (
                  <i key={l.id} style={{ flexGrow: Math.max(1, Math.round(l.focusedMs / 60000)) }} title={`${l.task}: ${formatDuration(l.focusedMs)}`} />
                ))}
            </div>
          </div>
          <div className="tile">
            <span className="tile-label">Sessions</span>
            <b className="tile-value">{todays.length}</b>
          </div>
          <div className="tile tile-sun">
            <span className="tile-label">Thoughts parked</span>
            <b className="tile-value">{todayParked}</b>
          </div>
        </section>
      )}

      {firstVisit && (
        <ol className="how">
          <li>
            <b>Pick one thing</b>
            <span>Name it and start. For now, nothing else needs you.</span>
          </li>
          <li>
            <b>Park what buzzes</b>
            <span>A worry, a to-do, an idea? Type it once and let it go. It's saved.</span>
          </li>
          <li>
            <b>Sort it later</b>
            <span>When you're done, go through your brain dump: start it, keep it, or let it go.</span>
          </li>
        </ol>
      )}
    </section>
  );
}
