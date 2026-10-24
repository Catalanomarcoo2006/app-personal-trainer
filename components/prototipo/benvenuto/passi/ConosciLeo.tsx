"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, MessageCircleHeart } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { aggiornaBenvenuto, TONI, useBenvenuto, useNomeTrainer, type Tono } from "@/libs/prototipo/benvenuto";
import type { PropsPasso } from "../Benvenuto";
import { useScena } from "../scena";
import { Entra, Tasto, TastoTesto, TestaPasso } from "../ui";

// Passo 5 del benvenuto: conosci Leo (si può saltare). Leo, che nella vetrina fa i piegamenti e poi saluta, si
// presenta in tre battute (adattate da LeoPresentazione.tsx); poi il trainer sceglie il tono con cui Leo parlerà
// ai suoi clienti. Arrivati alla scelta, nella vetrina entra il telefono con la chat (useScena().sceltaTono).

const DESCRIZIONI: Record<Tono, { emoji: string; titolo: string; testo: string }> = {
  amichevole: { emoji: "😊", titolo: "Amichevole", testo: "Caldo e alla mano, dà del tu" },
  professionale: { emoji: "💼", titolo: "Professionale", testo: "Chiaro e preciso, senza fronzoli" },
  motivante: { emoji: "🔥", titolo: "Motivante", testo: "Carica a ogni allenamento" },
};

export function ConosciLeo({ avanti }: PropsPasso) {
  const reduce = useReducedMotion();
  const b = useBenvenuto();
  const { sceltaTono, setSceltaTono } = useScena();
  const nome = useNomeTrainer().split(/\s+/)[0];
  const [battuta, setBattuta] = useState(0);

  const battute = [
    { emoji: "👋", testo: `Ciao ${nome}, sono Leo! Da oggi lavoro con te: conosco i tuoi clienti, l'agenda e gli incassi.` },
    { emoji: "💬", testo: "Chiedimi quello che vuoi, a parole tue: “chi deve ancora pagare?”, “chi non si allena da una settimana?”. Rispondo in un attimo." },
    { emoji: "✨", testo: "Ai tuoi clienti rispondo su schede e abitudini, anche di notte. Email e numeri di telefono dei clienti non arrivano mai all'AI." },
  ];
  const ultima = battuta === battute.length - 1;

  // tornando su questo passo (dal finale) si riparte dalle battute; uscendo, il telefono torna quello di prima
  useEffect(() => {
    setSceltaTono(false);
    return () => setSceltaTono(false);
  }, [setSceltaTono]);

  const prossima = () => {
    if (ultima) {
      playSound("confirm");
      setSceltaTono(true);
      return;
    }
    playSound("tap");
    setBattuta((n) => n + 1);
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
        sotto={sceltaTono ? "Scegli il suo tono: lo cambi quando vuoi da Impostazioni." : "Vive nella tua app e in quella dei tuoi clienti."}
      />

      <AnimatePresence mode="wait" initial={false}>
        {!sceltaTono ? (
          <motion.div key="battute" exit={{ opacity: 0, y: reduce ? 0 : -6 }} transition={{ duration: 0.18, ease: EASE_OUT }}>
            <Entra i={3}>
              {/* la nuvoletta di Leo: la punta guarda verso la vetrina, dove Leo si allena */}
              <div className="relative mt-[22px] rounded-[18px] border border-line bg-card px-[18px] pb-[16px] pt-[14px] shadow-[0_14px_30px_-22px_rgba(0,0,0,0.35)]">
                <span aria-hidden className="absolute -left-[7px] top-[26px] hidden size-[13px] rotate-45 border-b border-l border-line bg-card lg:block" />
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-[8px]">
                    {/* senza vetrina (schermi stretti) Leo si vede qui */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/prototipo/coach/viso.webp" alt="" className="size-[30px] rounded-full bg-soft object-cover lg:hidden" />
                    <span className="text-[12.5px] font-bold">Leo</span>
                  </span>
                  <span className="flex gap-[5px]" aria-label={`Battuta ${battuta + 1} di ${battute.length}`}>
                    {battute.map((_, i) => (
                      <motion.span
                        key={i}
                        className="h-[5px] rounded-full"
                        animate={{ width: i === battuta ? 20 : 7 }}
                        transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                        style={{ background: i <= battuta ? "var(--trainer)" : "var(--color-line)" }}
                      />
                    ))}
                  </span>
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={battuta}
                    className="mt-[8px] min-h-[92px] text-[15px] font-semibold leading-[1.48]"
                    initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reduce ? 0 : -5, transition: { duration: 0.13 } }}
                    transition={{ duration: 0.28, ease: EASE_OUT }}
                  >
                    <span className="mr-[6px]">{battute[battuta].emoji}</span>
                    {/* le parole arrivano una alla volta, come se Leo stesse parlando */}
                    {battute[battuta].testo.split(" ").map((p, i) => (
                      <motion.span key={i} initial={{ opacity: reduce ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.03, duration: 0.2 }}>
                        {p}{" "}
                      </motion.span>
                    ))}
                  </motion.p>
                </AnimatePresence>
              </div>
            </Entra>
            <Entra i={4}>
              <div className="mt-[18px] flex flex-col items-center gap-[4px]">
                <Tasto onClick={prossima}>{ultima ? "Scegli il suo tono" : "Avanti"}</Tasto>
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
                    setBattuta(0);
                    setSceltaTono(false);
                  }}
                >
                  Riascolta Leo
                </TastoTesto>
              </div>
            </Entra>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
