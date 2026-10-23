"use client";

import { ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { playSound } from "@/libs/ui/sound";
import { EASE_OUT } from "@/components/ui/motion";
import { aggiornaBenvenuto, azzeraBenvenuto, completaBenvenuto, passoDiRipartenza, PASSI, useBenvenuto, type Passo } from "@/libs/prototipo/benvenuto";
import { Vetrina } from "./Vetrina";
import { ScenaProvider, useScena } from "./scena";
import { EmailFinta } from "./EmailFinta";
import { Accesso } from "./passi/Accesso";
import { Marchio } from "./passi/Marchio";
import { Barra, Tasto, TestaPasso } from "./ui";

export const BENVENUTO = "/prototipo/benvenuto";

// Regia del benvenuto: quale passo si vede, avanti e indietro, le due metà.
// Il passo resta salvato nel browser: ricaricando si riparte da lì (passoDiRipartenza).

export type PropsPasso = { avanti: () => void; indietro: () => void };

export function Benvenuto() {
  const b = useBenvenuto();
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    // ?da-capo: per le demo, ogni volta che si apre o si aggiorna la pagina il percorso riparte dall'inizio
    if (new URLSearchParams(window.location.search).has("da-capo")) azzeraBenvenuto();
    setPronto(true);
  }, []);
  const passo = passoDiRipartenza(b);

  const vai = (p: Passo) => aggiornaBenvenuto({ passo: p });
  const avanti = () => vai(Math.min(passo + 1, 5) as Passo);
  const indietro = () => vai(Math.max(passo - 1, 0) as Passo);

  // prima del montaggio lo stato salvato non è ancora letto: niente lampo del primo passo
  if (!pronto) return <div className="min-h-dvh bg-soft" />;

  return (
    <ScenaProvider>
      <div className="flex min-h-dvh items-center justify-center bg-soft p-[16px] lg:p-[22px]">
        <div className="relative grid h-[min(820px,calc(100dvh-44px))] min-h-[640px] w-full max-w-[1280px] grid-cols-1 gap-[14px] rounded-[30px] bg-card p-[14px] shadow-[0_30px_70px_-40px_rgba(0,0,0,0.35)] lg:grid-cols-[46fr_54fr]">
          <div className="hidden lg:block">
            <Vetrina passo={passo}>
              <ScenaVetrina />
            </Vetrina>
          </div>
          <div className="relative flex min-h-0 flex-col">
            {/* senza vetrina (schermi stretti) l'email finta con il codice compare qui sopra */}
            <div className="relative z-30 lg:hidden">
              <EmailInAlto />
            </div>
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
                <CambioPasso chiave={passo}>
                  <SchermataPasso passo={passo} avanti={avanti} indietro={indietro} />
                </CambioPasso>
              </div>
            </div>
            <Salta />
          </div>
        </div>
      </div>
    </ScenaProvider>
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

// Senza vetrina (schermi stretti) l'email finta compare sopra il modulo.
function EmailInAlto() {
  const { email } = useScena();
  return <EmailFinta codice={email} />;
}

// Quello che i passi mettono in primo piano nella vetrina.
function ScenaVetrina() {
  const { email } = useScena();
  return <EmailFinta codice={email} />;
}

function SchermataPasso({ passo, avanti, indietro }: { passo: Passo } & PropsPasso) {
  if (passo === 0) return <Accesso avanti={avanti} indietro={indietro} />;
  if (passo === 1) return <Marchio avanti={avanti} indietro={indietro} />;
  // passi provvisori: ognuno viene sostituito dal suo file in passi/
  return (
    <div>
      <TestaPasso titolo={`Passo: ${PASSI[passo]}`} sotto="In costruzione." />
      <div className="mt-[28px]">
        <Tasto
          onClick={() => {
            if (passo === 2) aggiornaBenvenuto({ accordi: { quando: new Date().toISOString() } });
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

// Finché i passi sono in costruzione: dal benvenuto si può andare subito alla dashboard. Il benvenuto risulta
// fatto (la dashboard non rimanda più qui); per rivederlo: Impostazioni → "Rivedi il benvenuto", o ?da-capo.
function Salta() {
  return (
    <button
      type="button"
      onClick={() => {
        playSound("nav");
        completaBenvenuto();
        window.location.assign("/prototipo/trainer");
      }}
      className="absolute bottom-[6px] right-[10px] z-20 flex min-h-[40px] cursor-pointer items-center gap-[6px] rounded-full px-[12px] text-[12.5px] font-semibold text-muted transition-colors hover:bg-soft hover:text-ink"
    >
      Salta per ora <ArrowRight size={14} />
    </button>
  );
}
