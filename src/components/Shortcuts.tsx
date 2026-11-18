import { useEffect, useRef } from "react";

export const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["N"], label: "Start a new task" },
  { keys: ["P"], label: "Unload a thought" },
  { keys: ["Space"], label: "Pause or resume" },
  { keys: ["D"], label: "Mark task done" },
  { keys: ["S"], label: "Stop for now" },
  { keys: ["O"], label: "Pop out the mini timer" },
  { keys: ["1"], label: "Go to Focus" },
  { keys: ["2"], label: "Go to Brain dump" },
  { keys: ["3"], label: "Go to Analytics" },
  { keys: ["?"], label: "Show these shortcuts" },
  { keys: ["Esc"], label: "Close or leave a text box" },
];

export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <div className="dialog-head">
          <h2 id="shortcuts-title">Keyboard shortcuts</h2>
          <button ref={closeRef} type="button" className="ghost small" onClick={onClose}>
            Close
          </button>
        </div>
        <ul className="keys">
          {SHORTCUTS.map((s) => (
            <li key={s.label}>
              <span>{s.label}</span>
              <span>
                {s.keys.map((k) => (
                  <kbd key={k}>{k}</kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
