"use client";

// La pesata del cliente: ogni quanto (scelto alla registrazione), quando è stata l'ultima, quando tocca la prossima.
// In Home, quando tocca, compare il promemoria con il campo per scrivere il peso: entra subito, senza conferma.

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import toast from "react-hot-toast";
import { playSound } from "@/libs/ui/sound";
import { useStato } from "@/libs/prototipo/stato";
import { misureDalCliente } from "@/libs/dati/sportello";
import { OGGI } from "@/libs/dati/iniziali";
import { dataBreve } from "@/libs/dati/vista";
import { FREQUENZE, pesataDovuta, prossimaPesata, type Frequenza } from "@/libs/domain/pesate";
import { CLIENTE_DEMO, giornoDetto } from "./scheda";

const PESATA_DETTA: Record<Frequenza, string> = { giorno: "La pesata di oggi", settimana: "La pesata della settimana", mese: "La pesata del mese" };
const numero = (n: number) => n.toLocaleString("it-IT", { maximumFractionDigits: 1 });

export function usePesata() {
  const d = useStato((s) => s.dati);
  return useMemo(() => {
    const frequenza: Frequenza = d.clienti.find((c) => c.id === CLIENTE_DEMO)?.pesata ?? "settimana";
    const pesi = d.misure.filter((m) => m.clientId === CLIENTE_DEMO && m.weightKg !== undefined && !m.daConfermare).sort((a, b) => a.takenOn.localeCompare(b.takenOn));
    const ultima = pesi[pesi.length - 1];
    const prossima = ultima ? prossimaPesata(ultima.takenOn, frequenza) : OGGI;
    return { frequenza, ultima, prossima, dovuta: pesataDovuta(ultima?.takenOn, OGGI, frequenza), detta: FREQUENZE.find((x) => x.f === frequenza)!.label.toLowerCase() };
  }, [d]);
}

// "Prossima pesata: mercoledì 28" / "oggi"
export const quandoPesata = (iso: string) => (iso <= OGGI ? "oggi" : giornoDetto(iso).toLowerCase());

export function PromemoriaPesata() {
  const { dovuta, ultima, frequenza } = usePesata();
  const [peso, setPeso] = useState("");
  const [errore, setErrore] = useState<string | null>(null);

  const salva = async () => {
    const n = Number(peso.trim().replace(",", "."));
    if (!peso.trim() || Number.isNaN(n)) return setErrore("Scrivi il peso, per esempio 68,5");
    const esito = await misureDalCliente({ clientId: CLIENTE_DEMO, takenOn: OGGI, weightKg: n });
    if ("motivo" in esito) return setErrore(esito.motivo);
    playSound("complete");
    const diff = ultima?.weightKg !== undefined ? n - ultima.weightKg : 0;
    toast.success(diff ? `Pesata salvata: ${diff < 0 ? "−" : "+"}${numero(Math.abs(diff))} kg dall'ultima${diff < 0 ? " 💪" : ""}` : "Pesata salvata");
    setPeso("");
  };

  return (
    <AnimatePresence initial={false}>
      {dovuta && (
        <motion.section key="pesata" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0, marginTop: 0 }} transition={{ duration: 0.35 }} className="mt-[12px] overflow-hidden">
          <div className="glass-row rounded-[22px] px-[14px] pt-[12px] pb-[14px]">
            <div className="flex items-center gap-[10px]">
              <span className="sel-trainer grid size-[38px] shrink-0 place-items-center rounded-[12px] text-[19px]">⚖️</span>
              <div className="min-w-0 leading-tight">
                <p className="text-[15px] font-bold">È ora di pesarti</p>
                <p className="text-[12px] text-muted">
                  {PESATA_DETTA[frequenza]}
                  {ultima ? ` · l'ultima il ${dataBreve(ultima.takenOn)}: ${numero(ultima.weightKg!)} kg` : ""}
                </p>
              </div>
            </div>
            <div className="mt-[10px] flex items-center gap-[8px]">
              <span className="flex h-[46px] min-w-0 flex-1 items-center rounded-full border border-line bg-card px-[16px] focus-within:border-[var(--trainer)]">
                <input
                  inputMode="decimal"
                  value={peso}
                  aria-label="Il peso di oggi"
                  onChange={(e) => (setErrore(null), setPeso(e.target.value))}
                  onKeyDown={(e) => e.key === "Enter" && void salva()}
                  placeholder="Il peso di oggi"
                  className="min-w-0 flex-1 bg-transparent text-[16px] font-bold tabular-nums outline-none placeholder:font-normal placeholder:text-muted"
                />
                <span className="text-[13px] text-muted">kg</span>
              </span>
              <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => void salva()} disabled={!peso.trim()} className="btn-trainer h-[46px] shrink-0 cursor-pointer rounded-full px-[18px] text-[14px] font-bold disabled:cursor-default disabled:opacity-40">
                Salva
              </motion.button>
            </div>
            {errore && <p className="mt-[8px] text-[12.5px] font-semibold text-[#e5484d]">{errore}</p>}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
