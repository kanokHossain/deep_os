import { useMemo, useState } from "react";
import { dispatch, parseState, useStore, getState, type LogEntry } from "../lib/store";
import { dayKey, dayLabel, formatDuration, formatTime } from "../lib/time";
import { ClockIcon, DownloadIcon, LayersIcon, ThoughtIcon, UploadIcon } from "./Icons";
import { toast } from "./Toast";

export function HistoryView({ now }: { now: number }) {
  const log = useStore((s) => s.log);
  const [confirming, setConfirming] = useState(false);
  const today = dayKey(now);

  const todays = log.filter((l) => dayKey(l.startedAt) === today);
  const focused = todays.reduce((s, l) => s + l.focusedMs, 0);
  const parked = todays.reduce((s, l) => s + l.parked, 0);

  const week = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => dayKey(now - (6 - i) * 864e5));
    const mins = days.map((d) => Math.round(log.filter((l) => dayKey(l.startedAt) === d).reduce((s, l) => s + l.focusedMs, 0) / 60000));
    return { days, mins, max: Math.max(30, ...mins) };
  }, [log, now]);

  const groups = useMemo(() => {
    const g = new Map<string, LogEntry[]>();
    log.slice(0, 300).forEach((l) => {
      const k = dayKey(l.startedAt);
      g.set(k, [...(g.get(k) ?? []), l]);
    });
    return [...g.entries()];
  }, [log]);

  const download = () => {
    const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `deepos-backup-${today}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const restore = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = parseState(JSON.parse(await file.text()));
      if (!parsed) throw new Error("bad file");
      dispatch({ type: "replace", state: parsed });
      toast("Backup restored");
    } catch {
      toast("That file isn't a DeepOS backup");
    }
  };

  return (
    <>
      <div className="stats">
        <div className="stat">
          <b>{formatDuration(focused)}</b>
          <span><ClockIcon /> Focused today</span>
        </div>
        <div className="stat">
          <b>{todays.length}</b>
          <span><LayersIcon /> Sessions today</span>
        </div>
        <div className="stat">
          <b>{parked}</b>
          <span><ThoughtIcon /> Thoughts parked today</span>
        </div>
      </div>

      <section className="card" aria-labelledby="week-heading">
        <h2 id="week-heading">Last 7 days</h2>
        <div className="week" role="img" aria-label={`Focused minutes per day: ${week.mins.join(", ")}`}>
          {week.days.map((d, i) => (
            <div className="week-col" key={d}>
              <span className="week-val">{week.mins[i] || ""}</span>
              <div className="week-track">
                <i className={d === today ? "today" : ""} style={{ height: `${(week.mins[i] / week.max) * 100}%` }} />
              </div>
              <span className="week-day">{new Date(`${d}T00:00`).toLocaleDateString([], { weekday: "short" })}</span>
            </div>
          ))}
        </div>
        <p className="hint">Minutes of focused time per day.</p>
      </section>

      <section className="card">
        <div className="toolbar">
          <h1>Sessions</h1>
          {log.length > 0 &&
            (confirming ? (
              <span className="confirm">
                Delete all sessions?
                <button
                  type="button"
                  className="primary small"
                  onClick={() => {
                    dispatch({ type: "clearLog" });
                    setConfirming(false);
                    toast("History cleared");
                  }}
                >
                  Delete
                </button>
                <button type="button" className="ghost small" onClick={() => setConfirming(false)}>
                  Cancel
                </button>
              </span>
            ) : (
              <button type="button" className="ghost small" onClick={() => setConfirming(true)}>
                Clear history
              </button>
            ))}
        </div>
        {groups.length ? (
          groups.map(([k, entries]) => (
            <div key={k} className="stack-sm">
              <h2>{dayLabel(k, now)}</h2>
              <ul className="list">
                {entries.map((l) => (
                  <li key={l.id}>
                    <div className="item-text">
                      {l.task}
                      <span className={l.outcome === "done" ? "tag" : "tag muted"}>{l.outcome === "done" ? "Done" : "Paused"}</span>
                      <small className="mono">
                        {formatTime(l.startedAt)}–{formatTime(l.endedAt)} · {formatDuration(l.focusedMs)}
                        {l.plannedMin ? ` of ${l.plannedMin} planned` : ""} · {l.parked} parked
                      </small>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="empty">Your focus history starts with your first session. Pick one task on Focus and begin.</p>
        )}
      </section>

      <section className="card">
        <h2>Your data</h2>
        <p className="hint">
          Everything stays in this browser. There's no account and nothing is sent anywhere. Download a backup to move to another device.
        </p>
        <div className="row">
          <button type="button" className="ghost small" onClick={download}>
            <DownloadIcon /> Download backup
          </button>
          <label className="ghost small file-btn">
            <UploadIcon /> Restore backup
            <input type="file" accept="application/json,.json" onChange={(e) => restore(e.target.files?.[0])} />
          </label>
        </div>
      </section>
    </>
  );
}
