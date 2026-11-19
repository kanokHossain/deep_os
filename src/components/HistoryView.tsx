import { useMemo, useState } from "react";
import { dispatch, parseState, useStore, getState, type LogEntry } from "../lib/store";
import { dayKey, dayLabel, formatDuration, formatTime } from "../lib/time";
import { ClockIcon, DownloadIcon, LayersIcon, PlayIcon, ThoughtIcon, UploadIcon } from "./Icons";
import { LineChart, shortHours } from "./LineChart";
import { toast } from "./Toast";
import { trackEvent } from "../lib/analytics";

const PAGE_SIZE = 25;

export function HistoryView({ now, goFocus }: { now: number; goFocus: () => void }) {
  const log = useStore((s) => s.log);
  const hasActive = useStore((s) => s.active !== null);
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

  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(log.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const dayTotals = useMemo(() => {
    const t = new Map<string, number>();
    log.forEach((l) => t.set(dayKey(l.startedAt), (t.get(dayKey(l.startedAt)) ?? 0) + l.focusedMs));
    return t;
  }, [log]);
  const groups = useMemo(() => {
    const g = new Map<string, LogEntry[]>();
    log.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE).forEach((l) => {
      const k = dayKey(l.startedAt);
      g.set(k, [...(g.get(k) ?? []), l]);
    });
    return [...g.entries()];
  }, [log, current]);

  const resume = (l: LogEntry) => {
    if (hasActive) {
      toast("Finish or stop your current task first");
      return;
    }
    dispatch({ type: "setDraft", task: l.task, plannedMin: l.plannedMin });
    goFocus();
    toast(`Ready to resume: ${l.task}`);
  };

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
          <h1>Analytics</h1>
          <p className="hint">How your focus is going, day by day. Pick up any past task with Resume.</p>
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
          <span><ThoughtIcon /> Thoughts dumped today</span>
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
              <dd>{week.avg ? shortHours(week.avg) : "0h 00m"}</dd>
            </div>
            <div>
              <dt>Best day</dt>
              <dd>{week.best >= 0 ? wd(week.days[week.best]) : "None yet"}</dd>
            </div>
          </dl>
        </div>
        {week.total > 0 ? (
          <LineChart points={week.days.map((d, i) => ({ label: d === today ? "Today" : wd(d), value: week.mins[i], highlight: d === today }))} />
        ) : (
          <div className="chart-empty">
            <ClockIcon />
            <b>No focus time this week yet.</b>
            <span>Finish your first session and your week starts filling in here.</span>
          </div>
        )}
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
            <>
              <div className="sessions-scroll">
              {groups.map(([k, entries]) => (
                <div key={k} className="day-group">
                  <h3>
                    <span>{dayLabel(k, now)}</span>
                    <span className="day-total">{shortHours(Math.round((dayTotals.get(k) ?? 0) / 60000))}</span>
                  </h3>
                  <ul className="session-rows">
                    {entries.map((l) => (
                      <li key={l.id}>
                        <time className="sr-time">{formatTime(l.startedAt)}</time>
                        <div className="sr-main">
                          <span className="sr-task">
                            <i className={l.outcome === "done" ? "sr-dot" : "sr-dot paused"} aria-hidden="true" />
                            <span className="sr-name" title={l.task}>{l.task}</span>
                          </span>
                          <small>
                            {l.outcome === "done" ? "Done" : "Paused"}
                            {l.plannedMin ? ` · ${l.plannedMin}m planned` : " · Open session"}
                            {l.parked ? ` · ${l.parked} dumped` : ""}
                          </small>
                        </div>
                        <span className="sr-dur">{shortHours(Math.round(l.focusedMs / 60000))}</span>
                        <button type="button" className="sr-resume" onClick={() => resume(l)} aria-label={`Resume ${l.task}`} title="Resume">
                          <PlayIcon />
                          <span>Resume</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              </div>
              {pages > 1 && (
                <nav className="pager" aria-label="Session pages">
                  <span className="pager-info">
                    {current * PAGE_SIZE + 1}–{Math.min(log.length, (current + 1) * PAGE_SIZE)} of {log.length}
                  </span>
                  <div className="pager-btns">
                    <button type="button" className="pager-btn" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="Newer sessions">
                      ‹
                    </button>
                    {Array.from({ length: pages }, (_, i) => i)
                      .filter((i) => i === 0 || i === pages - 1 || Math.abs(i - current) <= 1)
                      .map((i, idx, arr) => (
                        <span key={i} className="pager-group">
                          {idx > 0 && i - arr[idx - 1] > 1 && <span className="pager-gap">…</span>}
                          <button
                            type="button"
                            className="pager-btn"
                            aria-current={i === current ? "page" : undefined}
                            onClick={() => setPage(i)}
                          >
                            {i + 1}
                          </button>
                        </span>
                      ))}
                    <button type="button" className="pager-btn" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} aria-label="Older sessions">
                      ›
                    </button>
                  </div>
                </nav>
              )}
            </>
          ) : (
            <p className="empty">Your focus history starts with your first session. Pick one task on Focus and begin.</p>
          )}
        </section>

        <section className="card hg-data">
          <div>
            <h2>Your data</h2>
            <p className="hint">
              Everything you write stays in this browser. There's no account, and your tasks and thoughts are never sent anywhere. Download a
              backup to move to another device.
            </p>
            {justBackedUp && <p className="hint">Moving to another device? Vote for sync at the bottom of the page.</p>}
          </div>
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
      </div>
    </div>
  );
}

