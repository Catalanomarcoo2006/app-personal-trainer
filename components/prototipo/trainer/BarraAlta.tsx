"use client";

import { inDemo } from "@/libs/orologio";
import { apriModulo } from "@/components/vera/Moduli";
import { ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarPlus, MessageSquare, UserPlus, Volume2, VolumeX, Wallet, type LucideIcon } from "lucide-react";
import { isSoundEnabled, onSoundChange, playSound, setSoundEnabled } from "@/libs/ui/sound";
import { navigate, ROUTES } from "./nav";
import { apriLeo, chiediNuovaSeduta } from "./richieste";

// Barre di vetro in alto: le voci una accanto all'altra, al passaggio del mouse cambia solo il colore del testo.
// (L'effetto del video NAV BAR ANIMAZIONI, con lineetta ed elastico, è stato provato e tolto il 26/10: non era
// coerente con il resto dell'app.)

export type Voce = { chiave: string; nodo: ReactNode };

export function BarraVetro({ voci, className = "" }: { voci: Voce[]; className?: string }) {
  return (
    <div className={`glass glass-3d relative flex h-[35px] items-center rounded-full ${className}`}>
      {voci.map(({ chiave, nodo }) => (
        <div key={chiave} className="relative flex h-full items-center">
          {nodo}
        </div>
      ))}
    </div>
  );
}

// ——— Azioni rapide: le cose che un trainer fa più volte al giorno, da ogni pagina ———
// Pagamento e nuovo cliente non hanno ancora un modulo: li prepara Leo, con la frase già scritta nella chat.

type Azione = { label: string; icon: LucideIcon; fai: () => void };

const azioni: Azione[] = [
  {
    label: "Nuova seduta",
    icon: CalendarPlus,
    fai: () => {
      chiediNuovaSeduta();
      navigate(ROUTES.calendario);
    },
  },
  { label: "Scrivi", icon: MessageSquare, fai: () => navigate(ROUTES.messaggi) },
  // nella demo li fa Leo; nella versione vera (Leo senza AI finché non c'è il fornitore in Europa) le finestre
  { label: "Pagamento", icon: Wallet, fai: () => (inDemo() ? apriLeo("Registra un pagamento di ") : apriModulo({ tipo: "pagamento" })) },
  { label: "Nuovo cliente", icon: UserPlus, fai: () => (inDemo() ? apriLeo("Nuovo cliente: ") : apriModulo({ tipo: "cliente" })) },
];

export function AzioniRapide() {
  return (
    <BarraVetro
      className="px-[4px]"
      voci={azioni.map(({ label, icon: Icon, fai }) => ({
        chiave: label,
        nodo: (
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              playSound("tap");
              fai();
            }}
            className="flex h-[27px] cursor-pointer items-center gap-[6px] rounded-full px-[13px] text-[12.5px] font-medium text-ink/70 transition-colors duration-200 [@media(hover:hover)]:hover:text-ink"
          >
            <Icon size={14} strokeWidth={1.9} />
            {label}
          </motion.button>
        ),
      }))}
    />
  );
}

// ——— Suoni al clic: lo stesso interruttore delle Impostazioni ———

export function SuoniButton({ size = 15 }: { size?: number }) {
  const [acceso, setAcceso] = useState(true);
  useEffect(() => {
    setAcceso(isSoundEnabled());
    return onSoundChange(setAcceso);
  }, []);
  const Icona = acceso ? Volume2 : VolumeX;
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      aria-label={acceso ? "Spegni i suoni" : "Accendi i suoni"}
      aria-pressed={acceso}
      title={acceso ? "Suoni accesi" : "Suoni spenti"}
      onClick={() => {
        setSoundEnabled(!acceso);
        if (!acceso) playSound("tap");
      }}
      className="relative grid size-[22px] cursor-pointer place-items-center"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={String(acceso)} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.18 }} className="grid">
          <Icona size={size} strokeWidth={1.9} className={acceso ? "" : "text-muted"} />
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
