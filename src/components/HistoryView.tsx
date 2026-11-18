import { useMemo, useState } from "react";
import { dispatch, parseState, useStore, getState, type LogEntry } from "../lib/store";
import { dayKey, dayLabel, formatDuration, formatTime } from "../lib/time";
import { ClockIcon, DownloadIcon, LayersIcon, ThoughtIcon, UploadIcon } from "./Icons";
import { LineChart, shortHours } from "./LineChart";
import { toast } from "./Toast";
import { trackEvent } from "../lib/analytics";

export function HistoryView({ now }: { now: number }) {
  const log = useStore((s) => s.log);
  const [confirming, setConfirming] = useState(false);
  const [justBackedUp, setJustBackedUp] = useState(false);
  const today = dayKey(now);

  const todays = log.filter((l) => dayKey(l.startedAt) === today);
  const focused = todays.reduce((s, l) => s + l.focusedMs, 0);
  const parked = todays.reduce((s, l) => s + l.parked, 0);

  const week = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => dayKey(now - (6 - i) * 864e5));
    const mins = days.map((d) => Math.round(log.filter((l) => dayKey(l.startedAt) === d).reduce((s, l) => s + l.focusedMs, 0) / 60000));
    const total = mins.reduce((a, b) => a + b, 0);
    const activeDays = mins.filter(Boolean).length;
    const best = mins.indexOf(Math.max(...mins));
    return { days, mins, total, avg: activeDays ? Math.round(total / activeDays) : 0, best: mins[best] ? best : -1 };
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
    trackEvent("Backup downloaded");
    setJustBackedUp(true);
  };

  const restore = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = parseState(JSON.parse(await file.text()));
      if (!parsed) throw new Error("bad file");
      dispatch({ type: "replace", state: parsed });
      trackEvent("Backup restored");
      toast("Backup restored");
    } catch {
      toast("That file isn't a DeepOS backup");
    }
  };

  const wd = (d: string) => new Date(`${d}T00:00`).toLocaleDateString([], { weekday: "short" });

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>History</h1>
          <p className="hint">How your focus is going, day by day.</p>
        </div>
      </header>

      <div className="stats">
        <div className="stat">
          <span><ClockIcon /> Focused today</span>
          <b>{formatDuration(focused)}</b>
        </div>
        <div className="stat">
          <span><LayersIcon /> Sessions today</span>
          <b>{todays.length}</b>
        </div>
        <div className="stat">
          <span><ThoughtIcon /> Thoughts parked today</span>
          <b>{parked}</b>
        </div>
      </div>

      <section className="card chart-card" aria-labelledby="week-heading">
        <div className="chart-head">
          <div>
            <h2 id="week-heading">Last 7 days</h2>
            <p className="hint">Focused time per day. Hover or tap a point for the exact time.</p>
          </div>
          <dl className="chart-kpis">
            <div>
              <dt>Total</dt>
              <dd>{formatDuration(week.total * 60000)}</dd>
            </div>
            <div>
              <dt>Daily average</dt>
              <dd>{week.avg ? shortHours(week.avg) : "0m"}</dd>
            </div>
            <div>
              <dt>Best day</dt>
              <dd>{week.best >= 0 ? wd(week.days[week.best]) : "None yet"}</dd>
            </div>
          </dl>
        </div>
        <LineChart points={week.days.map((d, i) => ({ label: d === today ? "Today" : wd(d), value: week.mins[i], highlight: d === today }))} />
      </section>

      <div className="history-grid">
        <section className="card hg-sessions">
          <div className="toolbar">
            <h2>Sessions</h2>
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
              <div key={k} className="day-group">
                <h3>{dayLabel(k, now)}</h3>
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

        <section className="card hg-data">
          <h2>Your data</h2>
          <p className="hint">
            Everything you write stays in this browser. There's no account, and your tasks and thoughts are never sent anywhere. Download a
            backup to move to another device.
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
          {justBackedUp && <p className="hint">Moving to another device? Vote for sync at the bottom of the page.</p>}
        </section>
      </div>
    </div>
  );
}

