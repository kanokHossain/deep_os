import { useState } from "react";
import { dispatch, useStore, type InboxItem } from "../lib/store";
import { dayKey, dayLabel, formatTime } from "../lib/time";
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
      toast("Dropped", () => dispatch({ type: "restore", item, index }));
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
      toast("Inbox copied as a checklist");
    } catch {
      toast("Your browser blocked copying");
    }
  };

  return (
    <section className="card">
      <div className="toolbar">
        <h1>Inbox</h1>
        <div className="row">
          {fresh.length > 0 && (
            <button type="button" className="primary small" onClick={() => setTriage(true)}>
              Review one by one
            </button>
          )}
          <button type="button" className="ghost small" onClick={copy} disabled={!inbox.length}>
            Copy as list
          </button>
        </div>
      </div>
      <p className="hint">Everything you parked lands here. Decide each one: focus on it, keep it for later, or drop it.</p>

      <form
        className="row align-end"
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          dispatch({ type: "addInbox", text, now: Date.now() });
          setText("");
        }}
      >
        <div className="field grow">
          <label htmlFor="add-input">Add a thought</label>
          <input id="add-input" type="text" maxLength={280} placeholder="Anything on your mind" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <button type="submit" className="ghost">
          Add
        </button>
      </form>

      <h2>
        To review <span className="count-inline">{fresh.length}</span>
      </h2>
      {fresh.length ? <ItemList items={fresh} onAct={act} /> : <p className="empty">All clear. Nothing is waiting for a decision.</p>}

      {later.length > 0 && (
        <>
          <h2>
            Later <span className="count-inline">{later.length}</span>
          </h2>
          <ItemList items={later} onAct={act} />
        </>
      )}
    </section>
  );
}

function source(i: InboxItem) {
  const when = `${dayLabel(dayKey(i.createdAt)).toLowerCase()} at ${formatTime(i.createdAt)}`;
  return i.fromTask ? `Parked ${when} while on “${i.fromTask}”` : `Added ${when}`;
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
              Focus on it
            </button>
            {i.status === "new" && (
              <button type="button" className="ghost small" onClick={() => onAct(i, "later")}>
                Later
              </button>
            )}
            <button type="button" className="ghost small" onClick={() => onAct(i, "drop")}>
              Drop
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
          Reviewing {done + 1} of {total}
        </span>
        <button type="button" className="ghost small" onClick={onExit}>
          Exit review
        </button>
      </div>
      <div className="bar">
        <i style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <p className="triage-text">{item.text}</p>
      <p className="hint">{source(item)}</p>
      <div className="triage-actions">
        <button type="button" className="primary" onClick={() => onAct(item, "focus")}>
          Focus on it now
        </button>
        <button type="button" className="ghost" onClick={() => onAct(item, "later")}>
          Keep for later
        </button>
        <button type="button" className="ghost" onClick={() => onAct(item, "drop")}>
          Drop it
        </button>
      </div>
    </section>
  );
}
