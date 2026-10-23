"use client";

import { ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { trainer } from "@/libs/prototipo/dati-finti";

// La prima volta che il trainer apre la chat, Leo si presenta in tre battute: si leggono con "Avanti"
// o si saltano, poi si parla liberamente. Il ricordo resta in questo browser.

const KEY_INTRO = "leo-presentazione";
const KEY_INFO = "leo-identikit";

function readFlag(key: string) {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}
function writeFlag(key: string, value: boolean) {
  try {
    if (value) window.localStorage.setItem(key, "1");
    else window.localStorage.removeItem(key);
  } catch {
    // storage non disponibile (navigazione privata): vale per questa pagina
  }
}

// Valori in memoria: lo storage si legge una volta, poi si aggiorna insieme.
const flags: { intro?: boolean; info?: boolean } = {};

export const introSeen = () => (flags.intro ??= readFlag(KEY_INTRO));
export function setIntroSeen(seen: boolean) {
  flags.intro = seen;
  writeFlag(KEY_INTRO, seen);
}
export const infoSeen = () => (flags.info ??= readFlag(KEY_INFO));
export function setInfoSeen() {
  flags.info = true;
  writeFlag(KEY_INFO, true);
}

const firstName = trainer.name.split(" ")[0];

const lines = [
  { emoji: "👋", text: `Ciao ${firstName}, sono Leo! Sono il tuo assistente: vivo qui nell’app e conosco i tuoi clienti, l’agenda e gli incassi.` },
  { emoji: "💬", text: "Chiedimi quello che vuoi, a parole tue: “chi deve ancora pagare?”, “chi non si allena da una settimana?”. Rispondo in un attimo e ti porto nella sezione giusta." },
  { emoji: "✨", text: "I nomi dei tuoi clienti non escono mai dall’app: all’AI arrivano solo codici. Vuoi sapere tutto di me? Tocca la i luccicante qui sopra." },
];

export const INTRO_LAST = lines.length - 1;

export function LeoPresentazione({ face, onStep, onDone }: { face: ReactNode; onStep: (step: number) => void; onDone: () => void }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const last = step === INTRO_LAST;
  const words = lines[step].text.split(" ");

  useEffect(() => onStep(step), [step, onStep]);

  const next = () => {
    if (last) {
      playSound("confirm");
      onDone();
      return;
    }
    playSound("tap");
    setStep((s) => s + 1);
  };
  const skip = () => {
    playSound("tap");
    onDone();
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between">
        {/* a che punto sei: tre trattini, quello attuale si allunga */}
        <div className="flex gap-[5px]" aria-label={`Presentazione, ${step + 1} di ${lines.length}`}>
          {lines.map((_, i) => (
            <motion.span
              key={i}
              className="h-[5px] rounded-full"
              animate={{ width: i === step ? 22 : 7 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
              style={{ background: i <= step ? "var(--trainer)" : "color-mix(in srgb, var(--color-ink) 16%, transparent)" }}
            />
          ))}
        </div>
        {/* sull'ultima battuta resta il posto: la riga non salta */}
        <button
          type="button"
          onClick={skip}
          tabIndex={last ? -1 : 0}
          aria-hidden={last}
          className={`cursor-pointer rounded-full px-[8px] py-[3px] text-[11.5px] font-semibold text-muted transition-colors hover:bg-soft hover:text-ink ${last ? "invisible" : ""}`}
        >
          Salta
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-center pb-[24px]">
        {/* il viso di Leo, con l'emoji della battuta che spunta di lato */}
        <div className="relative self-start">
          {face}
          <AnimatePresence mode="popLayout">
            <motion.span
              key={step}
              className="absolute -right-[10px] -bottom-[2px] text-[24px] leading-none"
              initial={{ scale: reduce ? 1 : 0.3, rotate: reduce ? 0 : -25, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0, transition: { duration: 0.12 } }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.5, delay: 0.1 }}
            >
              {lines[step].emoji}
            </motion.span>
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: reduce ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -6, transition: { duration: 0.14 } }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="mt-[16px] min-h-[88px] text-[15.5px] leading-[1.45] font-semibold text-ink"
          >
            {/* le parole arrivano una alla volta, come se Leo stesse parlando */}
            {words.map((w, i) => (
              <motion.span key={i} initial={{ opacity: reduce ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 + i * 0.03, duration: 0.2 }}>
                {w}{" "}
              </motion.span>
            ))}
          </motion.p>
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={next}
          whileTap={{ scale: 0.96 }}
          className="btn-trainer mt-[16px] flex cursor-pointer items-center gap-[6px] self-start rounded-full px-[16px] py-[8px] text-[12.5px] font-semibold"
        >
          {last ? "Iniziamo" : "Avanti"} <ArrowRight size={13} strokeWidth={2.4} />
        </motion.button>
      </div>
    </div>
  );
}
