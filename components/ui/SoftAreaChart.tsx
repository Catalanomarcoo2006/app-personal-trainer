"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { EASE_OUT } from "./motion";

// Curva morbida che si disegna da sinistra a destra, con un'area sfumata sotto.
export default function SoftAreaChart({
  points,
  color = "var(--trainer)",
  height,
}: {
  points: number[];
  color?: string;
  /** Altezza in px; senza, il grafico riempie il contenitore (che deve avere un'altezza). */
  height?: number;
}) {
  const id = useId();
  const w = 300;
  const h = 100;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const pad = 10;
  const padX = 8;
  const xy = points.map((p, i) => [
    padX + (i / (points.length - 1)) * (w - padX * 2),
    pad + (1 - (p - min) / (max - min || 1)) * (h - pad * 2),
  ]);

  // Catmull-Rom → Bézier: passa per tutti i punti senza spigoli.
  let line = `M ${xy[0][0]} ${xy[0][1]}`;
  for (let i = 0; i < xy.length - 1; i++) {
    const [x0, y0] = xy[Math.max(0, i - 1)];
    const [x1, y1] = xy[i];
    const [x2, y2] = xy[i + 1];
    const [x3, y3] = xy[Math.min(xy.length - 1, i + 2)];
    const c1x = x1 + (x2 - x0) / 6;
    const c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6;
    const c2y = y2 - (y3 - y1) / 6;
    line += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
  }
  const area = `${line} L ${xy[xy.length - 1][0]} ${h} L ${xy[0][0]} ${h} Z`;
  const [lx, ly] = xy[xy.length - 1];

  return (
    <div className={`relative ${height === undefined ? "h-full" : ""}`} style={height === undefined ? undefined : { height }}>
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.path d={area} fill={`url(#${id})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.6 }} />
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.3, duration: 1.2, ease: EASE_OUT }}
      />
    </svg>
      {/* Il punto finale è HTML: nell'SVG deformato diventerebbe un'ellisse */}
      <motion.span
        className="absolute size-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.2px] bg-card"
        style={{ left: `${(lx / w) * 100}%`, top: `${(ly / h) * 100}%`, borderColor: color }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.45, type: "spring", stiffness: 400, damping: 18 }}
      />
    </div>
  );
}
