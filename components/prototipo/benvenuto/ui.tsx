"use client";

import { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, LoaderCircle } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import type { Passo } from "@/libs/prototipo/benvenuto";

// Pezzi comuni dei passi del benvenuto, nello stile del riferimento (docs/riferimenti/animazione-login.mp4):
// asterisco colorato, titolo deciso, sottotitolo grigio, campi chiari, un tasto pieno largo.

// Ogni elemento di un passo entra dal basso, uno dopo l'altro.
export function Entra({ i = 0, children, className }: { i?: number; children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: EASE_OUT, delay: 0.06 + i * 0.05 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Asterisco() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden className="text-[var(--trainer)]">
      {[0, 60, 120].map((r) => (
        <rect key={r} x="11.6" y="1" width="2.8" height="24" rx="1.4" fill="currentColor" transform={`rotate(${r} 13 13)`} />
      ))}
    </svg>
  );
}

export function TestaPasso({ titolo, sotto }: { titolo: string; sotto?: ReactNode }) {
  return (
    <div>
      <Entra i={0}>
        <Asterisco />
      </Entra>
      <Entra i={1}>
        <h1 className="mt-[14px] text-[28px] font-bold leading-[1.15] tracking-[-0.02em]">{titolo}</h1>
      </Entra>
      {sotto && (
        <Entra i={2}>
          <p className="mt-[8px] text-[14px] leading-[1.5] text-muted">{sotto}</p>
        </Entra>
      )}
    </div>
  );
}

export function Tasto({
  children,
  onClick,
  spento,
  occupato,
  verde,
}: {
  children: ReactNode;
  onClick: () => void;
  spento?: boolean;
  occupato?: string;
  verde?: boolean;
}) {
  const fermo = spento || !!occupato || verde;
  return (
    <motion.button
      type="button"
      disabled={fermo}
      onClick={onClick}
      whileTap={fermo ? undefined : { scale: 0.985 }}
      animate={{ scale: verde ? [1, 1.02, 1] : 1 }}
      transition={{ duration: 0.35 }}
      // il passaggio al verde è a scatto (con un piccolo battito): sfumando dall'arancione verrebbe fuori un marrone
      className={`relative flex h-[48px] w-full items-center justify-center gap-[8px] overflow-hidden rounded-[12px] text-[14.5px] font-semibold ${verde ? "" : "transition-[background-color,color,box-shadow] duration-300"} ${
        verde
          ? "bg-ok text-white shadow-[0_12px_26px_-10px_rgba(47,158,85,0.7)]"
          : spento
            ? "cursor-not-allowed bg-soft text-muted"
            : "btn-trainer cursor-pointer"
      } ${occupato ? "cursor-wait" : ""}`}
    >
      {verde ? (
        <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 500, damping: 22 }}>
          <Check size={17} strokeWidth={3} />
        </motion.span>
      ) : occupato ? (
        <LoaderCircle size={17} className="animate-spin" />
      ) : null}
      {occupato ?? children}
    </motion.button>
  );
}

// Tasto secondario a testo ("Lo faccio dopo", "Indietro").
export function TastoTesto({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="min-h-[44px] cursor-pointer px-[6px] text-[13px] font-semibold text-muted transition-colors hover:text-ink">
      {children}
    </button>
  );
}

// I 5 tratti dei passi (accesso, marchio, accordi, primo cliente, Leo): fatti pieni, il corrente si riempie.
export function Barra({ passo }: { passo: Passo }) {
  return (
    <div className="flex gap-[6px]" aria-label={`Passo ${Math.min(passo + 1, 5)} di 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="h-[5px] w-[38px] overflow-hidden rounded-full bg-soft">
          <motion.span
            className="block h-full rounded-full bg-[var(--trainer)]"
            initial={false}
            animate={{ width: i < passo ? "100%" : i === passo ? "45%" : "0%" }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
          />
        </span>
      ))}
    </div>
  );
}

export function Campo({
  etichetta,
  destra,
  children,
}: {
  etichetta: string;
  destra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-[12.5px] font-semibold">
        {etichetta}
        {destra}
      </span>
      <span className="mt-[6px] block">{children}</span>
    </label>
  );
}

// Classe dei campi di testo: 16 px sotto md (niente zoom sul telefono), bordo chiaro, anello nel colore del trainer.
export const CLASSE_CAMPO =
  "h-[46px] w-full rounded-[11px] border border-line bg-card px-[14px] text-[16px] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted/70 focus:border-[var(--trainer)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--trainer)_16%,transparent)] md:text-[14px]";
