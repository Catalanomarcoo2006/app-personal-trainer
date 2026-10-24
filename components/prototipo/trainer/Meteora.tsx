"use client";

import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { EASE_OUT } from "@/components/ui/motion";
import { suonoMeteora } from "@/libs/ui/sound";

// Una scheda della home che cade dall'alto come un meteorite, all'arrivo dal benvenuto (libs/prototipo/ingresso.ts):
// parte fuori dallo schermo, leggermente inclinata e con una scia nel colore del trainer, accelera, si pianta al suo
// posto schiacciandosi un attimo e alza una nuvola di polvere; fischio e impatto con suonoMeteora.
// Il contenuto si monta solo quando parte la caduta: così i numeri contano e i grafici crescono dopo l'atterraggio.
// Con "riduci movimento" la scheda compare e basta.

const CADUTA = 0.46; // s

export function Meteora({
  ritardo,
  inclina = 5,
  tono = 1,
  onAtterra,
  className,
  children,
}: {
  ritardo: number;
  inclina?: number;
  tono?: number;
  onAtterra?: () => void;
  className?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const posto = useRef<HTMLDivElement>(null);
  const [distanza, setDistanza] = useState(0);
  const [fase, setFase] = useState<"attesa" | "cade" | "giu">("attesa");
  const atterra = useRef(onAtterra);
  atterra.current = onAtterra;

  // da quanto in alto parte: tutta la strada fino a sotto il bordo superiore della finestra
  useLayoutEffect(() => {
    const r = posto.current?.getBoundingClientRect();
    if (r) setDistanza(r.bottom + 60);
  }, []);

  useEffect(() => {
    const via = window.setTimeout(() => {
      setFase("cade");
      if (!reduce) suonoMeteora(CADUTA, tono);
    }, ritardo * 1000);
    const giu = window.setTimeout(
      () => {
        setFase("giu");
        atterra.current?.();
      },
      (ritardo + (reduce ? 0.3 : CADUTA)) * 1000,
    );
    return () => {
      window.clearTimeout(via);
      window.clearTimeout(giu);
    };
  }, [ritardo, reduce, tono]);

  const partita = fase !== "attesa";

  return (
    <div ref={posto} className={`relative flex flex-col ${fase === "cade" ? "z-40" : ""} ${className ?? ""}`}>
      {partita &&
        (reduce ? (
          <motion.div className="flex min-h-0 flex-1 flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {children}
          </motion.div>
        ) : (
          <motion.div
            className="relative flex min-h-0 flex-1 flex-col"
            style={{ transformOrigin: "50% 100%" }}
            initial={{ y: -distanza, rotate: inclina, scale: 1.05 }}
            animate={
              fase === "cade"
                ? { y: 0, rotate: 0, scale: 1 }
                : { y: 0, rotate: 0, scale: 1, scaleY: [0.955, 1.012, 1], scaleX: [1.025, 0.995, 1] }
            }
            transition={
              fase === "cade"
                ? { duration: CADUTA, ease: [0.5, 0, 0.9, 0.55] }
                : { duration: 0.38, ease: EASE_OUT }
            }
          >
            {/* la scia: si spegne all'impatto */}
            <motion.span
              aria-hidden
              className="pointer-events-none absolute bottom-[60%] left-1/2 -z-10 w-[56%] -translate-x-1/2 rounded-full"
              style={{
                height: Math.min(distanza, 420),
                background: "linear-gradient(to bottom, transparent, color-mix(in srgb, var(--trainer) 30%, transparent) 70%, color-mix(in srgb, var(--trainer) 55%, transparent))",
              }}
              initial={{ opacity: 0.95, scaleY: 1 }}
              animate={fase === "giu" ? { opacity: 0, scaleY: 0.2 } : { opacity: 0.95, scaleY: 1 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
            />
            {children}
          </motion.div>
        ))}

      {/* la polvere dell'impatto, sotto la scheda */}
      {fase === "giu" && !reduce && (
        <>
          <motion.span
            aria-hidden
            className="pointer-events-none absolute -bottom-[10px] left-1/2 h-[22px] w-[90%] -translate-x-1/2 rounded-[50%]"
            style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--trainer) 38%, transparent), transparent)" }}
            initial={{ opacity: 0.9, scaleX: 0.5 }}
            animate={{ opacity: 0, scaleX: 1.35 }}
            transition={{ duration: 0.7, ease: EASE_OUT }}
          />
          {[-1, 1].map((lato) => (
            <motion.span
              key={lato}
              aria-hidden
              className="pointer-events-none absolute -bottom-[4px] size-[7px] rounded-full"
              style={{ left: lato < 0 ? "8%" : "92%", background: "color-mix(in srgb, var(--trainer) 55%, transparent)" }}
              initial={{ opacity: 1, x: 0, y: 0 }}
              animate={{ opacity: 0, x: lato * 26, y: -18 }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
            />
          ))}
        </>
      )}
    </div>
  );
}
