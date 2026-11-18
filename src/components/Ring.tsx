import type { ReactNode } from "react";

interface Props {
  /** 0..1 */
  progress: number;
  over?: boolean;
  paused?: boolean;
  children: ReactNode;
}

const R = 132;
const C = 2 * Math.PI * R;

/** The session dial: a soft disc with a gradient arc and a small marker at the tip. */
export function Ring({ progress, over, paused, children }: Props) {
  const p = Math.max(0, Math.min(1, progress));
  const a = p * 2 * Math.PI - Math.PI / 2;
  const hx = 150 + R * Math.cos(a);
  const hy = 150 + R * Math.sin(a);
  const cls = ["ring", over ? "over" : "", paused ? "paused" : ""].join(" ").trim();
  return (
    <div className={cls}>
      <div className="ring-disc" aria-hidden="true" />
      <svg viewBox="0 0 300 300" aria-hidden="true">
        <defs>
          <linearGradient id="dialGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--dial-a)" />
            <stop offset="100%" stopColor="var(--dial-b)" />
          </linearGradient>
        </defs>
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
        {p > 0.003 && <circle className="tip" cx={hx} cy={hy} r="9" />}
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}
