import { elapsedMs, emptyState, parseState, reduce, type State } from "./store";
import { formatClock, startFromTimeInput } from "./time";

const T = 1_700_000_000_000;

function started(): State {
  return reduce(emptyState(), { type: "start", task: "Write spec", startedAt: T, plannedMin: 25, now: T });
}

describe("session timing", () => {
  it("counts from timestamps, so a throttled tab can't make it drift", () => {
    const s = started();
    expect(elapsedMs(s.active!, T + 25 * 60000)).toBe(25 * 60000);
  });

  it("excludes paused time", () => {
    let s = started();
    s = reduce(s, { type: "pause", now: T + 10 * 60000 });
    expect(elapsedMs(s.active!, T + 20 * 60000)).toBe(10 * 60000);
    s = reduce(s, { type: "resume", now: T + 20 * 60000 });
    expect(elapsedMs(s.active!, T + 25 * 60000)).toBe(15 * 60000);
  });

  it("never starts in the future", () => {
    const s = reduce(emptyState(), { type: "start", task: "x", startedAt: T + 5000, plannedMin: 0, now: T });
    expect(s.active!.startedAt).toBe(T);
  });

  it("ignores an empty task", () => {
    const s = emptyState();
    expect(reduce(s, { type: "start", task: "   ", startedAt: T, plannedMin: 25, now: T })).toBe(s);
  });

  it("logs the focused time and parked count when a session ends", () => {
    let s = started();
    s = reduce(s, { type: "park", text: "Call the bank", now: T + 60000 });
    s = reduce(s, { type: "end", outcome: "done", now: T + 30 * 60000 });
    expect(s.active).toBeNull();
    expect(s.log[0]).toMatchObject({ task: "Write spec", focusedMs: 30 * 60000, parked: 1, outcome: "done" });
  });

  it("can count only the planned time when a forgotten session ran long", () => {
    let s = started();
    s = reduce(s, { type: "end", outcome: "done", now: T + 165 * 60000, focusedMs: 25 * 60000 });
    expect(s.log[0]).toMatchObject({ focusedMs: 25 * 60000, endedAt: T + 165 * 60000 });
  });
});

describe("stopped tasks", () => {
  it("puts a stopped task in the brain dump, marked as stopped", () => {
    const s = reduce(started(), { type: "end", outcome: "stopped", now: T + 10 * 60000 });
    expect(s.inbox[0]).toMatchObject({ text: "Write spec", stopped: true, status: "new" });
    expect(s.log[0].outcome).toBe("stopped");
  });

  it("keeps one entry per task when it is stopped again", () => {
    let s = reduce(started(), { type: "end", outcome: "stopped", now: T + 60000 });
    s = reduce(s, { type: "start", task: "write spec ", startedAt: T + 120000, plannedMin: 25, now: T + 120000 });
    s = reduce(s, { type: "end", outcome: "stopped", now: T + 180000 });
    expect(s.inbox.filter((i) => i.stopped)).toHaveLength(1);
  });

  it("removes the stopped entry once the task is done", () => {
    let s = reduce(started(), { type: "end", outcome: "stopped", now: T + 60000 });
    s = reduce(s, { type: "addInbox", text: "Call the bank", now: T + 70000 });
    s = reduce(s, { type: "start", task: "Write spec", startedAt: T + 120000, plannedMin: 25, now: T + 120000 });
    s = reduce(s, { type: "end", outcome: "done", now: T + 180000 });
    expect(s.inbox.map((i) => i.text)).toEqual(["Call the bank"]);
  });

  it("leaves a dumped thought with the same words alone", () => {
    let s = reduce(emptyState(), { type: "addInbox", text: "Write spec", now: T });
    s = reduce(s, { type: "start", task: "Write spec", startedAt: T + 1, plannedMin: 25, now: T + 1 });
    s = reduce(s, { type: "end", outcome: "done", now: T + 60000 });
    expect(s.inbox).toHaveLength(1);
  });
});

describe("inbox", () => {
  it("records which task a parked thought came from", () => {
    const s = reduce(started(), { type: "park", text: "  Call the bank ", now: T + 1 });
    expect(s.inbox[0]).toMatchObject({ text: "Call the bank", fromTask: "Write spec", status: "new" });
    expect(s.active!.parked).toBe(1);
  });

  it("promotes a thought into the next task", () => {
    let s = reduce(emptyState(), { type: "addInbox", text: "Plan Q1", now: T });
    s = reduce(s, { type: "promote", id: s.inbox[0].id });
    expect(s.inbox).toHaveLength(0);
    expect(s.draft.task).toBe("Plan Q1");
  });

  it("restores a dropped thought in its old place", () => {
    let s = reduce(emptyState(), { type: "addInbox", text: "a", now: T });
    s = reduce(s, { type: "addInbox", text: "b", now: T });
    const item = s.inbox[1];
    s = reduce(s, { type: "drop", id: item.id });
    s = reduce(s, { type: "restore", item, index: 1 });
    expect(s.inbox.map((i) => i.text)).toEqual(["b", "a"]);
  });
});

describe("backups", () => {
  it("rejects files that aren't backups", () => {
    expect(parseState({ hello: 1 })).toBeNull();
    expect(parseState(null)).toBeNull();
  });
  it("accepts its own state", () => {
    const s = started();
    expect(parseState(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
});

describe("time helpers", () => {
  it("formats clocks", () => {
    expect(formatClock(65_000)).toBe("01:05");
    expect(formatClock(3_725_000)).toBe("1:02:05");
  });
  it("only lets you backdate a start time", () => {
    const now = new Date(2026, 10, 18, 12, 0).getTime();
    expect(startFromTimeInput("11:30", now)).toBe(new Date(2026, 10, 18, 11, 30).getTime());
    expect(startFromTimeInput("13:00", now)).toBe(now);
  });
});

describe("extend", () => {
  it("adds minutes and lets the chime play again", () => {
    let s = started();
    s = reduce(s, { type: "chimed" });
    s = reduce(s, { type: "extend", minutes: 5 });
    expect(s.active).toMatchObject({ plannedMin: 30, chimed: false });
  });
  it("does nothing for open sessions", () => {
    const s = reduce(emptyState(), { type: "start", task: "x", startedAt: T, plannedMin: 0, now: T });
    expect(reduce(s, { type: "extend", minutes: 5 })).toBe(s);
  });
});
