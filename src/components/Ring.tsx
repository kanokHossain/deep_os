import type { ReactNode } from "react";

interface Props {
  /** 0..1 */
  progress: number;
  over?: boolean;
  paused?: boolean;
  children: ReactNode;
}

const TICKS = 60;
const OUTER = 146;

/**
 * The session dial: sixty minute ticks around a flat face, like a watch bezel.
 * Ticks light up as the session runs; the current one stands out.
 */
export function Ring({ progress, over, paused, children }: Props) {
  const p = Math.max(0, Math.min(1, progress));
  const lit = p > 0 ? Math.max(1, Math.ceil(p * TICKS)) : 0;
  const cls = ["ring", over ? "over" : "", paused ? "paused" : ""].join(" ").trim();
  return (
    <div className={cls}>
      <div className="ring-disc" aria-hidden="true" />
      <svg viewBox="0 0 300 300" aria-hidden="true">
        {Array.from({ length: TICKS }, (_, i) => {
          const major = i % 5 === 0;
          const current = lit > 0 && i === lit - 1;
          const len = current ? 18 : major ? 12 : 7;
          const a = (i / TICKS) * 2 * Math.PI - Math.PI / 2;
          const c = Math.cos(a);
          const s = Math.sin(a);
          const state = current ? "tick now" : i < lit ? "tick on" : "tick";
          return (
            <line
              key={i}
              className={`${state}${major ? " major" : ""}`}
              x1={150 + OUTER * c}
              y1={150 + OUTER * s}
              x2={150 + (OUTER - len) * c}
              y2={150 + (OUTER - len) * s}
            />
          );
        })}
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}
