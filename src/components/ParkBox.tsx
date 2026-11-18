import { forwardRef, useRef, useState } from "react";
import { dispatch } from "../lib/store";
import { ArrowUpIcon, ThoughtIcon } from "./Icons";

interface Props {
  task: string;
  compact?: boolean;
}

/** Send the parked thought up to the Inbox as a rising bubble, so you see where it went. */
function floatToInbox(from: HTMLElement, text: string) {
  const target = document.getElementById("nav-inbox");
  if (!target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return bump(target);
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const bubble = document.createElement("div");
  bubble.className = "thought-bubble";
  bubble.textContent = text.length > 34 ? `${text.slice(0, 33)}…` : text;
  bubble.style.left = `${a.left + 16}px`;
  bubble.style.top = `${a.top}px`;
  document.body.appendChild(bubble);
  const dx = b.left + b.width / 2 - (a.left + 16);
  const dy = b.top + b.height / 2 - a.top;
  const anim = bubble.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.35}px, ${dy * 0.55 - 40}px) scale(0.9)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.2)`, opacity: 0 },
    ],
    { duration: 900, easing: "cubic-bezier(.45,.05,.3,1)" },
  );
  anim.onfinish = () => {
    bubble.remove();
    bump(target);
  };
}

function bump(el: HTMLElement | null) {
  if (!el) return;
  el.classList.remove("bump");
  void el.offsetWidth;
  el.classList.add("bump");
}

/** The core idea: a thought shows up, you park it in one line, you keep working. */
export const ParkBox = forwardRef<HTMLInputElement, Props>(function ParkBox({ task, compact }, ref) {
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className={compact ? "park park-compact" : "park"}>
      {!compact && (
        <label htmlFor="park-input" className="park-label">
          <ThoughtIcon className="label-icon" />
          Something buzzing in your mind? Park it here and let it go. <kbd>P</kbd>
        </label>
      )}
      <form
        ref={formRef}
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          const value = text.trim();
          if (!value) return;
          dispatch({ type: "park", text: value, now: Date.now() });
          if (!compact && formRef.current) floatToInbox(formRef.current, value);
          setText("");
          setNote(`Off your mind. Back to ${task}.`);
          (e.currentTarget.querySelector("input") as HTMLInputElement | null)?.blur();
        }}
      >
        <input
          ref={ref}
          id={compact ? "park-input-mini" : "park-input"}
          type="text"
          maxLength={280}
          value={text}
          aria-label="Park a thought"
          placeholder={compact ? "Anything buzzing? Park it" : "Call the bank, reply to Rafi, that idea for later…"}
          onChange={(e) => {
            setText(e.target.value);
            if (note) setNote("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") e.currentTarget.blur();
          }}
        />
        <button type="submit" aria-label="Park this thought" disabled={!text.trim()}>
          {compact ? "Park" : <ArrowUpIcon />}
        </button>
      </form>
      {!compact && (
        <div className="park-note" aria-live="polite">
          {note}
        </div>
      )}
    </div>
  );
});
