import { useCallback, useEffect, useState } from "react";
import { FocusView } from "./components/FocusView";
import { HistoryView } from "./components/HistoryView";
import { InboxView } from "./components/InboxView";
import { Toaster } from "./components/Toast";
import { useFloatingWindow } from "./hooks/useFloatingWindow";
import { useNow } from "./hooks/useNow";
import { useTimeUpChime } from "./hooks/useTimeUpChime";
import { elapsedMs, useStore } from "./lib/store";
import { formatClock } from "./lib/time";

const VIEWS = ["focus", "inbox", "history"] as const;
type View = (typeof VIEWS)[number];

function readHash(): View {
  const h = window.location.hash.slice(1);
  return (VIEWS as readonly string[]).includes(h) ? (h as View) : "focus";
}

export default function App() {
  const [view, setView] = useState<View>(readHash);
  const active = useStore((s) => s.active);
  const inbox = useStore((s) => s.inbox);
  const now = useNow();
  const floating = useFloatingWindow();
  useTimeUpChime(active, now);

  useEffect(() => {
    const onHash = () => setView(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = useCallback((v: View) => {
    if (window.location.hash.slice(1) !== v) window.location.hash = v;
    setView(v);
  }, []);

  // The tab title doubles as a timer you can see from other tabs.
  useEffect(() => {
    document.title = active ? `${formatClock(elapsedMs(active, now))} · ${active.task}` : "DeepOS";
  }, [active, now]);

  // Closing the floating window when the session ends keeps things tidy.
  useEffect(() => {
    if (!active && floating.isOpen) floating.close();
  }, [active, floating]);

  const waiting = inbox.filter((i) => i.status === "new").length;

  return (
    <div className="wrap">
      <header>
        <a className="brand" href="#focus" onClick={() => go("focus")}>
          <b>DeepOS</b>
          <span>Hold that thought.</span>
        </a>
        <nav aria-label="Views">
          {VIEWS.map((v) => (
            <a key={v} href={`#${v}`} aria-current={view === v ? "page" : undefined} onClick={() => setView(v)}>
              {v === "focus" ? (active ? "● Focus" : "Focus") : v === "inbox" ? "Inbox" : "History"}
              {v === "inbox" && waiting > 0 && <span className="count">{waiting}</span>}
            </a>
          ))}
        </nav>
      </header>

      <main>
        {view === "focus" && <FocusView now={now} floating={floating} goInbox={() => go("inbox")} />}
        {view === "inbox" && <InboxView goFocus={() => go("focus")} />}
        {view === "history" && <HistoryView now={now} />}
      </main>

      <footer>
        Free and open source. Your data never leaves your browser.{" "}
        <a href="https://github.com/kanokHossain/deep_os">Source on GitHub</a>
      </footer>
      <Toaster />
    </div>
  );
}
