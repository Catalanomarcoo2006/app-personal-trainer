"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, PartyPopper, UserPlus } from "lucide-react";
import { ACCENTS, useAppearance } from "@/components/ui/appearance";
import { EASE_OUT } from "@/components/ui/motion";
import { segnaIngressoMeteoriti } from "@/libs/prototipo/ingresso";
import { playSound, suonoComparse } from "@/libs/ui/sound";
import {
  aggiornaBenvenuto,
  completaBenvenuto,
  inizialiStudio,
  linkApp,
  useBenvenuto,
  useNomeTrainer,
  type Passo,
  type Tono,
} from "@/libs/prototipo/benvenuto";
import { Coriandoli } from "../Coriandoli";
import { Entra, Tasto, TestaPasso } from "../ui";

// Ultimo passo del benvenuto: "La tua app è pronta!". Coriandoli nel colore del trainer, il riepilogo delle
// scelte in 4 righe (ognuna riporta al suo passo per cambiarla), Leo che saluta nella vetrina (LeoPiegamenti)
// e "Entra nella tua dashboard": il benvenuto risulta fatto, la pagina sfuma e nella dashboard le schede cadono
// una alla volta come meteoriti (trainer/Meteora.tsx).

const DASHBOARD = "/prototipo/trainer";

// Nomi dei colori di ACCENTS (components/ui/appearance.tsx), nello stesso ordine.
const NOMI_COLORI = [
  "Arancione",
  "Rosso",
  "Fucsia",
  "Viola",
  "Blu",
  "Verde acqua",
  "Verde",
  "Ocra",
];

const TONI: Record<Tono, { emoji: string; nome: string }> = {
  amichevole: { emoji: "😊", nome: "Amichevole" },
  professionale: { emoji: "💼", nome: "Professionale" },
  motivante: { emoji: "🔥", nome: "Motivante" },
};

export function Finale() {
  const router = useRouter();
  const b = useBenvenuto();
  const { accent } = useAppearance();
  const nome = useNomeTrainer();
  const studio = b.studio.trim() || nome;
  const colore = NOMI_COLORI[ACCENTS.indexOf(accent)] ?? "Il tuo colore";
  const tono = TONI[b.tono];
  const [entra, setEntra] = useState(false);

  useEffect(() => {
    router.prefetch(DASHBOARD);
    // le spunte del riepilogo, una dopo l'altra (vedi Riga)
    suonoComparse(4, 0.55, 0.12);
  }, [router]);

  const vai = (p: Passo) => {
    playSound("tap");
    aggiornaBenvenuto({ passo: p });
  };

  const entraInDashboard = () => {
    if (entra) return;
    setEntra(true);
    completaBenvenuto();
    playSound("complete");
    segnaIngressoMeteoriti();
    // la pagina sfuma nel fondo della dashboard, poi si cambia pagina
    window.setTimeout(() => router.push(DASHBOARD), 320);
  };

  return (
    <div>
      <Coriandoli />
      {/* nel body: dentro il passo (che si sposta e sfuma) "fixed" non coprirebbe tutta la finestra */}
      {entra &&
        createPortal(
          <motion.div aria-hidden className="fixed inset-0 z-[70] bg-soft" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, ease: EASE_OUT }} />,
          document.body,
        )}
      <TestaPasso
        icona={PartyPopper}
        titolo="La tua app è pronta!"
        sotto={`Ecco cosa riceveranno i clienti di ${studio}. Puoi cambiare tutto quando vuoi da Impostazioni.`}
      />

      <Entra i={3}>
        <div className="mt-[22px] divide-y divide-line overflow-hidden rounded-[18px] border border-line bg-card shadow-[0_14px_30px_-24px_rgba(0,0,0,0.35)]">
          <Riga
            i={0}
            etichetta="Colore"
            valore={colore}
            onModifica={() => vai(1)}
          >
            <span className="size-[20px] rounded-full bg-[var(--trainer)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--trainer)_18%,transparent)]" />
          </Riga>
          <Riga
            i={1}
            etichetta="Studio"
            valore={studio}
            sotto={linkApp(nome)}
            onModifica={() => vai(1)}
          >
            {b.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.logo} alt="" className="size-full object-contain" />
            ) : (
              <span className="grid size-full place-items-center bg-[var(--trainer)] text-[12px] font-bold text-white">
                {inizialiStudio(b.studio, nome)}
              </span>
            )}
          </Riga>
          <Riga
            i={2}
            etichetta="Primo cliente"
            valore={b.primoCliente ? b.primoCliente.nome : "Da aggiungere"}
            spento={!b.primoCliente}
            sotto={
              b.primoCliente
                ? b.primoCliente.esempio
                  ? "Cliente di esempio"
                  : "Invito pronto"
                : "Lo aggiungi dalla dashboard"
            }
            onModifica={() => vai(3)}
          >
            {b.primoCliente ? (
              <span className="grid size-full place-items-center text-[12px] font-bold text-[var(--trainer)]">
                {b.primoCliente.nome
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase())
                  .join("")}
              </span>
            ) : (
              <UserPlus size={16} className="text-muted" />
            )}
          </Riga>
          <Riga
            i={3}
            etichetta="Leo, il tuo assistente"
            valore={`${tono.nome} ${tono.emoji}`}
            onModifica={() => vai(4)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/prototipo/coach/viso.webp"
              alt=""
              className="size-full object-cover"
            />
          </Riga>
        </div>
      </Entra>

      <Entra i={4}>
        <div className="mt-[20px]">
          <Tasto
            onClick={entraInDashboard}
            occupato={entra ? "Preparo la dashboard…" : undefined}
          >
            Entra nella tua dashboard <ArrowRight size={16} />
          </Tasto>
        </div>
      </Entra>
    </div>
  );
}

