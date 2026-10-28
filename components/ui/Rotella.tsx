"use client";

// Rotella stile iOS: si scorre (dito, rotellina, trackpad) e si ferma sempre su una voce (scroll-snap del browser);
// le voci lontane dal centro rimpiccioliscono e sbiadiscono. Frecce su/giù da tastiera, clic su una voce per sceglierla.
// I conti stanno in libs/ui/rotella.ts. SelettoreOra mette insieme le ore e i minuti, con la fascia del trainer al centro.

import { useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { ALTEZZA, componiOra, distanza, due, indiceDa, minutiDi, ORE, RIGA, separaOra } from "@/libs/ui/rotella";

// le voci sfumano verso i bordi: quelle a metà fuori non si vedono tagliate
const SFUMATURA = "linear-gradient(transparent 6%, #000 38%, #000 62%, transparent 94%)";

type Props = { voci: number[]; valore: number; onChange(v: number): void; etichetta: string };

export function Rotella({ voci, valore, onChange, etichetta }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [scroll, setScroll] = useState(0);
  const indice = Math.max(0, voci.indexOf(valore));
  // sempre l'ultimo valore e l'ultimo onChange, senza riagganciare lo scorrimento a ogni disegno
  const ultimi = useRef({ valore, onChange });
  ultimi.current = { valore, onChange };
  const fotogramma = useRef(0);
  // dove la rotella sta andando dopo un tasto o un clic: più frecce di fila sommano i passi, anche a metà corsa
  const meta = useRef<number | null>(null);

  // all'apertura (e se il valore cambia da fuori) la rotella è già sulla voce giusta, senza animazione
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || indiceDa(el.scrollTop, voci.length) === indice) return;
    el.scrollTop = indice * RIGA;
    setScroll(el.scrollTop);
  }, [indice, voci.length]);

  const vai = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const verso = Math.min(voci.length - 1, Math.max(0, i));
    meta.current = verso;
    el.scrollTo({ top: verso * RIGA, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div
      role="spinbutton"
      tabIndex={0}
      aria-label={etichetta}
      aria-valuenow={valore}
      aria-valuetext={due(valore)}
      onKeyDown={(e) => {
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
        e.preventDefault();
        vai((meta.current ?? indice) + (e.key === "ArrowUp" ? -1 : 1));
      }}
      className="relative w-[46px] rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--trainer)]"
      style={{ height: ALTEZZA }}
    >
      <div
        ref={ref}
        onScroll={() => {
          cancelAnimationFrame(fotogramma.current);
          fotogramma.current = requestAnimationFrame(() => {
            const el = ref.current;
            if (!el) return;
            setScroll(el.scrollTop);
            if (meta.current !== null && Math.abs(el.scrollTop - meta.current * RIGA) < 1) meta.current = null; // arrivata
            const v = voci[indiceDa(el.scrollTop, voci.length)];
            if (v !== ultimi.current.valore) ultimi.current.onChange(v);
          });
        }}
        // il dito o la rotellina prendono il comando: la meta dei tasti non vale più
        onWheel={() => (meta.current = null)}
        onPointerDown={() => (meta.current = null)}
        className="rotella h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain"
        style={{ paddingBlock: (ALTEZZA - RIGA) / 2 }}
      >
        {voci.map((v, i) => {
          const d = distanza(i, scroll);
          return (
            <button
              key={v}
              type="button"
              tabIndex={-1}
              onClick={() => vai(i)}
              className="flex w-full cursor-pointer snap-center items-center justify-center text-[15px] tabular-nums"
              style={{ height: RIGA, opacity: Math.max(0.22, 1 - d * 0.32), transform: `scale(${Math.max(0.8, 1 - d * 0.09)})`, fontWeight: d < 0.5 ? 700 : 500 }}
            >
              {due(v)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// L'orario "HH:MM" a due rotelle. I minuti si calcolano una volta all'apertura: un minuto fuori dai passi di 5
// (minutiDi) resta tra le voci finché il modulo è aperto, così scorrendo la lista non cambia sotto il dito.
export function SelettoreOra({ valore, onChange }: { valore: string; onChange(v: string): void }) {
  const { h, m } = separaOra(valore);
  const [minuti] = useState(() => minutiDi(m));
  return (
    <div className="relative flex items-center justify-center gap-[2px] rounded-[14px] bg-soft px-[8px]" style={{ height: ALTEZZA }}>
      {/* la fascia al centro, come su iOS: dice qual è l'orario scelto */}
      <span aria-hidden className="sel-trainer pointer-events-none absolute inset-x-[6px] top-1/2 -translate-y-1/2 rounded-[10px]" style={{ height: RIGA }} />
      <div className="relative flex items-center" style={{ maskImage: SFUMATURA, WebkitMaskImage: SFUMATURA }}>
        <Rotella voci={ORE} valore={h} onChange={(nh) => onChange(componiOra(nh, m))} etichetta="Ore" />
        <span aria-hidden className="pb-[2px] text-[15px] font-bold">
          :
        </span>
        <Rotella voci={minuti} valore={m} onChange={(nm) => onChange(componiOra(h, nm))} etichetta="Minuti" />
      </div>
    </div>
  );
}
