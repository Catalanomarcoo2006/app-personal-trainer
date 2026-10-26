"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { BARRA_LATO, COACH_NAME } from "./costanti";
import { CoachFace } from "./CoachFace";

// ——— Il tasto delle altre pagine, in fondo alla barra laterale: alone che respira, si illumina quando ci sono novità ———
// La barra (larga 56 px, a 16 px dal bordo) fuori dalla home si allunga e fa posto alla testa (44 px), centrata.

// La prima volta che si apre una sezione diversa dalla home, Leo saluta per farsi notare (una volta per visita).
let coachHintShown = false;

export function CoachButton({ hidden, count, onOpen }: { hidden: boolean; count: number; onOpen: () => void }) {
  const [hover, setHover] = useState(false);
  const [hint, setHint] = useState(false);
  const glowing = count > 0 && !hidden;

  useEffect(() => {
    if (coachHintShown || hidden) return;
    const timers = [
      window.setTimeout(() => {
        coachHintShown = true;
        setHint(true);
      }, 1400),
      window.setTimeout(() => setHint(false), 4800),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [hidden]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={hidden ? { opacity: 0, scale: 0.85 } : { opacity: 1, scale: 1 }}
      transition={{ type: "spring", duration: 0.45, bounce: 0.25, delay: hidden ? 0 : 0.2 }}
      style={{ top: `calc(50% + 40px + ${BARRA_LATO.leoTop}px)`, left: 16 + (56 - BARRA_LATO.leo) / 2 }}
      className={`absolute z-40 ${hidden ? "pointer-events-none" : ""}`}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
    >
      {/* alone nel colore del trainer, sempre acceso: Leo si vede anche fuori dalla home */}
      <motion.span
        aria-hidden
        className="leo-alone pointer-events-none absolute inset-[-8px] rounded-full"
        animate={{ opacity: [0.55, 0.95, 0.55], scale: [0.94, 1.04, 0.94] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
      />
      {glowing && (
        <>
          {/* bagliore che respira */}
          <motion.span
            aria-hidden
            className="absolute inset-[-6px] rounded-full blur-[10px]"
            style={{ background: "var(--trainer)" }}
            animate={{ opacity: [0.45, 0.95, 0.45], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* onda che si allarga */}
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: "0 0 0 2.5px var(--trainer)" }}
            animate={{ opacity: [0.9, 0], scale: [1, 1.9] }}
            transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.6, ease: EASE_OUT }}
          />
        </>
      )}
      <motion.button
        type="button"
        aria-label={count ? `Chiedi a ${COACH_NAME}: ${count} novità` : `Chiedi a ${COACH_NAME}, il tuo assistente`}
        onClick={onOpen}
        whileTap={{ scale: 0.92 }}
        className="relative grid cursor-pointer place-items-center rounded-full bg-[var(--color-card)]"
        // la barra è già di vetro: qui basta un fondo pieno
        style={{
          width: BARRA_LATO.leo,
          height: BARRA_LATO.leo,
          boxShadow: glowing
            ? "0 0 0 2px var(--trainer), 0 10px 24px -6px color-mix(in srgb, var(--trainer) 70%, transparent)"
            : "0 0 0 1.5px color-mix(in srgb, var(--trainer) 45%, transparent), 0 10px 22px -8px color-mix(in srgb, var(--trainer) 55%, transparent)",
        }}
      >
        <motion.span animate={{ y: [0, -1.5, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}>
          <CoachFace size={38} />
        </motion.span>
        {count > 0 && (
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.4, delay: 0.5 }}
            className="absolute -top-[3px] -right-[3px] grid size-[17px] place-items-center rounded-full bg-[#e5484d] text-[9.5px] font-bold text-white ring-2 ring-[var(--color-card)] tabular-nums"
          >
            {count}
          </motion.span>
        )}
      </motion.button>
      <AnimatePresence>
        {(hover || hint) && !hidden && (
          <motion.button
            type="button"
            onClick={onOpen}
            initial={{ opacity: 0, scale: 0.97, x: -4 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="glass absolute top-1/2 left-[54px] origin-left -translate-y-1/2 cursor-pointer rounded-full px-[12px] py-[6px] text-[11.5px] font-semibold whitespace-nowrap text-ink"
          >
            {count ? (
              <>
                {COACH_NAME} ha {count} novità per te <ArrowRight size={11} strokeWidth={2.4} className="ml-[3px] inline" style={{ color: "var(--trainer)" }} />
              </>
            ) : hint && !hover ? (
              "Sono qui se ti serve 👋"
            ) : (
              `Chiedi a ${COACH_NAME}`
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
