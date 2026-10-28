"use client";

// Foglio che sale dal basso dentro il telefono, come su iOS: velo sfocato dietro, si chiude con il velo, la X o Esc.
// Con "riduci movimento" compare in dissolvenza.

import { ReactNode, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";

export function Foglio({ aperto, onChiudi, titolo, children }: { aperto: boolean; onChiudi: () => void; titolo: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!aperto) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onChiudi();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [aperto, onChiudi]);

  return (
    <AnimatePresence>
      {aperto && (
        <motion.div key="foglio" className="absolute inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <button type="button" aria-label="Chiudi" onClick={onChiudi} className="absolute inset-0 cursor-default bg-black/20 backdrop-blur-[3px]" />
          <motion.section
            role="dialog"
            aria-label={titolo}
            initial={{ y: reduce ? 0 : "100%" }}
            animate={{ y: 0 }}
            exit={{ y: reduce ? 0 : "100%" }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="panel absolute inset-x-0 bottom-0 max-h-[88%] overflow-y-auto rounded-t-[30px] rounded-b-none px-[18px] pt-[10px] pb-[max(18px,env(safe-area-inset-bottom))] [scrollbar-width:none]"
            style={{ background: "var(--color-card)" }}
          >
            <span aria-hidden className="mx-auto block h-[5px] w-[40px] rounded-full bg-ink/15" />
            <div className="mt-[10px] flex items-center justify-between">
              <p className="text-[18px] font-extrabold tracking-[-0.02em]">{titolo}</p>
              <button type="button" aria-label="Chiudi" onClick={onChiudi} className="glass grid size-[34px] cursor-pointer place-items-center rounded-full">
                <X size={15} />
              </button>
            </div>
            {children}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
