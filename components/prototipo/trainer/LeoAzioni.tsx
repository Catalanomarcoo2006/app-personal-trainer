"use client";

// Le schede delle azioni di Leo nella chat: una per azione, sotto la sua frase.
// Fissare e spostare partono da sole (con "Annulla"); cancellare e scrivere ai clienti aspettano "Conferma".
// Con più schede da confermare, sopra compare "Conferma tutte (N)".

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { BellRing, CalendarClock, CalendarPlus, CalendarX, Check, CheckCheck, CircleDollarSign, Loader2, NotebookPen, PackagePlus, Scale, Send, Target, Undo2, UserPlus, Users, Wallet, type LucideIcon } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { useTrovaCliente } from "@/libs/dati/selettori";
import { personalizza, type AzioneLeo, type StatoScheda } from "@/libs/prototipo/leo-azioni";

export type SchedaAzione = {
  key: string;
  azione: AzioneLeo; // in chiaro (id dei clienti, nomi veri)
  titolo: string; // riassunto calcolato quando è arrivata (prima dell'esecuzione)
  stato: StatoScheda;
  motivo?: string;
  annulla?: () => Promise<{ ok: boolean; motivo?: string }>;
  primaDopo?: { voce: string; prima?: string; dopo: string }[]; // calcolato quando è arrivata: i valori di allora
  fattaAlle?: number;
};

const ANNULLA_IN_EVIDENZA = 8000;

const icone: Record<AzioneLeo["nome"], LucideIcon> = {
  fissa_appuntamento: CalendarPlus,
  sposta_appuntamento: CalendarClock,
  cancella_appuntamento: CalendarX,
  scrivi_messaggio: Send,
  scrivi_a_piu: Users,
  segna_pagato: Wallet,
  registra_pagamento: CircleDollarSign,
  rinnova_pacchetto: PackagePlus,
  sollecita: BellRing,
  aggiorna_misure: Scale,
  aggiorna_obiettivo: Target,
  aggiungi_nota: NotebookPen,
  nuovo_cliente: UserPlus,
};

// Cosa il trainer può cambiare in una scheda prima di confermarla.
export type Modifica = { testo?: string; clienti?: string[]; nome?: string; obiettivo?: string; email?: string };

export function ConfermaTutte({ n, onConferma }: { n: number; onConferma: () => void }) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.97 }}
      onClick={onConferma}
      className="btn-trainer flex h-[34px] w-full cursor-pointer items-center justify-center gap-[6px] rounded-full text-[12px] font-semibold"
    >
      <CheckCheck size={14} /> Conferma tutte ({n})
    </motion.button>
  );
}

export function SchedaAzioneView({
  scheda,
  onConferma,
  onRifiuta,
  onAnnulla,
  onTorna,
}: {
  scheda: SchedaAzione;
  onConferma: (modifica?: Modifica) => void;
  onRifiuta: () => void;
  onAnnulla: () => void;
  onTorna?: () => void;
}) {
  const reduce = useReducedMotion();
  const { azione, stato } = scheda;
  const Icon = icone[azione.nome];
  const multiplo = azione.nome === "scrivi_a_piu";
  const messaggio = azione.nome === "scrivi_messaggio" || azione.nome === "sollecita" || multiplo;
  const [testo, setTesto] = useState(messaggio ? (azione.dati.testo ?? "") : "");
  const [scelti, setScelti] = useState<string[]>(multiplo ? azione.dati.clienti : []);
  const trova = useTrovaCliente();
  const nuovo = azione.nome === "nuovo_cliente";
  const [nome, setNome] = useState(nuovo ? azione.dati.nome : "");
  const [obiettivo, setObiettivo] = useState(nuovo ? (azione.dati.obiettivo ?? "") : "");
  const [email, setEmail] = useState("");
  const emailValida = !email.trim() || /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.trim());
  const pronto = nuovo ? !!nome.trim() && emailValida : !!testo.trim() && (!multiplo || scelti.length > 0);
  const campo = "w-full rounded-[10px] border border-line bg-card px-[9px] py-[6px] text-[16px] outline-none focus:border-[var(--trainer)] md:text-[12px]";
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

      {!!scheda.primaDopo?.length && (
        <div className="mt-[8px] flex flex-col gap-[3px] rounded-[12px] bg-soft px-[10px] py-[7px]">
          {scheda.primaDopo.map((r) => (
            <p key={r.voce} className="flex items-baseline justify-between gap-[8px] text-[11.5px] leading-snug">
              <span className="text-muted">{r.voce}</span>
              <span className="tabular-nums">
                {r.prima && <span className="text-muted">{r.prima} → </span>}
                <b style={{ color: "var(--trainer)" }}>{r.dopo}</b>
              </span>
            </p>
          ))}
        </div>
      )}
      {nuovo && stato === "da-confermare" && (
        <div className="mt-[8px] flex flex-col gap-[5px]">
          <input value={nome} onChange={(e) => setNome(e.target.value)} aria-label="Nome e cognome" placeholder="Nome e cognome" className={campo} />
          <input value={obiettivo} onChange={(e) => setObiettivo(e.target.value)} aria-label="Obiettivo" placeholder="Obiettivo (facoltativo)" className={campo} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email del cliente"
            placeholder="Email (facoltativa, non va a Leo)"
            className={`${campo} ${emailValida ? "" : "border-[#d43b4f]"}`}
          />
        </div>
      )}
      {multiplo && stato === "da-confermare" && (
        <div className="mt-[8px] flex flex-wrap gap-[5px]">
          {azione.dati.clienti.map((id) => {
            const acceso = scelti.includes(id);
            return (
              <button
                key={id}
                type="button"
                aria-pressed={acceso}
                onClick={() => setScelti((x) => (acceso ? x.filter((y) => y !== id) : [...x, id]))}
                className={`flex h-[26px] cursor-pointer items-center gap-[4px] rounded-full border px-[9px] text-[11px] font-semibold transition-colors ${acceso ? "border-[var(--trainer)] text-ink" : "border-line text-muted line-through"}`}
                style={acceso ? { background: "color-mix(in srgb, var(--trainer) 12%, transparent)" } : undefined}
              >
                {acceso && <Check size={10} strokeWidth={3} />}
                {trova(id)?.name ?? id}
              </button>
            );
          })}
        </div>
      )}
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
      {multiplo && stato === "da-confermare" && scelti[0] && testo.includes("{nome}") && (
        <p className="mt-[5px] text-[10.5px] leading-snug text-muted">
          Per {trova(scelti[0])?.name.split(" ")[0]}: “{personalizza(testo, trova(scelti[0])?.name ?? "")}”
        </p>
      )}
      {messaggio && stato !== "da-confermare" && <p className="mt-[6px] rounded-[12px] bg-soft px-[10px] py-[7px] text-[12px] leading-snug">{azione.dati.testo}</p>}

      {stato === "da-confermare" && (
        <div className="mt-[8px] flex gap-[6px]">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => onConferma(nuovo ? { nome, obiettivo, email } : multiplo ? { testo, clienti: scelti } : messaggio ? { testo } : undefined)}
            disabled={(messaggio || nuovo) && !pronto}
            className={`btn-trainer ${piccolo} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <Check size={12} /> {multiplo ? `Invia a tutti (${scelti.length})` : messaggio ? "Invia" : nuovo ? "Aggiungi" : "Conferma"}
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
