import { useState } from "react";
import { dispatch, useStore, type InboxItem } from "../lib/store";
import { dayKey, dayLabel, formatTime } from "../lib/time";
import { LeafIcon, PlayIcon, ThoughtIcon } from "./Icons";
import { toast } from "./Toast";

export function InboxView({ goFocus }: { goFocus: () => void }) {
  const inbox = useStore((s) => s.inbox);
  const hasActive = useStore((s) => s.active !== null);
  const [text, setText] = useState("");

  // Older saves may hold "later" items; they simply show with the rest now.
  const fresh = inbox;

  const act = (item: InboxItem, action: "focus" | "drop") => {
    if (action === "drop") {
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


  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Brain dump</h1>
          <p className="hint">Everything you dumped lives here, so your mind doesn't have to carry it. Start one when you're ready, or let it go.</p>
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
          Dump
        </button>
      </form>

      <div className="columns single">
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

      </div>
    </div>
  );
}

function source(i: InboxItem) {
  const when = `${dayLabel(dayKey(i.createdAt)).toLowerCase()} at ${formatTime(i.createdAt)}`;
  return i.fromTask ? `Came up ${when} while you were on “${i.fromTask}”` : `Added ${when}`;
}

type ActFn = (item: InboxItem, action: "focus" | "drop") => boolean | undefined;

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
            <button type="button" className="ghost small" onClick={() => onAct(i, "drop")}>
              <LeafIcon /> Let it go
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
