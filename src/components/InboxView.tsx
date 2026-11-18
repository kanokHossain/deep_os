import { useState } from "react";
import { dispatch, useStore, type InboxItem } from "../lib/store";
import { dayKey, dayLabel, formatTime } from "../lib/time";
import { BookmarkIcon, CardsIcon, CopyIcon, LeafIcon, PlayIcon, ThoughtIcon } from "./Icons";
import { toast } from "./Toast";

export function InboxView({ goFocus }: { goFocus: () => void }) {
  const inbox = useStore((s) => s.inbox);
  const hasActive = useStore((s) => s.active !== null);
  const [triage, setTriage] = useState(false);
  const [text, setText] = useState("");

  const fresh = inbox.filter((i) => i.status === "new");
  const later = inbox.filter((i) => i.status === "later");

  const act = (item: InboxItem, action: "focus" | "later" | "drop") => {
    if (action === "later") {
      dispatch({ type: "later", id: item.id });
    } else if (action === "drop") {
      const index = inbox.findIndex((i) => i.id === item.id);
      dispatch({ type: "drop", id: item.id });
      toast("Let go", () => dispatch({ type: "restore", item, index }));
    } else {
      if (hasActive) {
        toast("Finish or stop your current task first");
        return false;
      }
      dispatch({ type: "promote", id: item.id });
      goFocus();
    }
    return true;
  };

  if (triage && fresh.length) return <Triage items={fresh} onAct={act} onExit={() => setTriage(false)} />;

  const copy = async () => {
    const lines = [...fresh, ...later].map((i) => `- [ ] ${i.text}`).join("\n");
    try {
      await navigator.clipboard.writeText(lines);
      toast("Copied as a checklist");
    } catch {
      toast("Your browser blocked copying");
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Brain dump</h1>
          <p className="hint">Everything you parked lives here, so your mind doesn't have to carry it. Sort it when you're ready.</p>
        </div>
        <div className="row">
          {fresh.length > 0 && (
            <button type="button" className="primary" onClick={() => setTriage(true)}>
              <CardsIcon /> Sort one by one
            </button>
          )}
          <button type="button" className="ghost small" onClick={copy} disabled={!inbox.length}>
            <CopyIcon /> Copy as list
          </button>
        </div>
      </header>

      <form
        className="composer"
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          dispatch({ type: "addInbox", text, now: Date.now() });
          setText("");
        }}
      >
        <ThoughtIcon className="composer-icon" />
        <label htmlFor="add-input" className="sr-only">
          Anything else buzzing in your mind?
        </label>
        <input
          id="add-input"
          type="text"
          maxLength={280}
          placeholder="Anything else buzzing in your mind? Write it down and let it go"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="primary small" disabled={!text.trim()}>
          Unload
        </button>
      </form>

      <div className="columns">
        <section className="card column" aria-labelledby="waiting-heading">
          <div className="column-head">
            <h2 id="waiting-heading">Waiting for you</h2>
            <span className="pill sun">{fresh.length}</span>
          </div>
          {fresh.length ? (
            <ItemList items={fresh} onAct={act} />
          ) : (
            <div className="empty-big">
              <ThoughtIcon />
              <b>Your mind is clear.</b>
              <span>When something buzzes during a focus session, park it and it lands here.</span>
            </div>
          )}
        </section>

        <section className="card column" aria-labelledby="later-heading">
          <div className="column-head">
            <h2 id="later-heading">Kept for later</h2>
            <span className="pill">{later.length}</span>
          </div>
          {later.length ? (
            <ItemList items={later} onAct={act} />
          ) : (
            <div className="empty-big quiet">
              <BookmarkIcon />
              <b>Nothing saved for later.</b>
              <span>Choose “Later” on a thought to keep it here without it nagging you.</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function source(i: InboxItem) {
  const when = `${dayLabel(dayKey(i.createdAt)).toLowerCase()} at ${formatTime(i.createdAt)}`;
  return i.fromTask ? `Came up ${when} while you were on “${i.fromTask}”` : `Added ${when}`;
}

type ActFn = (item: InboxItem, action: "focus" | "later" | "drop") => boolean | undefined;

function ItemList({ items, onAct }: { items: InboxItem[]; onAct: ActFn }) {
  return (
    <ul className="list">
      {items.map((i) => (
        <li key={i.id}>
          <div className="item-text">
            {i.text}
            <small>{source(i)}</small>
          </div>
          <div className="actions">
            <button type="button" className="primary small" onClick={() => onAct(i, "focus")}>
              <PlayIcon /> Start now
            </button>
            {i.status === "new" && (
              <button type="button" className="ghost small" onClick={() => onAct(i, "later")}>
                <BookmarkIcon /> Later
              </button>
            )}
            <button type="button" className="ghost small" onClick={() => onAct(i, "drop")}>
              <LeafIcon /> Let it go
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** One card at a time, so every parked thought gets a real decision. */
function Triage({ items, onAct, onExit }: { items: InboxItem[]; onAct: ActFn; onExit: () => void }) {
  const [total] = useState(items.length);
  const item = items[0];
  const done = total - items.length;

  return (
    <section className="card triage" aria-labelledby="triage-heading">
      <div className="toolbar">
        <span className="eyebrow" id="triage-heading">
          Thought {done + 1} of {total}
        </span>
        <button type="button" className="ghost small" onClick={onExit}>
          Stop sorting
        </button>
      </div>
      <div className="bar">
        <i style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <p className="triage-text">{item.text}</p>
      <p className="hint">{source(item)}</p>
      <div className="triage-actions">
        <button type="button" className="primary" onClick={() => onAct(item, "focus")}>
          <PlayIcon /> Start now
        </button>
        <button type="button" className="ghost" onClick={() => onAct(item, "later")}>
          <BookmarkIcon /> Keep for later
        </button>
        <button type="button" className="ghost" onClick={() => onAct(item, "drop")}>
          <LeafIcon /> Let it go
        </button>
      </div>
    </section>
  );
}
