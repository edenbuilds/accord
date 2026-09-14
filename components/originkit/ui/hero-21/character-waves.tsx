"use client";
import { useEffect, useRef } from "react";

// ASCII wave field from originkit hero-21, typed and trimmed for Accord.
// Pauses when off-screen and draws a single still frame for reduced motion.
type Props = {
  characters?: string;
  cell?: number;
  color?: string;
  background?: string;
  speed?: number;
  className?: string;
};

export default function AsciiWaves({
  characters = " .:-+*=%@#",
  cell = 12,
  color = "#34473a",
  background = "#111a14",
  speed = 16,
  className,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = canvas.parentElement ?? canvas;
    const pointer = { x: -9999, y: -9999, active: false };
    const start = performance.now();
    const max = characters.length - 1;
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = Math.max(1, Math.floor(r.width));
      h = Math.max(1, Math.floor(r.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `500 ${cell}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textBaseline = "top";
    };
    const noise = (x: number, y: number, t: number) =>
      (Math.sin(x * 1.3 + t) * Math.cos(y * 1.1 - t * 0.7) +
        Math.sin((x + y) * 0.7 + t * 0.5) +
        Math.sin(x * 0.4 - y * 0.6 + t * 0.3)) /
      3;
    const draw = (now: number) => {
      const t = ((now - start) / 1000) * (speed / 20);
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = color;
      const step = cell * 0.6;
      const cols = Math.ceil(w / step) + 1;
      const rows = Math.ceil(h / cell) + 1;
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++) {
          const px = i * step;
          const py = j * cell;
          let v = noise(
            i * 0.12 + t * 1.5 + Math.sin((j + t) * 0.1) * 2,
            j * 0.12 + Math.cos((i + t) * 0.1) * 2,
            t * 0.5,
          );
          if (pointer.active) {
            const d = Math.hypot(px - pointer.x, py - pointer.y);
            if (d < 160) v += Math.sin(d * 0.08 - t * 4) * (1 - d / 160) * 1.5;
          }
          const ch = characters.charAt(Math.round(Math.max(0, Math.min(1, (v + 1) / 2)) * max));
          if (ch !== " ") ctx.fillText(ch, px, py);
        }
    };
    const loop = (now: number) => {
      draw(now);
      if (visible && !reduced) raf = requestAnimationFrame(loop);
    };
    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !reduced) raf = requestAnimationFrame(loop);
    });
    io.observe(canvas);
    const move = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active = true;
    };
    const leave = () => {
      pointer.active = false;
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerleave", leave);
    };
  }, [characters, cell, color, background, speed]);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
