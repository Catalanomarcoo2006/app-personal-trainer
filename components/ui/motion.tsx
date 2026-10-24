"use client";

import { ReactNode, useEffect, useState } from "react";
import { animate, motion, MotionConfig, useReducedMotion } from "motion/react";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

// Rispetta "riduci movimento" del sistema: niente spostamenti, solo dissolvenze.
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

// Spostamenti fluidi: Motion anima `transform` e `opacity` sulla scheda grafica (Web Animations), mentre
// x, y e scale li calcola in JavaScript a ogni fotogramma, e scattano appena la pagina ha da fare.
// Chi si muove con `transform` ha la classe "mosso": con "riduci movimento" il CSS lo tiene fermo (globals.css).

// Ingresso a cascata: ogni blocco entra 35 ms dopo il precedente.
export function Appear({ i = 0, className, children }: { i?: number; className?: string; children: ReactNode }) {
  return (
    <motion.div
      className={`mosso ${className ?? ""}`}
      initial={{ opacity: 0, transform: "translateY(10px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      transition={{ delay: 0.02 + i * 0.035, duration: 0.38, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

const euroNumber = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0, useGrouping: "always" });
const plain = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 });

export const formatEuro = (n: number) => `€ ${euroNumber.format(Math.round(n))}`;
export const formatNumber = (n: number) => plain.format(n);

// Numero che sale contando fino al valore (900 ms).
export function CountUp({
  value,
  format = (n) => plain.format(Math.round(n)),
  delay = 0.25,
  duration = 0.9,
}: {
  value: number;
  format?: (n: number) => string;
  delay?: number;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const [current, setCurrent] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setCurrent(value);
      return;
    }
    const controls = animate(0, value, { delay, duration, ease: EASE_OUT, onUpdate: setCurrent });
    return () => controls.stop();
  }, [value, reduce, delay, duration]);

  return <span className="tabular-nums">{format(current)}</span>;
}

// Barra di avanzamento che si riempie.
export function ProgressBar({ percent, fill, track, delay = 0.35 }: { percent: number; fill: string; track: string; delay?: number }) {
  return (
    <div className="h-[3.5px] w-full overflow-hidden rounded-full" style={{ background: track }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: fill }}
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ delay, duration: 1, ease: EASE_OUT }}
      />
    </div>
  );
}
