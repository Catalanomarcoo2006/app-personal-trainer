"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "motion/react";

// Coriandoli del finale del benvenuto, nel colore del trainer (pieno, chiaro e scuro): una pioggia continua
// su tutta la pagina finché si resta sul finale (ogni pezzo ricade dall'alto con il suo ritmo). Con "riduci
// movimento" niente coriandoli.

const QUANTI = 90;
const COLORI = [
  "var(--trainer)",
  "var(--trainer)",
  "color-mix(in srgb, var(--trainer) 55%, white)",
  "color-mix(in srgb, var(--trainer) 30%, white)",
  "color-mix(in srgb, var(--trainer) 75%, black)",
];

type Pezzo = { x: number; deriva: number; giri: number; w: number; h: number; tondo: boolean; colore: string; ritardo: number; durata: number };

function pezzi(): Pezzo[] {
  return Array.from({ length: QUANTI }, () => {
    const tondo = Math.random() < 0.25;
    const w = tondo ? 7 + Math.random() * 4 : 6 + Math.random() * 5;
    return {
      x: Math.random() * 100,
      deriva: (Math.random() - 0.5) * 220,
      giri: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540),
      w,
      h: tondo ? w : w * (1.6 + Math.random() * 0.9),
      tondo,
      colore: COLORI[Math.floor(Math.random() * COLORI.length)],
      ritardo: Math.random() * 3,
      durata: 2.4 + Math.random() * 1.6,
    };
  });
}

export function Coriandoli() {
  const reduce = useReducedMotion();
  // generati dopo il montaggio: valori casuali diversi tra server e browser darebbero errori d'idratazione
  const [lista, setLista] = useState<Pezzo[]>([]);
  const contenitore = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduce) return;
    setLista(pezzi());
  }, [reduce]);

  // la caduta con le Web Animations (90 pezzi: niente lavoro di React a ogni fotogramma)
  useEffect(() => {
    const pezziDom = contenitore.current?.children;
    if (!pezziDom) return;
    const fondo = window.innerHeight + 40;
    const animazioni = lista.map((p, i) =>
      pezziDom[i].animate(
        [
          { transform: "translate(0, -30px) rotate(0deg)", opacity: 1 },
          { transform: `translate(${p.deriva * 0.6}px, ${fondo * 0.55}px) rotate(${p.giri * 0.6}deg)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${p.deriva}px, ${fondo}px) rotate(${p.giri}deg)`, opacity: 0.85 },
        ],
        { duration: p.durata * 1000, delay: p.ritardo * 1000, iterations: Infinity, easing: "cubic-bezier(0.25, 0.4, 0.55, 1)", fill: "backwards" },
      ),
    );
    return () => animazioni.forEach((a) => a.cancel());
  }, [lista]);

  if (lista.length === 0) return null;
  // nel body: dentro il passo (che scorre e si sfuma) i coriandoli resterebbero tagliati
  return createPortal(
    <div ref={contenitore} aria-hidden className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {lista.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 block"
          style={{ left: `${p.x}%`, width: p.w, height: p.h, background: p.colore, borderRadius: p.tondo ? "50%" : 2, transform: "translateY(-30px)" }}
        />
      ))}
    </div>,
    document.body,
  );
}
