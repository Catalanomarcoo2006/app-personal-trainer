"use client";

// Nel profilo del cliente: quello che il cliente ha proposto dalla sua app e aspetta il trainer (decisione di Marco
// del 29/10): le circonferenze scritte da lui e l'obiettivo della registrazione. Accetta → contano nei progressi;
// Rifiuta → spariscono. Il riquadro compare solo quando c'è qualcosa da confermare.

import { AnimatePresence, motion } from "motion/react";
import toast from "react-hot-toast";
import { Check, Clock, X } from "lucide-react";
import { playSound } from "@/libs/ui/sound";
import { useStato } from "@/libs/prototipo/stato";
import { confermaMisura, confermaObiettivo, misureInAttesa, rifiutaMisura, rifiutaObiettivo, type Esito } from "@/libs/dati/sportello";
import { dataBreve } from "@/libs/dati/vista";
import { oggi as giornoDiOggi } from "@/libs/orologio";
import type { Misura } from "@/libs/dati/tipi";

const GIRI: [keyof Misura, string][] = [
  ["waistCm", "Vita"],
  ["hipsCm", "Fianchi"],
  ["chestCm", "Petto"],
  ["armCm", "Braccio"],
  ["thighCm", "Coscia"],
];
const numero = (n: number) => String(n).replace(".", ",");

async function esegui(fai: () => Promise<Esito>, fatto: string) {
  const e = await fai();
  if ("motivo" in e) return toast.error(e.motivo);
  playSound("confirm");
  toast.success(fatto);
}

function Tasti({ onSi, onNo }: { onSi: () => void; onNo: () => void }) {
  return (
    <span className="flex shrink-0 gap-[5px]">
      <button type="button" aria-label="Rifiuta" onClick={onNo} className="grid size-[28px] cursor-pointer place-items-center rounded-full bg-soft text-ink/60 transition-colors hover:bg-line">
        <X size={13} strokeWidth={2.6} />
      </button>
      <button type="button" aria-label="Accetta" onClick={onSi} className="btn-trainer grid size-[28px] cursor-pointer place-items-center rounded-full">
        <Check size={13} strokeWidth={2.8} />
      </button>
    </span>
  );
}

// posto: dove sta il riquadro (sul computer in basso a destra nel profilo; da telefono nella pagina, ProfiloTelefono).
export function DaConfermare({ clientId, nome, posto = "absolute right-[30px] bottom-[22px] z-30 w-[330px]" }: { clientId: string; nome: string; posto?: string }) {
  const d = useStato((s) => s.dati);
  const attesa = misureInAttesa(d, clientId);
  const proposto = d.clienti.find((c) => c.id === clientId)?.obiettivoProposto;
  const quante = attesa.length + (proposto ? 1 : 0);
  const primo = nome.split(" ")[0];

  return (
    <AnimatePresence>
      {quante > 0 && (
        <motion.aside
          key="da-confermare"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.25 }}
          aria-label="Da confermare"
          className={`glass glass-3d rounded-[18px] px-[14px] pt-[12px] pb-[10px] ${posto}`}
        >
          <p className="flex items-center gap-[6px] text-[13px] font-bold">
            <Clock size={14} style={{ color: "var(--trainer)" }} /> Da confermare
            <span className="btn-trainer ml-auto rounded-full px-[7px] py-[1px] text-[10.5px]">{quante}</span>
          </p>
          <p className="mt-[2px] text-[11px] text-muted">Scritte da {primo} nella sua app</p>
          <ul className="mt-[6px] flex flex-col">
            {proposto && (
              <li className="flex items-center gap-[8px] border-t border-line/70 py-[7px] text-[11.5px]">
                <span className="min-w-0 flex-1 leading-snug">
                  <b>Obiettivo</b>: da {numero(proposto.start)} a {numero(proposto.target)} kg
                </span>
                <Tasti onSi={() => void esegui(() => confermaObiettivo(clientId), `Obiettivo di ${primo} confermato`)} onNo={() => void esegui(() => rifiutaObiettivo(clientId), "Obiettivo rifiutato: ne parlate in chat")} />
              </li>
            )}
            {attesa.map((m) => (
              <li key={m.id} className="flex items-center gap-[8px] border-t border-line/70 py-[7px] text-[11.5px]">
                <span className="min-w-0 flex-1 leading-snug">
                  <b>{m.takenOn === giornoDiOggi() ? "Oggi" : dataBreve(m.takenOn)}</b>:{" "}
                  {GIRI.filter(([k]) => m[k] !== undefined)
                    .map(([k, l]) => `${l} ${numero(m[k] as number)}`)
                    .join(" · ")}{" "}
                  cm
                </span>
                <Tasti onSi={() => void esegui(() => confermaMisura(m.id), "Misure accettate")} onNo={() => void esegui(() => rifiutaMisura(m.id), "Misure rifiutate")} />
              </li>
            ))}
          </ul>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
