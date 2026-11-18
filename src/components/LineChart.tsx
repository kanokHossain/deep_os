import { useEffect, useId, useRef, useState } from "react";

export interface Point {
  label: string;
  value: number; // minutes
  highlight?: boolean;
}

const PAD = { top: 30, right: 20, bottom: 34, left: 56 };

/** 45 → "45m", 90 → "1h 30m", 120 → "2h" */
export function shortHours(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Pick a clean axis top and step: 30-minute steps up to 2h, then whole hours. */
function scale(max: number) {
  const step = max <= 120 ? 30 : max <= 360 ? 60 : 120;
  const top = Math.max(step * 2, Math.ceil(max / step) * step);
  return { top, step };
}

/**
 * Monotone cubic curve (Fritsch–Carlson): smooth like a spline, but never overshoots the data,
 * so a day can't look higher than it was or dip below zero.
 */
function monotone(pts: [number, number][]) {
  const n = pts.length;
  if (n < 2) return "";
  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0]);
    slope.push((pts[i + 1][1] - pts[i][1]) / dx[i]);
  }
  const m: number[] = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    m.push(slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2);
  }
  m.push(slope[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / slope[i];
    const b = m[i + 1] / slope[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      m[i] = t * a * slope[i];
      m[i + 1] = t * b * slope[i];
    }
  }
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const h = dx[i] / 3;
    d += ` C${x0 + h},${y0 + m[i] * h} ${x1 - h},${y1 - m[i + 1] * h} ${x1},${y1}`;
  }
  return d;
}

/** Line chart of focused time per day, with hour gridlines, a soft area fill and hoverable points. */
export function LineChart({ points }: { points: Point[] }) {
  const id = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  // Draw at the real pixel width so text stays 12px on every screen.
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(() => (typeof window !== "undefined" && window.innerWidth < 600 ? 300 : 720));
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = W < 520 ? 210 : 260;
  const { top, step } = scale(Math.max(...points.map((p) => p.value), 0));
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v: number) => PAD.top + ih - (v / top) * ih;
  const xy = points.map((p, i) => [x(i), y(p.value)] as [number, number]);
  const floor = y(0);
  const line = monotone(xy);
  const area = `${line} L${x(points.length - 1)},${floor} L${x(0)},${floor} Z`;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const active = hover ?? points.findIndex((p) => p.highlight);

  return (
    <div className="linechart" ref={box}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Focused time per day: ${points.map((p) => `${p.label} ${shortHours(p.value)}`).join(", ")}`}>
        <defs>
          <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line className="lc-grid" x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} />
            <text className="lc-axis" x={PAD.left - 12} y={y(t) + 4} textAnchor="end">
              {t === 0 ? "0" : shortHours(t)}
            </text>
          </g>
        ))}

        {points.map((p, i) => (
          <text key={p.label + i} className={p.highlight ? "lc-axis lc-today" : "lc-axis"} x={x(i)} y={H - 10} textAnchor="middle">
            {p.label}
          </text>
        ))}

        <path d={area} fill={`url(#area-${id})`} />
        <path d={line} className="lc-line" />

        {active >= 0 && (
          <line className="lc-guide" x1={xy[active][0]} x2={xy[active][0]} y1={PAD.top - 6} y2={floor} />
        )}

        {xy.map(([px, py], i) => (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} className="lc-pt-wrap">
            <circle cx={px} cy={py} r="16" fill="transparent" />
            <circle cx={px} cy={py} r={i === active ? 7 : 5} className={points[i].highlight ? "lc-pt today" : "lc-pt"} />
          </g>
        ))}

        {active >= 0 && (
          <g className="lc-tip" transform={`translate(${Math.min(Math.max(xy[active][0], PAD.left + 40), W - PAD.right - 40)}, ${Math.max(xy[active][1] - 18, 14)})`}>
            <rect x="-40" y="-17" width="80" height="24" rx="8" />
            <text x="0" y="0" textAnchor="middle">
              {shortHours(points[active].value)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
