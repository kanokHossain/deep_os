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
