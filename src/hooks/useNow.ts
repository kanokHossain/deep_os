import { useEffect, useState } from "react";

/**
 * Current time, refreshed every second. Pass the floating window so its clock
 * ticks on a visible window's timers (hidden tabs get throttled).
 */
export function useNow(win: Window = window, active = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = win.setInterval(() => setNow(Date.now()), 1000);
    return () => win.clearInterval(id);
  }, [win, active]);
  return now;
}
