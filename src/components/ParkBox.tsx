import { forwardRef, useState } from "react";
import { dispatch } from "../lib/store";

interface Props {
  task: string;
  compact?: boolean;
}

/** The core idea: a thought shows up, you park it in one line, you keep working. */
export const ParkBox = forwardRef<HTMLInputElement, Props>(function ParkBox({ task, compact }, ref) {
  const [text, setText] = useState("");
  const [note, setNote] = useState("");

  return (
    <div className={compact ? "park park-compact" : "park"}>
      {!compact && <label htmlFor="park-input">Something else popped into your head? Park it and keep going.</label>}
      <form
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          dispatch({ type: "park", text, now: Date.now() });
          setText("");
          setNote(`Parked. Back to: ${task}`);
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
          placeholder={compact ? "Park a thought, press Enter" : "e.g. Email the vendor about the invoice"}
          onChange={(e) => {
            setText(e.target.value);
            if (note) setNote("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") e.currentTarget.blur();
          }}
        />
        <button type="submit">Park</button>
      </form>
      <div className="park-note" aria-live="polite">{note}</div>
    </div>
  );
});
