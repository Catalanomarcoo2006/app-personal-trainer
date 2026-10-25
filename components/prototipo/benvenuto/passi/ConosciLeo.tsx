"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CalendarCheck, Check, Mic, MessageCircleHeart, UserRound, Wallet } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { aggiornaBenvenuto, TONI, useBenvenuto, type Tono } from "@/libs/prototipo/benvenuto";
import type { PropsPasso } from "../Benvenuto";
import { useScena } from "../scena";
import { Entra, Tasto, TastoTesto, TestaPasso } from "../ui";

// Passo 5 del benvenuto: conosci Leo (si può saltare). Nella vetrina Leo saluta con attorno le schede di quello
// che fa (LeoVetrina); qui a destra le sue capacità, una riga per area, come le schede della privacy. Poi il
// trainer sceglie il tono con cui Leo parlerà ai suoi clienti: nella vetrina entra il telefono con la chat
// (useScena().sceltaTono). Il testo descrive Leo completo ("Leo fa tutto" e i vocali, in DA-CAMBIARE).

const CAPACITA = [
  { Icona: CalendarCheck, titolo: "Agenda", testo: "Fissa, sposta e cancella le sedute, e controlla che l'orario sia libero." },
  { Icona: UserRound, titolo: "Clienti", testo: "Aggiorna peso, misure, note e obiettivi; aggiunge un cliente nuovo in un attimo." },
  { Icona: Wallet, titolo: "Incassi", testo: "Segna i pagamenti, rinnova i pacchetti e manda i solleciti al posto tuo." },
  { Icona: Mic, titolo: "Messaggi e vocali", testo: "Scrive ai clienti, anche a tanti insieme. Tocca il microfono e parla: Leo prepara le azioni." },
];

const DESCRIZIONI: Record<Tono, { emoji: string; titolo: string; testo: string }> = {
  amichevole: { emoji: "😊", titolo: "Amichevole", testo: "Caldo e alla mano, dà del tu" },
  professionale: { emoji: "💼", titolo: "Professionale", testo: "Chiaro e preciso, senza fronzoli" },
  motivante: { emoji: "🔥", titolo: "Motivante", testo: "Carica a ogni allenamento" },
};

export function ConosciLeo({ avanti }: PropsPasso) {
  const reduce = useReducedMotion();
  const b = useBenvenuto();
  const { sceltaTono, setSceltaTono } = useScena();
  // tornando su questo passo (dal finale) si riparte dalle capacità; uscendo, il telefono torna quello di prima
  useEffect(() => {
    setSceltaTono(false);
    return () => setSceltaTono(false);
  }, [setSceltaTono]);

  const prossima = () => {
    playSound("confirm");
    setSceltaTono(true);
  };

  const scegli = (t: Tono) => {
    if (t === b.tono) return;
    playSound("tap");
    aggiornaBenvenuto({ tono: t });
  };

  return (
    <div>
      <TestaPasso
        icona={MessageCircleHeart}
        titolo={sceltaTono ? "Come parla ai tuoi clienti?" : "Ecco Leo, il tuo assistente"}
        sotto={sceltaTono ? "Scegli il suo tono: lo cambi quando vuoi da Impostazioni." : "Gli chiedi le cose a parole tue, anche a voce: lui le fa."}
      />

      <AnimatePresence mode="wait" initial={false}>
        {!sceltaTono ? (
          <motion.div key="battute" exit={{ opacity: 0, y: reduce ? 0 : -6 }} transition={{ duration: 0.18, ease: EASE_OUT }}>
            <div className="mt-[22px] space-y-[9px]">
              {CAPACITA.map(({ Icona, titolo, testo }, i) => (
                <Entra key={titolo} i={3 + i}>
                  <div className="flex items-start gap-[12px] rounded-[16px] border border-line bg-card px-[14px] py-[12px]">
                    <span
                      className="grid size-[38px] shrink-0 place-items-center rounded-[12px]"
                      style={{ background: "color-mix(in srgb, var(--trainer) 13%, var(--color-card))", color: "var(--trainer)" }}
                    >
                      <Icona size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-bold leading-[1.3]">{titolo}</span>
                      <span className="mt-[2px] block text-[12.5px] leading-[1.45] text-muted">{testo}</span>
                    </span>
                  </div>
                </Entra>
              ))}
            </div>
            <Entra i={7}>
              <p className="mt-[12px] text-center text-[12px] text-muted">Email e telefoni dei tuoi clienti non arrivano mai all&apos;AI.</p>
            </Entra>
            <Entra i={8}>
              <div className="mt-[16px] flex flex-col items-center gap-[4px]">
                <Tasto onClick={prossima}>Scegli il suo tono</Tasto>
                <TastoTesto onClick={avanti}>Salta, lo scopro dopo</TastoTesto>
              </div>
            </Entra>
          </motion.div>
        ) : (
          <motion.div key="tono">
            <div className="mt-[22px] space-y-[9px]" role="radiogroup" aria-label="Tono di Leo">
              {TONI.map((t, i) => {
                const d = DESCRIZIONI[t];
                const scelto = b.tono === t;
                return (
                  <Entra key={t} i={i}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={scelto}
                      onClick={() => scegli(t)}
                      className={`flex min-h-[60px] w-full cursor-pointer items-center gap-[12px] rounded-[16px] border px-[14px] py-[11px] text-left transition-[border-color,background-color,box-shadow] duration-200 ${
                        scelto ? "sel-trainer border-transparent" : "border-line bg-card hover:border-[color-mix(in_srgb,var(--trainer)_40%,var(--color-line))]"
                      }`}
                    >
                      <motion.span
                        className="grid size-[38px] shrink-0 place-items-center rounded-[12px] bg-soft text-[19px]"
                        animate={scelto && !reduce ? { rotate: [0, -12, 10, 0], scale: [1, 1.12, 1] } : { rotate: 0, scale: 1 }}
                        transition={{ duration: 0.45, ease: EASE_OUT }}
                      >
                        {d.emoji}
                      </motion.span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-bold leading-[1.3]">{d.titolo}</span>
                        <span className="mt-[1px] block text-[12.5px] text-muted">{d.testo}</span>
                      </span>
                      <span
                        className="grid size-[20px] shrink-0 place-items-center rounded-full border-[1.5px] transition-colors duration-200"
                        style={{ borderColor: scelto ? "var(--trainer)" : "var(--color-line)", background: scelto ? "var(--trainer)" : "transparent" }}
                      >
                        {scelto && (
                          <motion.span initial={{ scale: reduce ? 1 : 0.3 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 24 }}>
                            <Check size={12} strokeWidth={3.5} className="text-white" />
                          </motion.span>
                        )}
                      </span>
                    </button>
                  </Entra>
                );
              })}
            </div>
            <Entra i={3}>
              <div className="mt-[18px] flex flex-col items-center gap-[4px]">
                <Tasto
                  onClick={() => {
                    playSound("confirm");
                    avanti();
                  }}
                >
                  Avanti
                </Tasto>
                <TastoTesto
                  onClick={() => {
                    playSound("tap");
                    setSceltaTono(false);
                  }}
                >
                  Rivedi cosa fa Leo
                </TastoTesto>
              </div>
            </Entra>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
