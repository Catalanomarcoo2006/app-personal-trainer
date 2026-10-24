"use client";

import { AnimatePresence, motion } from "motion/react";
import { Mail } from "lucide-react";
import { useNomeTrainer } from "@/libs/prototipo/benvenuto";

// Nel prototipo nessuna email parte davvero: il codice "arriva" come notifica che scivola nella vetrina.
export function EmailFinta({ codice }: { codice: string | null }) {
  const nome = useNomeTrainer().split(" ")[0];
  return (
    <AnimatePresence>
      {codice && (
        <motion.div
          key={codice}
          initial={{ opacity: 0, y: -60, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="absolute left-1/2 top-[64px] z-30 w-[78%] max-w-[380px] -translate-x-1/2"
        >
          <div className="flex items-start gap-[12px] rounded-[18px] border border-white/90 bg-white/88 px-[14px] py-[12px] shadow-[0_24px_50px_-20px_rgba(40,20,10,0.45),inset_0_1px_0_#fff] backdrop-blur-md dark:border-white/12 dark:bg-[#1d1f23]/90">
            <span className="grid size-[36px] shrink-0 place-items-center rounded-[11px] bg-[var(--trainer)] text-white">
              <Mail size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between text-[11px] text-muted">
                <span className="font-semibold text-ink/80">Nuova email</span>
                <span>adesso</span>
              </span>
              <span className="mt-[2px] block text-[12.5px] font-semibold">Il tuo codice per entrare</span>
              <span className="mt-[1px] block text-[12px] text-muted">
                Ciao {nome}, il tuo codice è{" "}
                {/* le 4 cifre alla stessa distanza l'una dall'altra (non due coppie) */}
                <b className="inline-flex gap-[0.32em] font-mono text-[13.5px] text-ink">
                  {codice.split("").map((c, i) => (
                    <span key={i}>{c}</span>
                  ))}
                </b>
              </span>
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
