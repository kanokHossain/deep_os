import { useCallback, useEffect, useState } from "react";
import { FocusView } from "./components/FocusView";
import { HistoryView } from "./components/HistoryView";
import { FocusIcon, HistoryIcon, InboxIcon, LogoMark, WishIcon } from "./components/Icons";
import { InboxView } from "./components/InboxView";
import { Ocean } from "./components/Ocean";
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

  useEffect(() => {
    if (!active && floating.isOpen) floating.close();
  }, [active, floating]);

  // Depth: 0 at the surface, 1 at the end of the planned session (or after an hour in open sessions).
  const depth = active
    ? Math.min(1, elapsedMs(active, now) / (active.plannedMin ? active.plannedMin * 60000 : 3600000))
    : 0;
  const depthMeters = active ? Math.floor(elapsedMs(active, now) / 60000) : 0;

  const waiting = inbox.filter((i) => i.status === "new").length;
  const nav: { id: View; label: string; Icon: typeof FocusIcon }[] = [
    { id: "focus", label: "Focus", Icon: FocusIcon },
    { id: "inbox", label: "Inbox", Icon: InboxIcon },
    { id: "history", label: "History", Icon: HistoryIcon },
  ];

  return (
    <div className={active ? "shell diving" : "shell"} style={{ ["--depth" as string]: depth.toFixed(3) }}>
      <Ocean depth={depth} />

      <aside className="rail">
        <a className="brand" href="#focus" onClick={() => go("focus")} aria-label="DeepOS home">
          <LogoMark />
          <span>DeepOS</span>
        </a>
        <nav aria-label="Modules">
          {nav.map(({ id, label, Icon }) => (
            <a
              key={id}
              id={`nav-${id}`}
              href={`#${id}`}
              aria-current={view === id ? "page" : undefined}
              onClick={() => setView(id)}
            >
              <Icon />
              <span className="nav-label">{label}</span>
              {id === "focus" && active && <i className="live-dot" aria-label="Session running" />}
              {id === "inbox" && waiting > 0 && <span className="count">{waiting}</span>}
            </a>
          ))}
          <span className="soon" title="Coming soon">
            <WishIcon />
            <span className="nav-label">Wishlist</span>
            <em>Soon</em>
          </span>
        </nav>
        <div className="rail-foot">
          <a href="https://github.com/kanokHossain/deep_os">Open source</a>
          <span>Data stays in your browser</span>
        </div>
      </aside>

      <main className={`stage stage-${view}`}>
        {view === "focus" && <FocusView now={now} floating={floating} goInbox={() => go("inbox")} />}
        {view === "inbox" && <InboxView goFocus={() => go("focus")} />}
        {view === "history" && <HistoryView now={now} />}
      </main>

      {active && view === "focus" && (
        <div className="gauge" aria-label={`${depthMeters} minutes deep`}>
          <div className="gauge-track">
            <i style={{ height: `${depth * 100}%` }} />
          </div>
          <span>{depthMeters}m</span>
          <small>deep</small>
        </div>
      )}
      <Toaster />
    </div>
  );
}
