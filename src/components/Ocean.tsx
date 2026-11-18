import { useEffect, useRef } from "react";

/**
 * Slow rising particles behind everything, like looking up from under water.
 * Speed scales gently with depth. Static when the user prefers reduced motion.
 */
export function Ocean({ depth }: { depth: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const depthRef = useRef(depth);
  depthRef.current = depth;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const count = Math.round(Math.min(46, (w * h) / 26000));
    const dots = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.6 + Math.random() * 2.2,
      v: 0.08 + Math.random() * 0.32,
      sway: Math.random() * Math.PI * 2,
    }));

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const d = depthRef.current;
      for (const p of dots) {
        if (!reduce && !document.hidden) {
          p.y -= p.v * (0.6 + d * 0.8);
          p.sway += 0.01;
          if (p.y < -10) {
            p.y = h + 10;
            p.x = Math.random() * w;
          }
        }
        const x = p.x + Math.sin(p.sway) * 6;
        ctx.beginPath();
        ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(94, 234, 212, ${0.05 + p.r * 0.035 + d * 0.05})`;
        ctx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="ocean" aria-hidden="true" />;
}
