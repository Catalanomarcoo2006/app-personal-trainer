"use client";

import { ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { aggiornaBenvenuto, completaBenvenuto, passoDiRipartenza, PASSI, useBenvenuto, type Passo } from "@/libs/prototipo/benvenuto";
import { Vetrina } from "./Vetrina";
import { PallinaProvider, SlotPallina, usePallina } from "./Pallina";
import { Barra, Tasto, TestaPasso } from "./ui";

export const BENVENUTO = "/prototipo/benvenuto";

// Regia del benvenuto: quale passo si vede, avanti e indietro, le due metà.
// Il passo resta salvato nel browser: ricaricando si riparte da lì (passoDiRipartenza).

export type PropsPasso = { avanti: () => void; indietro: () => void };

export function Benvenuto() {
  const b = useBenvenuto();
  const [pronto, setPronto] = useState(false);
  useEffect(() => setPronto(true), []);
  const passo = passoDiRipartenza(b);

  const vai = (p: Passo) => aggiornaBenvenuto({ passo: p });
  const avanti = () => vai(Math.min(passo + 1, 5) as Passo);
  const indietro = () => vai(Math.max(passo - 1, 0) as Passo);

  // prima del montaggio lo stato salvato non è ancora letto: niente lampo del primo passo
  if (!pronto) return <div className="min-h-dvh bg-soft" />;

  return (
    <PallinaProvider>
      <div className="flex min-h-dvh items-center justify-center bg-soft p-[16px] lg:p-[22px]">
        <div className="grid h-[min(820px,calc(100dvh-44px))] min-h-[640px] w-full max-w-[1280px] grid-cols-1 gap-[14px] rounded-[30px] bg-card p-[14px] shadow-[0_30px_70px_-40px_rgba(0,0,0,0.35)] lg:grid-cols-[46fr_54fr]">
          <div className="hidden lg:block">
            <Vetrina passo={passo}>
              <SlotPallina dove="vetrina" size={72} className="absolute left-[46%] top-[63%]" />
            </Vetrina>
          </div>
          <div className="relative flex min-h-0 flex-col">
            <div className="flex h-[44px] items-center justify-between px-[10px]">
              {passo > 0 && passo < 5 ? (
                <button
                  type="button"
                  onClick={indietro}
                  className="flex min-h-[44px] cursor-pointer items-center gap-[6px] text-[13px] font-semibold text-muted transition-colors hover:text-ink"
                >
                  <ArrowLeft size={15} /> Indietro
                </button>
              ) : (
                <span />
              )}
              {passo < 5 && <Barra passo={passo} />}
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-[20px] pb-[44px]">
              <div className="relative w-full max-w-[392px]">
                <SlotPallina dove="modulo" size={56} className="absolute -top-[92px] left-1/2 -translate-x-1/2" />
                <CambioPasso chiave={passo}>
                  <SchermataPasso passo={passo} avanti={avanti} indietro={indietro} />
                </CambioPasso>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PallinaProvider>
  );
}

// Il passo vecchio sparisce sfumando e sfocandosi, il nuovo entra (i suoi elementi uno dopo l'altro, vedi Entra).
function CambioPasso({ chiave, children }: { chiave: number; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={chiave}
        className="w-full max-w-[392px]"
        exit={{
          opacity: 0,
          filter: reduce ? "none" : "blur(4px)",
          y: reduce ? 0 : -6,
        }}
        transition={{ duration: 0.18, ease: EASE_OUT }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function SchermataPasso({ passo, avanti }: { passo: Passo } & PropsPasso) {
  // passi provvisori: ognuno viene sostituito dal suo file in passi/
  const pallina = usePallina();
  return (
    <div>
      <TestaPasso titolo={`Passo: ${PASSI[passo]}`} sotto="In costruzione." />
      <div className="mt-[28px]">
        <Tasto
          onClick={() => {
            if (passo === 0) aggiornaBenvenuto({ verificato: true });
            pallina.mostra({
              dove: passo % 2 === 0 ? "modulo" : "vetrina",
              scritta: passo % 2 === 0 ? "Inserisci il codice" : undefined,
              umore: "contento",
            });
            if (passo === 2)
              aggiornaBenvenuto({
                accordi: { quando: new Date().toISOString() },
              });
            if (passo === 5) completaBenvenuto();
            avanti();
          }}
        >
          Avanti
        </Tasto>
      </div>
    </div>
  );
}
