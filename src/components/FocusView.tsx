import { useEffect, useRef, useState } from "react";
import { unlockAudio } from "../lib/chime";
import { dispatch, elapsedMs, useStore, type ActiveSession } from "../lib/store";
import { dayKey, formatClock, formatDuration, formatTime } from "../lib/time";
import { toast } from "./Toast";
import { CheckIcon, ClockIcon, CloseIcon, KeyboardIcon, LayersIcon, PauseIcon, PlayIcon, PopoutIcon, StopIcon, ThoughtIcon } from "./Icons";
import { ParkBox } from "./ParkBox";
import { Ring } from "./Ring";

const PRESETS = [15, 25, 45, 0];

// Example tasks for the empty task box; one is picked per visit.
const EXAMPLES = [
  "Product requirement preparation",
  "Client proposal draft",
  "Review pull requests",
  "Weekly status report",
  "Sprint planning notes",
];

type PopProps = { canPop: boolean; popOpen: boolean; onPop: () => void };

export function FocusView({ now, goInbox, pop }: { now: number; goInbox: () => void; pop: PopProps }) {
  const active = useStore((s) => s.active);
  return active ? <ActiveSessionView active={active} now={now} pop={pop} /> : <StartScreen goInbox={goInbox} />;
}

// One-time tip that points people to the floating window. Hidden for good once dismissed or used.
const POP_TIP_KEY = "deepos.tip.popout";
function readTipSeen() {
  try {
    return localStorage.getItem(POP_TIP_KEY) === "1";
  } catch {
    return true;
  }
}
function PopTip({ canPop, popOpen, onPop }: PopProps) {
  const [seen, setSeen] = useState(readTipSeen);
  const hide = () => {
    setSeen(true);
    try {
      localStorage.setItem(POP_TIP_KEY, "1");
    } catch {
      /* storage unavailable: the tip simply shows again next visit */
    }
  };
  useEffect(() => {
    if (popOpen && !seen) hide();
  }, [popOpen, seen]);
  if (!canPop || popOpen || seen) return null;
  return (
    <div className="pop-hint" role="note">
      <button type="button" className="pop-hint-main" onClick={onPop}>
        <PopoutIcon />
        <span>
          <b>Tip:</b> Pop out keeps your task floating over every app
        </span>
        <kbd className="key-chip" aria-label="Keyboard shortcut O">
          <KeyboardIcon />O
        </kbd>
      </button>
      <button type="button" className="pop-hint-close" onClick={hide} aria-label="Dismiss tip">
        <CloseIcon />
      </button>
    </div>
  );
}

function ActiveSessionView({ active, now, pop }: { active: ActiveSession; now: number; pop: PopProps }) {
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
        <button type="button" className="primary big" onClick={() => {
            dispatch({ type: "end", outcome: "done", now: Date.now() });
            toast("Done. Nice work.");
          }}>
          <CheckIcon /> Done
        </button>
        <button
          type="button"
          className="round"
          aria-label="Stop for now"
          title="Stop for now (S)"
          onClick={() => {
            dispatch({ type: "end", outcome: "stopped", now: Date.now() });
            toast("Stopped for now");
          }}
        >
          <StopIcon />
        </button>
      </div>

      {over && (
        <div className="timesup" role="status">
          <p>
            <b>Time's up.</b> Wrap up, or give yourself a little longer.
          </p>
          <div className="row">
            <button type="button" className="ghost small" onClick={() => dispatch({ type: "extend", minutes: 5 })}>
              +5 min
            </button>
            <button type="button" className="ghost small" onClick={() => dispatch({ type: "extend", minutes: 15 })}>
              +15 min
            </button>
          </div>
        </div>
      )}

      <div className="session-meta">
        Started {formatTime(active.startedAt)}
        {active.plannedMin ? ` for ${active.plannedMin} min` : ""}
      </div>

      <PopTip {...pop} />

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
  const taskRef = useRef<HTMLInputElement>(null);
  const [example] = useState(() => EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)]);

  const waiting = inbox.length;
  const today = dayKey(Date.now());
  const todays = log.filter((l) => dayKey(l.startedAt) === today);
  const todayMs = todays.reduce((sum, l) => sum + l.focusedMs, 0);
  const todayParked = todays.reduce((sum, l) => sum + l.parked, 0);
  // Recent task names, newest first, for one-tap suggestions while typing.
  const recent = [...new Set(log.map((l) => l.task))].slice(0, 8);

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
      startedAt: n,
      plannedMin: draft.plannedMin,
      now: n,
    });
  };

  return (
    <form
      className="session idle"
      aria-label="Start a focus session"
      autoComplete="off"
      onSubmit={(e) => {
        e.preventDefault();
        start();
      }}
    >
      <header className="session-head">
        <span className="status ready">
          {log.length === 0
            ? "Focus on one task. Dump distracting thoughts for later."
            : `${greeting(Date.now())}. Everything else can wait.`}
        </span>
        <label htmlFor="task-input" className="title-hint">
          What deserves your focus now?
        </label>
        <input
          ref={taskRef}
          id="task-input"
          className="title-input"
          type="text"
          maxLength={160}
          list="recent-tasks"
          placeholder={example}
          value={draft.task}
          onChange={(e) => dispatch({ type: "setDraft", task: e.target.value })}
        />
        <datalist id="recent-tasks">
          {recent.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </header>

      <Ring progress={0}>
        <div className="clock" aria-label="Planned length">
          {draft.plannedMin ? formatClock(draft.plannedMin * 60000) : "00:00"}
        </div>
        <div className="clock-sub">{draft.plannedMin ? "Ready when you are" : "Open session, counts up"}</div>
      </Ring>

      <div className="presets" role="group" aria-label="Session length">
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

      <div className="controls">
        <button type="submit" className="primary big start-btn">
          <PlayIcon /> Start focus
        </button>
      </div>

      {waiting > 0 && (
        <button type="button" className="waiting-chip" onClick={goInbox} aria-label={`Open brain dump, ${waiting} thought${waiting > 1 ? "s" : ""} waiting`}>
          <span className="waiting-icon" aria-hidden="true">
            <ThoughtIcon />
            <i>{waiting}</i>
          </span>
          <span className="waiting-text">
            <b>
              {waiting} thought{waiting > 1 ? "s" : ""} waiting
            </b>
            <small>In your brain dump, ready when you are</small>
          </span>
          <span className="waiting-go" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </button>
      )}

      <ParkBox task={null} />

      {todays.length > 0 && (
        <ul className="today-line" aria-label="Today so far">
          <li>
            <ClockIcon /> <b>{formatDuration(todayMs)}</b> focused today
          </li>
          <li>
            <LayersIcon /> <b>{todays.length}</b> session{todays.length > 1 ? "s" : ""}
          </li>
          <li className="sun">
            <ThoughtIcon /> <b>{todayParked}</b> thought{todayParked === 1 ? "" : "s"} dumped
          </li>
        </ul>
      )}

    </form>
  );
}
