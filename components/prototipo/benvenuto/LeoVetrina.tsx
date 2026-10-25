"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CalendarCheck, Mic, Ruler, Send, Wallet, type LucideIcon } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { suonoComparse } from "@/libs/ui/sound";

// Leo nella vetrina, dal passo "Conosci Leo" in poi. Mentre si presenta sta in piedi al centro del pannello e
// saluta (immagine scontornata ad alta risoluzione, con la sua ombra), con attorno le schede in vetro di quello che fa al posto del
// trainer: seduta fissata, vocale, misure, pagamento, messaggio a più clienti. Alla scelta del tono (piccolo) scende in basso a sinistra
// e lascia il posto al telefono; nel finale (festa) resta lì, fermo, e dice "Tutto pronto!".
// Prima c'era il video dei piegamenti sopra il pannello abbassato: tolto il 25/10 (scelta di Marco).

// da IMMAGINI APP/LEO IN PIEDI.jpg (personaggio-trainer.png, 608 × 1100): nitida anche ingrandita
const LEO = "/prototipo/coach/leo-saluta.webp";
// il telefono del passo prima esce in 0,25 s: Leo entra dopo, così non si sovrappongono
const ATTESA = 0.35;

// Le due posizioni, in percentuale della vetrina: al centro, poggiato in basso; piccolo in basso a sinistra.
const GRANDE = { top: "15%", left: "50%", height: "72%", x: "-50%" };
const PICCOLO = { top: "60%", left: "4%", height: "37%", x: "0%" };

const vetro =
  "rounded-[16px] border border-white/90 bg-white/80 shadow-[0_18px_40px_-18px_rgba(40,20,10,0.35),inset_0_1px_0_#fff] dark:border-white/12 dark:bg-[#1d1f23]/85 dark:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.7)]";

export function LeoVetrina({ piccolo, festa = false }: { piccolo: boolean; festa?: boolean }) {
  const reduce = useReducedMotion();
  const presenta = !piccolo;

  // le schede entrano con un pop ciascuna
  useEffect(() => {
    if (presenta && !reduce) suonoComparse(5, ATTESA + 0.55, 0.16);
  }, [presenta, reduce]);

  return (
    <>
      <motion.div
        className="pointer-events-none absolute z-[12] aspect-[608/1100]"
        // arrivando direttamente al finale (?riprendi) Leo nasce già in basso a sinistra
        initial={{ ...(piccolo ? PICCOLO : GRANDE), opacity: 0, y: reduce ? 0 : 24 }}
        animate={{ ...(piccolo ? PICCOLO : GRANDE), opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={reduce ? { duration: 0.3 } : { type: "spring", stiffness: 120, damping: 22, mass: 1, delay: piccolo ? 0 : ATTESA }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LEO} alt="Leo ti saluta" className="absolute inset-0 h-full w-full object-contain" draggable={false} />

        {/* nel finale, sopra la testa di Leo piccolo (a destra c'è il telefono) */}
        <AnimatePresence>
          {festa && (
            <motion.span
              key="pronto"
              className="absolute -top-[13%] left-[34%] whitespace-nowrap rounded-[16px] rounded-bl-[4px] bg-card px-[13px] py-[8px] text-[14px] font-bold text-ink shadow-[0_14px_30px_-14px_rgba(40,20,10,0.45)]"
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
      </motion.div>

      {/* attorno a Leo, quello che fa per il trainer */}
      <AnimatePresence>
        {presenta && (
          <motion.div key="azioni" className="pointer-events-none absolute inset-0 z-[13]" exit={{ opacity: 0, transition: { duration: 0.2 } }}>
            <Azione i={0} className="left-[5%] top-[10%]" Icona={CalendarCheck} titolo="Seduta fissata" sotto="Giulia · giovedì 18:00" />
            <Azione i={1} className="right-[5%] top-[22%]" Icona={Mic} titolo="Il tuo vocale" sotto={<Onda />} />
            <Azione i={2} className="left-[4%] top-[40%]" Icona={Ruler} titolo="Misure aggiornate" sotto="Sara · vita −2 cm" />
            <Azione i={3} className="right-[4%] top-[53%]" Icona={Wallet} titolo="Pagamento segnato" sotto="Luca · € 280" />
            <Azione i={4} className="left-[6%] top-[68%]" Icona={Send} titolo="Messaggio inviato" sotto="a 6 clienti · “Domani si chiude alle 20”" />
            <motion.p
              className="absolute inset-x-0 bottom-[30px] text-center text-[13px] font-semibold text-ink/60"
              initial={{ opacity: 0, y: reduce ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT, delay: ATTESA + 1.3 }}
            >
              Lavora per te, anche quando non ci sei
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Una scheda in vetro: entra con una molla una dopo l'altra, poi ondeggia piano per conto suo.
function Azione({ i, className, Icona, titolo, sotto }: { i: number; className: string; Icona: LucideIcon; titolo: string; sotto: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`absolute ${className}`}
      initial={{ opacity: 0, scale: reduce ? 1 : 0.7, y: reduce ? 0 : 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={reduce ? { duration: 0.3 } : { type: "spring", stiffness: 380, damping: 22, delay: ATTESA + 0.55 + i * 0.16 }}
    >
      <motion.div
        className={`flex items-center gap-[11px] py-[10px] pl-[10px] pr-[16px] ${vetro}`}
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 5.5 + i * 0.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
      >
        <span
          className="grid size-[36px] shrink-0 place-items-center rounded-[10px]"
          style={{ background: "color-mix(in srgb, var(--trainer) 14%, var(--color-card))", color: "var(--trainer)" }}
        >
          <Icona size={17} strokeWidth={2.2} />
        </span>
        <span className="whitespace-nowrap">
          <span className="block text-[13px] font-bold leading-[1.25] text-ink">{titolo}</span>
          <span className="mt-[2px] block text-[11.5px] font-medium leading-[1.3] text-muted">{sotto}</span>
        </span>
      </motion.div>
    </motion.div>
  );
}

// L'onda del vocale, con la durata: le barre si muovono come durante l'ascolto.
function Onda() {
  const reduce = useReducedMotion();
  const barre = [5, 9, 6, 11, 7, 10, 4, 8, 6, 9, 5];
  return (
    <span className="flex h-[13px] items-center gap-[2px]">
      {barre.map((h, i) => (
        <motion.span
          key={i}
          className="w-[2.5px] rounded-full bg-[var(--trainer)]"
          style={{ height: h }}
          animate={reduce ? undefined : { scaleY: [1, 0.45, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut", delay: i * 0.08 }}
        />
      ))}
      <span className="ml-[6px] text-[11px] font-medium text-muted">0:07</span>
    </span>
  );
}
