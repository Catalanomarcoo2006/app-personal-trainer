"use client";

import { createContext, CSSProperties, ReactNode, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

// La pallina di Leo, la mascotte del benvenuto (come la sfera del riferimento animazione-login.mp4):
// fluttua nella vetrina, vola sopra il modulo quando serve con una scritta, salta quando qualcosa riesce
// e si scuote su un errore. È un solo elemento (layoutId): spostandosi da un posto all'altro vola.
// I posti sono segnaposti (SlotPallina) messi nella vetrina, sopra il titolo del passo e nella scena di Leo.

export type DovePallina = "vetrina" | "modulo" | "centro" | "mano" | "nascosta";
export type UmorePallina = "calmo" | "contento" | "no";

type StatoPallina = { dove: DovePallina; scritta?: string; umore: UmorePallina; luce: number };
type Comandi = {
  mostra: (p: { dove: DovePallina; scritta?: string; umore?: UmorePallina }) => void;
  umore: (u: UmorePallina) => void;
  illumina: () => void;
};

const Contesto = createContext<{ stato: StatoPallina; comandi: Comandi } | null>(null);

export function PallinaProvider({ children }: { children: ReactNode }) {
  const [stato, setStato] = useState<StatoPallina>({ dove: "vetrina", umore: "calmo", luce: 0 });
  const timer = useRef<number | undefined>(undefined);

  const umore = useCallback((u: UmorePallina) => {
    window.clearTimeout(timer.current);
    setStato((s) => ({ ...s, umore: u }));
    if (u !== "calmo") timer.current = window.setTimeout(() => setStato((s) => ({ ...s, umore: "calmo" })), 900);
  }, []);
  const mostra = useCallback<Comandi["mostra"]>(
    ({ dove, scritta, umore: u }) => {
      setStato((s) => ({ ...s, dove, scritta }));
      if (u) umore(u);
    },
    [umore],
  );
  const illumina = useCallback(() => setStato((s) => ({ ...s, luce: s.luce + 1 })), []);
  const comandi = useMemo(() => ({ mostra, umore, illumina }), [mostra, umore, illumina]);

  return <Contesto.Provider value={{ stato, comandi }}>{children}</Contesto.Provider>;
}

function useContesto() {
  const c = useContext(Contesto);
  if (!c) throw new Error("usePallina va usato dentro PallinaProvider");
  return c;
}

export const usePallina = () => useContesto().comandi;
export const useDovePallina = () => useContesto().stato.dove;

// La grafica: pallina.webp (bianco perla) colorata nel colore del trainer con un velo "color" tagliato sulla sua forma.
export function PallinaColorata({ size }: { size: number }) {
  return (
    <span
      className="relative block"
      style={{
        width: size,
        height: size,
        // alone chiaro + alone nel colore: la pallina deve staccarsi anche dalla vetrina, che ha il suo stesso colore
        filter: "brightness(1.1) drop-shadow(0 0 2px rgba(255,255,255,0.9)) drop-shadow(0 0 16px rgba(255,255,255,0.75)) drop-shadow(0 0 30px color-mix(in srgb, var(--trainer) 60%, transparent)) drop-shadow(0 14px 18px rgba(0,0,0,0.14))",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/prototipo/coach/pallina.webp" alt="" draggable={false} className="absolute inset-0 size-full select-none" />
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background: "var(--trainer)",
          mixBlendMode: "color",
          opacity: 0.72,
          WebkitMaskImage: "url(/prototipo/coach/pallina.webp)",
          maskImage: "url(/prototipo/coach/pallina.webp)",
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
        }}
      />
    </span>
  );
}

// Segnaposto: la pallina compare qui quando il suo "dove" coincide. size = diametro in quel posto.
export function SlotPallina({ dove, size, className, style }: { dove: DovePallina; size: number; className?: string; style?: CSSProperties }) {
  const { stato } = useContesto();
  const reduce = useReducedMotion();
  const qui = stato.dove === dove;
  const gira = !reduce && dove === "vetrina";

  return (
    <div className={className} style={{ width: size, height: size, ...style }}>
      {qui && (
        <motion.div
          layoutId="pallina"
          className="relative"
          style={{ width: size, height: size, isolation: "isolate" }}
          transition={{ layout: { type: "spring", stiffness: 140, damping: 20, mass: 0.9 } }}
        >
          <AnimatePresence>
            {stato.scritta && (
              <motion.span
                key={stato.scritta}
                initial={{ opacity: 0, y: 6, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 420, damping: 24, delay: 0.25 }}
                className="btn-trainer absolute bottom-[calc(100%+10px)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-[11px] py-[5px] text-[11.5px] font-semibold"
              >
                {stato.scritta}
                <span aria-hidden className="absolute -bottom-[4px] left-1/2 size-[8px] -translate-x-1/2 rotate-45 bg-[var(--trainer)]" />
              </motion.span>
            )}
          </AnimatePresence>
          {/* giro lento su un'ellisse (solo nella vetrina) e fluttuazione */}
          <motion.div
            animate={gira ? { x: [0, 40, 0, -40, 0], y: [-18, 0, 18, 0, -18] } : { x: 0, y: 0 }}
            transition={gira ? { duration: 9, repeat: Infinity, ease: "linear" } : { duration: 0.4 }}
          >
            <motion.div
              animate={reduce ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Umore umore={stato.umore} luce={stato.luce}>
                <PallinaColorata size={size} />
              </Umore>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function Umore({ umore, luce, children }: { umore: UmorePallina; luce: number; children: ReactNode }) {
  const reduce = useReducedMotion();
  const anim =
    reduce || umore === "calmo"
      ? { x: 0, y: 0, scale: 1 }
      : umore === "contento"
        ? { y: [0, -16, 0, -6, 0], scale: [1, 1.08, 0.96, 1.02, 1] }
        : { x: [0, -9, 9, -7, 7, -3, 0] };
  return (
    <motion.div animate={anim} transition={{ duration: umore === "no" ? 0.42 : 0.7, ease: "easeOut" }} className="relative">
      {children}
      {/* lampo di luce quando Leo parla o un passo è completato */}
      <AnimatePresence>
        {luce > 0 && (
          <motion.span
            key={luce}
            aria-hidden
            className="pointer-events-none absolute inset-[-30%] rounded-full"
            style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--trainer) 45%, white) 0%, transparent 62%)" }}
            initial={{ opacity: 0.9, scale: 0.6 }}
            animate={{ opacity: 0, scale: 1.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
