"use client";

// Le schede delle azioni di Leo nella chat: una per azione, sotto la sua frase.
// Fissare e spostare partono da sole (con "Annulla"); cancellare e scrivere al cliente aspettano "Conferma".

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CalendarClock, CalendarPlus, CalendarX, Check, Loader2, Send, Undo2, type LucideIcon } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import type { AzioneLeo, StatoScheda } from "@/libs/prototipo/leo-azioni";

export type SchedaAzione = {
  key: string;
  azione: AzioneLeo; // in chiaro (id dei clienti, nomi veri)
  titolo: string; // riassunto calcolato quando è arrivata (prima dell'esecuzione)
  stato: StatoScheda;
  motivo?: string;
  annulla?: () => { ok: boolean; motivo?: string };
  fattaAlle?: number;
};

const ANNULLA_IN_EVIDENZA = 8000;

const icone: Record<AzioneLeo["nome"], LucideIcon> = {
  fissa_appuntamento: CalendarPlus,
  sposta_appuntamento: CalendarClock,
  cancella_appuntamento: CalendarX,
  scrivi_messaggio: Send,
};

export function SchedaAzioneView({
  scheda,
  onConferma,
  onRifiuta,
  onAnnulla,
  onTorna,
}: {
  scheda: SchedaAzione;
  onConferma: (testo?: string) => void;
  onRifiuta: () => void;
  onAnnulla: () => void;
  onTorna?: () => void;
}) {
  const reduce = useReducedMotion();
  const { azione, stato } = scheda;
  const Icon = icone[azione.nome];
  const messaggio = azione.nome === "scrivi_messaggio";
  const [testo, setTesto] = useState(messaggio ? azione.dati.testo : "");
  // "Annulla" resta in evidenza per qualche secondo dopo l'esecuzione, poi diventa un link discreto
  const [evidenza, setEvidenza] = useState(() => !!scheda.fattaAlle && Date.now() - scheda.fattaAlle < ANNULLA_IN_EVIDENZA);
  useEffect(() => {
    if (!scheda.fattaAlle) return;
    const resta = ANNULLA_IN_EVIDENZA - (Date.now() - scheda.fattaAlle);
    setEvidenza(resta > 0);
    if (resta <= 0) return;
    const t = window.setTimeout(() => setEvidenza(false), resta);
    return () => window.clearTimeout(t);
  }, [scheda.fattaAlle]);

  const spenta = stato === "annullato" || stato === "rifiutato" || stato === "errore";
  const piccolo = "flex h-[30px] cursor-pointer items-center gap-[5px] rounded-full px-[12px] text-[11.5px] font-semibold transition-colors";

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE_OUT }}
      className={`w-full rounded-[16px] border p-[10px] ${spenta ? "border-line opacity-70" : "border-[color-mix(in_srgb,var(--trainer)_30%,transparent)]"}`}
      style={spenta ? undefined : { background: "color-mix(in srgb, var(--trainer) 5%, var(--color-card))" }}
    >
      <div className="flex items-start gap-[9px]">
        <span className="grid size-[28px] shrink-0 place-items-center rounded-full" style={{ background: "color-mix(in srgb, var(--trainer) 16%, transparent)", color: "var(--trainer)" }}>
          <Icon size={14} />
        </span>
        <div className="min-w-0 flex-1 leading-snug">
          <p className={`text-[12px] font-semibold ${stato === "annullato" ? "line-through" : ""}`}>{scheda.titolo}</p>
          {stato === "in-corso" && (
            <p className="mt-[3px] flex items-center gap-[4px] text-[11px] text-muted">
              <Loader2 size={11} className={reduce ? "" : "animate-spin"} /> In corso…
            </p>
          )}
          {stato === "fatto" && (
            <p className="mt-[3px] flex items-center gap-[4px] text-[11px] font-semibold" style={{ color: "#1f9d55" }}>
              <Check size={11} strokeWidth={3} /> Fatto
            </p>
          )}
          {stato === "fatto" && scheda.motivo && <p className="mt-[3px] text-[11px] text-[#d43b4f]">{scheda.motivo}</p>}
          {stato === "annullato" && <p className="mt-[3px] text-[11px] text-muted">Annullato</p>}
          {(stato === "rifiutato" || stato === "errore") && <p className="mt-[3px] text-[11px] text-[#d43b4f]">{scheda.motivo ?? "Non si può fare"}</p>}
        </div>
      </div>

      {messaggio && stato === "da-confermare" && (
        <textarea
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          rows={4}
          maxLength={1000}
          aria-label="Testo del messaggio"
          className="mt-[8px] w-full resize-none rounded-[12px] border border-line bg-card px-[10px] py-[8px] text-[16px] leading-snug outline-none focus:border-[var(--trainer)] md:text-[12.5px]"
        />
      )}
      {messaggio && stato !== "da-confermare" && <p className="mt-[6px] rounded-[12px] bg-soft px-[10px] py-[7px] text-[12px] leading-snug">{azione.dati.testo}</p>}

      {stato === "da-confermare" && (
        <div className="mt-[8px] flex gap-[6px]">
          <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => onConferma(messaggio ? testo : undefined)} disabled={messaggio && !testo.trim()} className={`btn-trainer ${piccolo} disabled:cursor-not-allowed disabled:opacity-50`}>
            <Check size={12} /> {messaggio ? "Invia" : "Conferma"}
          </motion.button>
          <button type="button" onClick={onRifiuta} className={`${piccolo} bg-soft hover:bg-line`}>
            Annulla
          </button>
        </div>
      )}

      {stato === "fatto" && (scheda.annulla || onTorna) && (
        <div className="mt-[8px] flex items-center gap-[10px]">
          {scheda.annulla &&
            (evidenza ? (
              <button type="button" onClick={onAnnulla} className={`${piccolo} bg-soft hover:bg-line`}>
                <Undo2 size={12} /> Annulla
              </button>
            ) : (
              <button type="button" onClick={onAnnulla} className="cursor-pointer text-[11px] font-semibold text-muted underline underline-offset-2 hover:text-ink">
                Annulla
              </button>
            ))}
          {onTorna && (
            <button type="button" onClick={onTorna} className="cursor-pointer text-[11px] font-semibold text-muted underline underline-offset-2 hover:text-ink">
              Torna dov&apos;eri
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
