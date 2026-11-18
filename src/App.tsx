import { useCallback, useEffect, useState } from "react";
import { FocusView } from "./components/FocusView";
import { HistoryView } from "./components/HistoryView";
import { DocIcon, GithubIcon, FocusIcon, HistoryIcon, KeyboardIcon, LockIcon, LogoMark, PopoutIcon, ShieldIcon, ThoughtIcon } from "./components/Icons";
import { InboxView } from "./components/InboxView";
import { InstallButton } from "./components/InstallButton";
import { PrivacyPage, TermsPage } from "./components/LegalPage";
import { ShortcutsDialog } from "./components/Shortcuts";
import { SyncVote } from "./components/SyncVote";
import { toast, Toaster } from "./components/Toast";
import { useFloatingWindow } from "./hooks/useFloatingWindow";
import { useNow } from "./hooks/useNow";
import { useTimeUpChime } from "./hooks/useTimeUpChime";
import { dispatch, elapsedMs, getState, useStore } from "./lib/store";
import { formatClock } from "./lib/time";

const VIEWS = ["focus", "inbox", "analytics"] as const;
const PAGES = ["privacy", "terms"] as const;
type View = (typeof VIEWS)[number] | (typeof PAGES)[number];
type Tab = (typeof VIEWS)[number];
const LABELS: Record<Tab, string> = { focus: "Focus", inbox: "Brain dump", analytics: "Analytics" };
const TAB_ICONS: Record<Tab, typeof FocusIcon> = { focus: FocusIcon, inbox: ThoughtIcon, analytics: HistoryIcon };

function readHash(): View {
  const raw = window.location.hash.slice(1);
  const h = raw === "history" ? "analytics" : raw; // old links keep working
  return ([...VIEWS, ...PAGES] as readonly string[]).includes(h) ? (h as View) : "focus";
}

function isTyping() {
  const el = document.activeElement;
  return !!el && (/INPUT|TEXTAREA|SELECT/.test(el.tagName) || (el as HTMLElement).isContentEditable);
}

export default function App() {
  const [view, setView] = useState<View>(readHash);
  const [help, setHelp] = useState(false);
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

  const popOut = useCallback(async () => {
    if (!floating.supported) {
      toast("Pop out works in Chrome and Edge on a computer");
      return;
    }
    if (floating.isOpen) floating.close();
    else if (!(await floating.open())) toast("Your browser blocked the pop-out window");
  }, [floating]);

  // Keyboard shortcuts. Ignored while typing, except Esc which leaves the text box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping()) return;
      const s = getState();
      const k = e.key;
      const focusSoon = (id: string) => setTimeout(() => document.getElementById(id)?.focus(), 0);
      if (k === "?") {
        e.preventDefault();
        setHelp((h) => !h);
      } else if (k === "1" || k === "2" || k === "3") {
        go(VIEWS[Number(k) - 1]);
      } else if (k === "n" || k === "N") {
        e.preventDefault();
        if (s.active) {
          toast("Finish or stop this task first");
          return;
        }
        go("focus");
        focusSoon("task-input");
      } else if (k === "p" || k === "P") {
        e.preventDefault();
        if (s.active) {
          go("focus");
          focusSoon("park-input");
        } else {
          go("inbox");
          focusSoon("add-input");
        }
      } else if (k === " " && s.active) {
        e.preventDefault();
        dispatch({ type: s.active.pausedAt ? "resume" : "pause", now: Date.now() });
      } else if ((k === "d" || k === "D") && s.active) {
        dispatch({ type: "end", outcome: "done", now: Date.now() });
        toast("Done. Nice work.");
      } else if ((k === "s" || k === "S") && s.active) {
        dispatch({ type: "end", outcome: "stopped", now: Date.now() });
        toast("Stopped for now");
      } else if (k === "o" || k === "O") {
        void popOut();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, popOut]);

  // The tab title doubles as a timer you can see from other tabs.
  useEffect(() => {
    const titles: Partial<Record<View, string>> = {
      inbox: "Brain dump · DeepOS",
      analytics: "Analytics · DeepOS",
      privacy: "Privacy Policy · DeepOS",
      terms: "Terms of Use · DeepOS",
    };
    document.title = active ? `${formatClock(elapsedMs(active, now))} · ${active.task}` : titles[view] ?? "DeepOS: Free Focus Timer with a Brain Dump";
  }, [active, now, view]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  const waiting = inbox.length;

  return (
    <div className={active && view === "focus" ? "shell zen" : "shell"}>
      <div className="aurora" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <header className="topbar">
        <a className="brand" href="#focus" onClick={() => go("focus")} aria-label="DeepOS home">
          <LogoMark size={30} />
          <span className="brand-name">DeepOS</span>
          <span className="brand-tag">
            Dump the noise, keep working.
          </span>
        </a>
        <nav className="tabs" aria-label="Sections">
          {VIEWS.map((v) => (
            <a
              key={v}
              id={`nav-${v}`}
              href={`#${v}`}
              aria-current={view === v ? "page" : undefined}
              onClick={() => setView(v)}
            >
              {(() => {
                const Icon = TAB_ICONS[v];
                return <Icon className="tab-icon" />;
              })()}
              <span className="tab-label">{LABELS[v]}</span>
              {v === "focus" && active && <i className="live-dot" aria-label="Session running" />}
              {v === "inbox" && waiting > 0 && <span className="count">{waiting}</span>}
            </a>
          ))}
        </nav>
        <div className="top-actions">
          <InstallButton />
          <button
            type="button"
            className="ghost small icon-btn"
            onClick={() => setHelp(true)}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            <KeyboardIcon />
          </button>
          <button
            type="button"
            className={floating.isOpen ? "pop on" : "pop"}
            onClick={() => void popOut()}
            title="A small timer that stays on top of all your apps. Drag it anywhere. (O)"
          >
            <PopoutIcon />
            <span>{floating.isOpen ? "Close pop-out" : "Pop out"}</span>
          </button>
        </div>
      </header>

      <main className={`stage stage-${view}`}>
        {view === "focus" && <FocusView now={now} goInbox={() => go("inbox")} />}
        {view === "inbox" && <InboxView goFocus={() => go("focus")} />}
        {view === "analytics" && <HistoryView now={now} goFocus={() => go("focus")} />}
        {view === "privacy" && <PrivacyPage />}
        {view === "terms" && <TermsPage />}
      </main>

      <footer className="foot">
        <SyncVote compact />
        <div className="foot-row">
        <span className="foot-note">
          <LockIcon /> Free and open source. Your thoughts never leave your device.
        </span>
        <nav className="foot-links" aria-label="About DeepOS">
          <a href="#privacy">
            <ShieldIcon /> Privacy
          </a>
          <a href="#terms">
            <DocIcon /> Terms
          </a>
          <a href="https://github.com/kanokHossain/deep_os">
            <GithubIcon /> Source
          </a>
          <button type="button" className="foot-link-btn" onClick={() => setHelp(true)}>
            <KeyboardIcon /> Shortcuts <kbd>?</kbd>
          </button>
        </nav>
        </div>
      </footer>

      {help && <ShortcutsDialog onClose={() => setHelp(false)} />}
      <Toaster />
    </div>
  );
}
