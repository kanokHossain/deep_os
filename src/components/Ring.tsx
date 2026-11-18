import type { ReactNode } from "react";

interface Props {
  /** 0..1 */
  progress: number;
  over?: boolean;
  paused?: boolean;
  children: ReactNode;
}

const R = 140;
const C = 2 * Math.PI * R;

/** A slim, quiet ring that fills as the session goes on. */
export function Ring({ progress, over, paused, children }: Props) {
  const p = Math.max(0, Math.min(1, progress));
  const cls = ["ring", over ? "over" : "", paused ? "paused" : ""].join(" ").trim();
  return (
    <div className={cls}>
      <svg viewBox="0 0 300 300" aria-hidden="true">
        <circle className="track" cx="150" cy="150" r={R} />
        <circle
          className="arc"
          cx="150"
          cy="150"
          r={R}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - p)}
          transform="rotate(-90 150 150)"
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}