// Una riga del riepilogo: icona, cosa, valore; a destra la spunta che entra a scatto e, al passaggio, "Modifica".
function Riga({
  i,
  etichetta,
  valore,
  sotto,
  spento,
  onModifica,
  children,
}: {
  i: number;
  etichetta: string;
  valore: string;
  sotto?: string;
  spento?: boolean;
  onModifica: () => void;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <button
      type="button"
      onClick={onModifica}
      className="group flex min-h-[62px] w-full cursor-pointer items-center gap-[12px] px-[14px] py-[10px] text-left transition-colors duration-200 hover:bg-soft/60"
    >
      <span className="grid size-[36px] shrink-0 place-items-center overflow-hidden rounded-[11px] bg-soft">
        {children}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11.5px] font-semibold text-muted">
          {etichetta}
        </span>
        <span
          className={`block truncate text-[14px] font-bold leading-[1.3] ${spento ? "text-muted" : ""}`}
        >
          {valore}
        </span>
        {sotto && (
          <span className="block truncate text-[11.5px] text-muted">
            {sotto}
          </span>
        )}
      </span>
      <span className="relative grid h-[22px] w-[58px] shrink-0 place-items-center">
        <span className="absolute right-0 text-[12px] font-semibold text-muted opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
          Modifica
        </span>
        {/* l'opacità al passaggio sta sul contenitore: quella della spunta la guida motion */}
        <span className="absolute right-0 transition-opacity duration-200 group-hover:opacity-0 group-focus-visible:opacity-0">
          <motion.span
            className="grid size-[22px] place-items-center rounded-full"
            style={{
              background: spento ? "var(--color-line)" : "var(--trainer)",
            }}
            initial={{ scale: reduce ? 1 : 0, opacity: reduce ? 0 : 1 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={
              reduce
                ? { duration: 0.3, delay: 0.5 }
                : {
                    type: "spring",
                    stiffness: 520,
                    damping: 18,
                    delay: 0.55 + i * 0.12,
                  }
            }
          >
            {spento ? (
              <span className="h-[2px] w-[8px] rounded-full bg-white" />
            ) : (
              <Check size={13} strokeWidth={3.5} className="text-white" />
            )}
          </motion.span>
        </span>
      </span>
    </button>
  );
}
