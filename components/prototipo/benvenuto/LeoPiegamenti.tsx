"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { playSound } from "@/libs/ui/sound";

// Leo nel passo "Conosci Leo". Prima, grande sul bianco sopra il pannello arancione (che si abbassa per fargli
// posto), fa 3 piegamenti, si rialza e saluta: video vero su fondo bianco (piegamenti.mp4, da IMMAGINI APP/LEO
// PIEGAMENTI.mp4 scontornato e appoggiato sul bianco), così resta nitido. I piegamenti sono contati in grande nel
// colore del trainer; al saluto compare "Eccomi!". Alla scelta del tono (piccolo) Leo scende in basso a sinistra
// sopra il pannello, che torna grande: lì è l'immagine scontornata del saluto (piegamenti-fine.webp), con la sua
// ombra. Nel finale (festa) resta lì, fermo, e dice "Tutto pronto!". Con "riduci movimento": sempre
// l'immagine ferma.

const VIDEO = "/prototipo/coach/piegamenti.mp4";
const FERMO = "/prototipo/coach/piegamenti-fine.webp";

// Istanti del video (s), presi fotogramma per fotogramma: risalita di ogni piegamento, saluto.
const RIPETIZIONI = [2.17, 3.75, 5.17];
const SALUTA = 7.6;

// Scaricato in anticipo (dal passo prima), così sul passo di Leo il video parte subito.
let scaricato: Promise<Blob> | null = null;
export function preparaLeo(): Promise<Blob> {
  scaricato ??= fetch(VIDEO).then((r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.blob();
  });
  scaricato.catch(() => {
    scaricato = null; // rete assente: si riprova la prossima volta
  });
  return scaricato;
}

// Le due posizioni, in percentuale della metà sinistra: in alto al centro sul bianco, in basso a sinistra.
const GRANDE = { top: "1.5%", left: "50%", height: "51%", x: "-50%" };
const PICCOLO = { top: "60%", left: "1%", height: "37%", x: "0%" };

export function LeoPiegamenti({ piccolo, festa = false }: { piccolo: boolean; festa?: boolean }) {
  const reduce = useReducedMotion();
  const [src, setSrc] = useState<string | null>(null);
  const [conta, setConta] = useState(0);
  const [saluta, setSaluta] = useState(!!reduce);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (reduce) return;
    let url: string | null = null;
    let vivo = true;
    preparaLeo()
      .then((b) => {
        if (!vivo) return;
        url = URL.createObjectURL(b);
        setSrc(url);
      })
      .catch(() => vivo && setSrc(VIDEO));
    return () => {
      vivo = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [reduce]);

  // Conteggio e saluto seguono il tempo del video, a ogni fotogramma disegnato.
  useEffect(() => {
    const v = video.current;
    if (!v || !src) return;
    let id = 0;
    let fatti = 0;
    const segui = () => {
      const t = v.currentTime;
      const n = RIPETIZIONI.filter((r) => t >= r).length;
      if (n > fatti) {
        fatti = n;
        setConta(n);
        playSound("tap");
      }
      if (n === 3 && t >= RIPETIZIONI[2] + 1.2) setConta(0);
      if (t >= SALUTA) setSaluta(true);
      if (!v.ended) id = requestAnimationFrame(segui);
    };
    id = requestAnimationFrame(segui);
    return () => cancelAnimationFrame(id);
  }, [src]);

  // Arrivati alla scelta del tono Leo scende a salutare: se si stava ancora allenando, il video si ferma.
  useEffect(() => {
    if (!piccolo) return;
    video.current?.pause();
    setConta(0);
    setSaluta(true);
  }, [piccolo]);

  const fermo = reduce || piccolo;

  return (
    <motion.div
      className="pointer-events-none absolute z-[12] aspect-[580/666]"
      // arrivando direttamente al finale (?riprendi) Leo nasce già in basso a sinistra
      initial={{ ...(piccolo ? PICCOLO : GRANDE), opacity: 0 }}
      animate={{ ...(piccolo ? PICCOLO : GRANDE), opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={reduce ? { duration: 0.3 } : { type: "spring", stiffness: 120, damping: 22, mass: 1 }}
    >
      {/* sul bianco il video; in basso, sopra l'arancione, l'immagine scontornata (stessa posa dell'ultimo fotogramma) */}
      {fermo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={FERMO} alt="Leo ti saluta" className="absolute inset-0 h-full w-full object-contain" draggable={false} />
      ) : (
        src && (
        <video
          ref={video}
          src={src}
          autoPlay
          muted
          playsInline
          preload="auto"
          aria-label="Leo fa tre piegamenti, si rialza e ti saluta"
          className="absolute inset-0 h-full w-full rounded-[22px] bg-white object-contain"
        />
        )
      )}

      {/* i piegamenti contati in grande, nel colore del trainer */}
      <AnimatePresence mode="popLayout">
        {conta > 0 && !piccolo && (
          <motion.span
            key={conta}
            className="absolute -right-[6%] top-[22%] text-[84px] font-black leading-none tracking-[-0.04em] text-[var(--trainer)]"
            initial={{ opacity: 0, scale: 0.4, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.25, y: -14, transition: { duration: 0.22 } }}
            transition={{ type: "spring", stiffness: 520, damping: 20 }}
          >
            {conta}
          </motion.span>
        )}
      </AnimatePresence>

      {/* nel finale, sopra la testa di Leo piccolo (a destra c'è il telefono) */}
      <AnimatePresence>
        {festa && (
          <motion.span
            key="pronto"
            className="absolute -top-[13%] left-[16%] whitespace-nowrap rounded-[16px] rounded-bl-[4px] bg-card px-[13px] py-[8px] text-[14px] font-bold text-ink shadow-[0_14px_30px_-14px_rgba(40,20,10,0.45)]"
            initial={{ opacity: 0, scale: reduce ? 1 : 0.6, y: reduce ? 0 : 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
            transition={reduce ? { duration: 0.3 } : { type: "spring", stiffness: 420, damping: 22, delay: 0.5 }}
            style={{ transformOrigin: "0% 100%" }}
          >
            Tutto pronto! 🎉
          </motion.span>
        )}
      </AnimatePresence>

      {/* il saluto, accanto alla mano alzata */}
      <AnimatePresence>
        {saluta && !piccolo && (
          <motion.span
            key="eccomi"
            className="absolute -left-[8%] top-[6%] rounded-[16px] rounded-br-[4px] bg-[var(--trainer)] px-[14px] py-[9px] text-[15px] font-bold text-white shadow-[0_14px_30px_-14px_rgba(40,20,10,0.45)]"
            initial={{ opacity: 0, scale: reduce ? 1 : 0.6, y: reduce ? 0 : 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
            transition={reduce ? { duration: 0.3 } : { type: "spring", stiffness: 420, damping: 22 }}
            style={{ transformOrigin: "100% 100%" }}
          >
            Eccomi! 👋
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
