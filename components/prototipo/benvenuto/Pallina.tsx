"use client";

import { createContext, CSSProperties, ReactNode, RefObject, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, MotionValue, useReducedMotion, useSpring } from "motion/react";

// La pallina di Leo, la mascotte del benvenuto (come la sfera del riferimento animazione-login.mp4):
// fluttua nella vetrina, vola sopra il modulo quando serve con una scritta, salta quando qualcosa riesce
// e si scuote su un errore. È una sola, disegnata su un livello sopra tutta la scheda (PallinaVolante):
// così attraversa le due metà senza essere tagliata. I posti dove può stare sono segnaposti vuoti
// (SlotPallina) messi nella vetrina, sopra il titolo del passo e nella scena di Leo: la pallina li insegue
// con una molla, anche mentre si spostano.

export type DovePallina = "vetrina" | "modulo" | "centro" | "mano" | "nascosta";
export type UmorePallina = "calmo" | "contento" | "no";

type StatoPallina = { dove: DovePallina; scritta?: string; umore: UmorePallina; luce: number };
type Comandi = {
  mostra: (p: { dove: DovePallina; scritta?: string; umore?: UmorePallina }) => void;
  umore: (u: UmorePallina) => void;
  illumina: () => void;
};
type Posto = { el: HTMLElement; size: number };

type Contesto = {
  stato: StatoPallina;
  comandi: Comandi;
  posti: RefObject<Map<DovePallina, Posto>>;
};

const Ctx = createContext<Contesto | null>(null);

export function PallinaProvider({ children }: { children: ReactNode }) {
  const [stato, setStato] = useState<StatoPallina>({ dove: "vetrina", umore: "calmo", luce: 0 });
  const posti = useRef(new Map<DovePallina, Posto>());
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

  return <Ctx.Provider value={{ stato, comandi, posti }}>{children}</Ctx.Provider>;
}

function useCtx() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePallina va usato dentro PallinaProvider");
  return c;
}

export const usePallina = () => useCtx().comandi;
export const useDovePallina = () => useCtx().stato.dove;

// La grafica: pallina.webp (bianco perla) colorata nel colore del trainer con un velo "color" tagliato sulla sua forma.
export function PallinaColorata({ size }: { size: number }) {
  return (
    <span
      className="relative block"
      style={{
        width: size,
        height: size,
        isolation: "isolate",
        // alone chiaro + alone nel colore: la pallina deve staccarsi anche dalla vetrina, che ha il suo stesso colore
        filter:
          "brightness(1.1) drop-shadow(0 0 2px rgba(255,255,255,0.9)) drop-shadow(0 0 16px rgba(255,255,255,0.75)) drop-shadow(0 0 30px color-mix(in srgb, var(--trainer) 60%, transparent)) drop-shadow(0 14px 18px rgba(0,0,0,0.14))",
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

// Segnaposto vuoto: dice dove sta la pallina quando il suo "dove" è questo. size = diametro in quel posto.
export function SlotPallina({ dove, size, className, style }: { dove: DovePallina; size: number; className?: string; style?: CSSProperties }) {
  const { posti } = useCtx();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mappa = posti.current;
    const el = ref.current;
    if (el) mappa.set(dove, { el, size });
    return () => {
      if (mappa.get(dove)?.el === el) mappa.delete(dove);
    };
  }, [dove, size, posti]);
  return <div ref={ref} aria-hidden className={className} style={{ width: size, height: size, ...style }} />;
}

// La pallina vera, sopra tutta la scheda: va messa dentro il contenitore "relative" che copre le due metà.
export function PallinaVolante() {
  const { stato, posti } = useCtx();
  const reduce = useReducedMotion();
  const livello = useRef<HTMLDivElement>(null);
  const molla = reduce ? { stiffness: 2000, damping: 200 } : { stiffness: 110, damping: 17, mass: 0.9 };
  const x = useSpring(0, molla);
  const y = useSpring(0, molla);
  const lato = useSpring(64, molla);
  const [visibile, setVisibile] = useState(false);
  const primo = useRef(true);

  // ogni fotogramma legge dove si trova il segnaposto e lo dà come meta alle molle
  useEffect(() => {
    let id = 0;
    const segui = () => {
      const posto = stato.dove === "nascosta" ? undefined : posti.current.get(stato.dove);
      const base = livello.current?.getBoundingClientRect();
      const r = posto?.el.getBoundingClientRect();
      const trovato = !!(posto && base && r && r.width > 0);
      // segnaposto non ancora montato (il passo nuovo sta entrando): la pallina resta dov'è e si vede
      const mostra = stato.dove !== "nascosta" && (!posto || trovato);
      if (trovato) {
        const nx = r.left - base.left;
        const ny = r.top - base.top;
        if (primo.current) {
          x.jump(nx);
          y.jump(ny);
          lato.jump(posto.size);
          primo.current = false;
        } else {
          x.set(nx);
          y.set(ny);
          lato.set(posto.size);
        }
      }
      setVisibile((v) => (v === mostra ? v : mostra));
      id = requestAnimationFrame(segui);
    };
    id = requestAnimationFrame(segui);
    return () => cancelAnimationFrame(id);
  }, [stato.dove, posti, x, y, lato]);

  const gira = !reduce && stato.dove === "vetrina";

  return (
    <div ref={livello} className="pointer-events-none absolute inset-0 z-40">
      <motion.div className="absolute left-0 top-0" style={{ x, y, width: lato, height: lato }} animate={{ opacity: visibile ? 1 : 0 }} transition={{ duration: 0.25 }}>
        <AnimatePresence>
          {stato.scritta && (
            <motion.span
              key={stato.scritta}
              initial={{ opacity: 0, y: 6, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 420, damping: 24, delay: 0.45 }}
              className="btn-trainer absolute bottom-[calc(100%+10px)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-[11px] py-[5px] text-[11.5px] font-semibold"
            >
              {stato.scritta}
              <span aria-hidden className="absolute -bottom-[4px] left-1/2 size-[8px] -translate-x-1/2 rotate-45 bg-[var(--trainer)]" />
            </motion.span>
          )}
        </AnimatePresence>
        {/* giro lento su un'ellisse (solo nella vetrina) e fluttuazione */}
        <motion.div
          className="size-full"
          animate={gira ? { x: [0, 40, 0, -40, 0], y: [-18, 0, 18, 0, -18] } : { x: 0, y: 0 }}
          transition={gira ? { duration: 9, repeat: Infinity, ease: "linear" } : { duration: 0.6 }}
        >
          <motion.div className="size-full" animate={reduce ? undefined : { y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <Umore umore={stato.umore} luce={stato.luce}>
              <LatoVivo lato={lato} />
            </Umore>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// La pallina segue il lato della molla (cresce e si rimpicciolisce volando).
function LatoVivo({ lato }: { lato: MotionValue<number> }) {
  const [px, setPx] = useState(() => Math.round(lato.get()));
  useEffect(() => lato.on("change", (v) => setPx(Math.round(v))), [lato]);
  return <PallinaColorata size={px} />;
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
