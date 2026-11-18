import type { ReactNode } from "react";

interface Props {
  /** 0..1 */
  progress: number;
  over?: boolean;
  paused?: boolean;
  children: ReactNode;
}

const R = 136;
const C = 2 * Math.PI * R;

/** The session dial: a glowing arc that fills as you go deeper. */
export function Ring({ progress, over, paused, children }: Props) {
  const p = Math.max(0, Math.min(1, progress));
  const angle = p * 2 * Math.PI - Math.PI / 2;
  const dotX = 150 + R * Math.cos(angle);
  const dotY = 150 + R * Math.sin(angle);
  const cls = ["ring", over ? "over" : "", paused ? "paused" : ""].join(" ").trim();

  return (
    <div className={cls}>
      <svg viewBox="0 0 300 300" aria-hidden="true">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--biolume)" />
            <stop offset="100%" stopColor="var(--biolume-2)" />
          </linearGradient>
          <filter id="ringGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i / 60) * 2 * Math.PI;
          const long = i % 5 === 0;
          const r1 = R + 16;
          const r2 = R + (long ? 24 : 20);
          return (
            <line
              key={i}
              className={long ? "tick long" : "tick"}
              x1={150 + r1 * Math.cos(a)}
              y1={150 + r1 * Math.sin(a)}
              x2={150 + r2 * Math.cos(a)}
              y2={150 + r2 * Math.sin(a)}
            />
          );
        })}
        <circle className="track" cx="150" cy="150" r={R} />
        <circle
          className="arc"
          cx="150"
          cy="150"
          r={R}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - p)}
          transform="rotate(-90 150 150)"
          filter="url(#ringGlow)"
        />
        {p > 0.002 && <circle className="head" cx={dotX} cy={dotY} r="7" />}
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}
