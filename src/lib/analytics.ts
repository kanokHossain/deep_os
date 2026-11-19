import { inject, pageview, track } from "@vercel/analytics";

/**
 * Anonymous, cookieless usage counts through Vercel Web Analytics.
 * Only event names and tiny labels are sent, never what anyone types.
 */
export type EventName =
  | "Session started"
  | "Session completed"
  | "Thought parked"
  | "Backup downloaded"
  | "Backup restored"
  | "App installed"
  | "Sync vote";

let started = false;

export function startAnalytics() {
  if (started || typeof window === "undefined") return;
  started = true;
  try {
    inject({ mode: import.meta.env.PROD ? "production" : "development", debug: false });
  } catch {
    /* analytics must never break the app */
  }
  countSource();
}

/**
 * Launch links carry ?ref=<channel> (e.g. deepos.app/?ref=linkedin). The channel is counted as a
 * visit to a virtual page, /ref/<channel>, readable on the free plan under Analytics > Pages.
 * Only the channel name is sent. The parameter is then removed from the address bar.
 */
export function readSource(search: string): string | null {
  const raw = new URLSearchParams(search).get("ref");
  if (!raw) return null;
  const ref = raw.toLowerCase().trim();
  return /^[a-z0-9-]{1,30}$/.test(ref) ? ref : null;
}

function countSource() {
  try {
    const ref = readSource(window.location.search);
    if (!ref) return;
    setTimeout(() => pageview({ route: "/ref/[channel]", path: `/ref/${ref}` }), 0);
    const url = new URL(window.location.href);
    url.searchParams.delete("ref");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  } catch {
    /* ignore */
  }
}

export function trackEvent(name: EventName, data?: Record<string, string | number | boolean>) {
  try {
    track(name, data);
    // Custom events need a paid Vercel plan to read. Page views are free, so a vote is also
    // counted as a visit to a virtual page: Vercel Analytics > Pages > /vote/sync.
    if (name === "Sync vote") pageview({ route: "/vote/sync", path: "/vote/sync" });
  } catch {
    /* ignore */
  }
}
