const pad = (n: number) => String(n).padStart(2, "0");

/** 65_000 -> "01:05", 3_725_000 -> "1:02:05" */
export function formatClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/** Always in hours and minutes: 0h 47m, 1h 05m */
export function formatDuration(ms: number): string {
  const m = Math.round(ms / 60000);
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function dayLabel(key: string, now = Date.now()): string {
  if (key === dayKey(now)) return "Today";
  if (key === dayKey(now - 864e5)) return "Yesterday";
  return new Date(`${key}T00:00`).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
}

/** "HH:MM" today -> timestamp. Times in the future fall back to now (you can only backdate a start). */
export function startFromTimeInput(value: string, now = Date.now()): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return now;
  const d = new Date(now);
  d.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return d.getTime() <= now ? d.getTime() : now;
}

export function timeInputValue(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
