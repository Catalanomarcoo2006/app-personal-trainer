"use client";

// Registrazione del cliente, al primo accesso dall'invito del trainer: invito, consenso ai dati sulla salute, obiettivo
// (lo propone il cliente, lo conferma il trainer: Marco, 29/10), ogni quanto pesarsi. Le scelte vanno allo sportello
// dei dati; che la registrazione è fatta lo ricorda il browser (con il database starà sull'account del cliente).
// Nel prototipo ?registrazione nell'indirizzo la fa ripartire.

import { ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronLeft, Lock, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { client, trainer } from "@/libs/prototipo/dati-finti";
import { useTrainerPhoto } from "@/libs/prototipo/stato";
import { useCliente } from "@/libs/dati/selettori";
import { impostaPesata, proponiObiettivo } from "@/libs/dati/sportello";
import { FREQUENZE, type Frequenza } from "@/libs/domain/pesate";
import { Telefono } from "./Shell";
import { CLIENTE_DEMO } from "./scheda";

const CHIAVE = "registrazione-cliente";
const nomeTrainer = trainer.name.split(" ")[0];

// true/false dopo il primo disegno (prima non si sa: il browser non è ancora letto)
export function useRegistrazione(): [boolean | null, () => void] {
  const [fatta, setFatta] = useState<boolean | null>(null);
  useEffect(() => {
    let si = false;
    try {
      si = localStorage.getItem(CHIAVE) === "fatta" && !new URLSearchParams(location.search).has("registrazione");
    } catch {
      // senza memoria del browser si rifà la registrazione: va bene per la demo
    }
    setFatta(si);
  }, []);
  const segna = () => {
    try {
      localStorage.setItem(CHIAVE, "fatta");
    } catch {
      // niente memoria: alla prossima apertura si rifà
    }
    setFatta(true);
  };
  return [fatta, segna];
}

const numero = (n: number) => String(n).replace(".", ",");
const leggi = (t: string) => (t.trim() ? Number(t.trim().replace(",", ".")) : NaN);

function Passo({ icona, titolo, sotto, children }: { icona: ReactNode; titolo: string; sotto: string; children: ReactNode }) {
  return (
    <div className="flex shrink-0 flex-col">
      <span className="sel-trainer grid size-[52px] place-items-center rounded-[16px]" style={{ color: "var(--trainer)" }}>
        {icona}
      </span>
      <h1 className="mt-[16px] text-[26px] leading-[1.15] font-extrabold tracking-[-0.03em]">{titolo}</h1>
      <p className="mt-[8px] text-[14px] leading-snug text-ink/70">{sotto}</p>
      <div className="mt-[20px] flex flex-col">{children}</div>
    </div>
  );
}

function CampoPeso({ label, valore, onChange }: { label: string; valore: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-[6px] block text-[13px] font-semibold text-muted">{label}</span>
      <span className="panel flex h-[60px] items-center rounded-[18px] px-[16px] focus-within:ring-2 focus-within:ring-[var(--trainer)]">
        <input inputMode="decimal" value={valore} onChange={(e) => onChange(e.target.value)} placeholder="—" className="min-w-0 flex-1 bg-transparent text-[24px] font-extrabold tabular-nums outline-none placeholder:font-normal placeholder:text-muted" />
        <span className="text-[15px] font-semibold text-muted">kg</span>
      </span>
    </label>
  );
}

export function Registrazione({ onFatta }: { onFatta: () => void }) {
  const reduce = useReducedMotion();
  const foto = useTrainerPhoto();
  const c = useCliente(CLIENTE_DEMO);
  const [passo, setPasso] = useState(0);
  const [consenso, setConsenso] = useState(false);
  // il peso da cui è partito con il trainer, se c'è già (Giulia: 72); un cliente nuovo lo scrive lui
  const [start, setStart] = useState(() => (c?.weights.length ? numero(c.start) : ""));
  const [target, setTarget] = useState(() => (c ? numero(c.target) : ""));
  const [frequenza, setFrequenza] = useState<Frequenza>("settimana");
  const [errore, setErrore] = useState<string | null>(null);
  const PASSI = 5;

  const avanti = async () => {
    setErrore(null);
    if (passo === 2) {
      const esito = await proponiObiettivo(CLIENTE_DEMO, leggi(start), leggi(target));
      if ("motivo" in esito) return setErrore(Number.isNaN(leggi(start)) || Number.isNaN(leggi(target)) ? "Scrivi tutti e due i pesi, per esempio 68,5" : esito.motivo);
    }
    if (passo === 3) await impostaPesata(CLIENTE_DEMO, frequenza);
    if (passo === PASSI - 1) {
      playSound("complete");
      return onFatta();
    }
    playSound("tap");
    setPasso((p) => p + 1);
  };

  const differenza = leggi(target) - leggi(start);
  const pronto = passo !== 1 || consenso;

  return (
    <Telefono>
      <div className="relative flex h-full flex-col px-[22px] pt-[max(20px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))] sm:pt-[64px]">
        {/* avanzamento e indietro */}
        <div className="flex h-[34px] items-center gap-[10px]">
          {passo > 0 && passo < PASSI - 1 ? (
            <button type="button" aria-label="Indietro" onClick={() => setPasso((p) => p - 1)} className="glass grid size-[34px] cursor-pointer place-items-center rounded-full">
              <ChevronLeft size={17} />
            </button>
          ) : (
            <span className="w-[34px]" />
          )}
          <div className="flex flex-1 gap-[5px]">
            {Array.from({ length: PASSI }, (_, i) => (
              <span key={i} className="h-[4px] flex-1 overflow-hidden rounded-full bg-ink/10">
                <motion.span className="block h-full rounded-full" style={{ background: "var(--trainer)" }} initial={false} animate={{ width: i <= passo ? "100%" : "0%" }} transition={{ duration: 0.35, ease: EASE_OUT }} />
              </span>
            ))}
          </div>
          <span className="w-[34px]" />
        </div>

        {/* se il passo è più alto dello schermo scorre lui: il tasto resta sotto, niente scritte dietro */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={passo} className="mt-[26px] -mx-[4px] flex min-h-0 flex-1 flex-col overflow-y-auto px-[4px] pb-[8px] [scrollbar-width:none]" initial={{ opacity: 0, x: reduce ? 0 : 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduce ? 0 : -24 }} transition={{ duration: 0.28, ease: EASE_OUT }}>
            {passo === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={foto} alt="" className="size-[108px] rounded-full object-cover ring-4 ring-white/80 shadow-[0_20px_40px_-14px_rgba(0,0,0,0.35)]" />
                  <span className="btn-trainer absolute -right-[4px] -bottom-[4px] grid size-[36px] place-items-center rounded-full text-[18px]">👋</span>
                </div>
                <h1 className="mt-[22px] text-[28px] leading-[1.15] font-extrabold tracking-[-0.03em]">
                  Ciao {client.name}!
                  <br />
                  {nomeTrainer} ti ha invitato
                </h1>
                <p className="mt-[10px] max-w-[290px] text-[14.5px] leading-snug text-ink/70">
                  Qui trovi i tuoi allenamenti, i progressi e la chat con {nomeTrainer}. Ci vuole un minuto per iniziare.
                </p>
              </div>
            )}

            {passo === 1 && (
              <Passo icona={<ShieldCheck size={24} />} titolo="I tuoi dati sono al sicuro" sotto={`Prima di iniziare ti spieghiamo cosa salva l'app e chi lo vede.`}>
                <ul className="flex flex-col gap-[8px]">
                  {[
                    { i: <UserRound size={17} />, t: "Cosa raccogliamo", d: "Peso, misure, allenamenti fatti e i dolori che segnali a Leo." },
                    { i: <Lock size={17} />, t: "Chi li vede", d: `Solo ${trainer.name}, il tuo trainer.` },
                    { i: <MapPin size={17} />, t: "Dove stanno", d: "Su server in Unione Europea." },
                  ].map((x) => (
                    <li key={x.t} className="glass-row flex gap-[12px] rounded-[18px] px-[14px] py-[12px]">
                      <span className="mt-[1px] shrink-0" style={{ color: "var(--trainer)" }}>
                        {x.i}
                      </span>
                      <span className="leading-snug">
                        <b className="block text-[14px] font-bold">{x.t}</b>
                        <span className="text-[13px] text-ink/70">{x.d}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <button type="button" role="checkbox" aria-checked={consenso} onClick={() => (playSound("tap"), setConsenso((v) => !v))} className="mt-[16px] flex min-h-[56px] cursor-pointer items-center gap-[12px] rounded-[18px] text-left">
                  <span className={`grid size-[28px] shrink-0 place-items-center rounded-[9px] border-2 transition-colors ${consenso ? "border-transparent btn-trainer" : "border-ink/25"}`}>{consenso && <Check size={16} strokeWidth={3} />}</span>
                  <span className="text-[13.5px] leading-snug">Acconsento al trattamento dei miei dati sulla salute per seguire il mio percorso</span>
                </button>
                {!consenso && <p className="mt-[4px] text-[12px] text-muted">Senza il tuo consenso l&apos;app non può salvare i tuoi progressi.</p>}
              </Passo>
            )}

            {passo === 2 && (
              <Passo icona={<span className="text-[24px]">🎯</span>} titolo="Il tuo obiettivo" sotto={`Da dove parti e dove vuoi arrivare. ${nomeTrainer} lo guarda e lo conferma con te.`}>
                <div className="flex flex-col gap-[12px]">
                  <CampoPeso label="Il tuo peso di partenza" valore={start} onChange={(v) => (setErrore(null), setStart(v))} />
                  <CampoPeso label="Il peso che vuoi raggiungere" valore={target} onChange={(v) => (setErrore(null), setTarget(v))} />
                </div>
                {Number.isFinite(differenza) && differenza !== 0 && (
                  <motion.p key={Math.sign(differenza)} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-[14px] self-start rounded-full px-[12px] py-[6px] text-[13px] font-bold" style={{ color: "var(--trainer)", background: "color-mix(in srgb, var(--trainer) 12%, transparent)" }}>
                    {differenza < 0 ? "−" : "+"}
                    {numero(Math.round(Math.abs(differenza) * 10) / 10)} kg {differenza < 0 ? "da perdere" : "da mettere"}
                  </motion.p>
                )}
                {errore && <p className="mt-[10px] text-[13px] font-semibold text-[#e5484d]">{errore}</p>}
              </Passo>
            )}

            {passo === 3 && (
              <Passo icona={<span className="text-[24px]">⚖️</span>} titolo="Ogni quanto ti pesi?" sotto="Quando arriva il momento l'app te lo ricorda. Puoi cambiarlo quando vuoi dai tuoi Progressi.">
                <div role="radiogroup" aria-label="Ogni quanto ti pesi" className="flex flex-col gap-[8px]">
                  {FREQUENZE.map((x) => {
                    const qui = x.f === frequenza;
                    return (
                      <button
                        key={x.f}
                        type="button"
                        role="radio"
                        aria-checked={qui}
                        onClick={() => (playSound("tap"), setFrequenza(x.f))}
                        className={`flex min-h-[60px] cursor-pointer items-center justify-between rounded-[18px] px-[16px] text-left transition-colors ${qui ? "sel-trainer" : "glass-row"}`}
                      >
                        <span className="leading-tight">
                          <b className="block text-[15px] font-bold">{x.label}</b>
                          <span className="text-[12.5px] text-ink/60">{x.f === "settimana" ? "Il consiglio di " + nomeTrainer + " per iniziare" : x.f === "giorno" ? "Il numero cambia molto da un giorno all'altro" : "Per chi non vuole pensarci troppo"}</span>
                        </span>
                        <span className={`grid size-[24px] shrink-0 place-items-center rounded-full border-2 ${qui ? "border-transparent btn-trainer" : "border-ink/20"}`}>{qui && <Check size={14} strokeWidth={3} />}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-[14px] text-[12.5px] leading-snug text-muted">Consiglio: pesati sempre alla stessa ora, la mattina appena sveglia, prima di colazione.</p>
              </Passo>
            )}

            {passo === 4 && (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <motion.span initial={{ scale: reduce ? 1 : 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} className="btn-trainer grid size-[96px] place-items-center rounded-full">
                  <Check size={44} strokeWidth={3} />
                </motion.span>
                <h1 className="mt-[22px] text-[28px] leading-[1.15] font-extrabold tracking-[-0.03em]">Tutto pronto!</h1>
                <p className="mt-[10px] max-w-[290px] text-[14.5px] leading-snug text-ink/70">
                  Il tuo obiettivo è arrivato a {nomeTrainer}: lo conferma lui. Intanto c&apos;è il tuo primo allenamento che ti aspetta.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <motion.button type="button" whileTap={{ scale: 0.97 }} disabled={!pronto} onClick={() => void avanti()} className="btn-trainer mt-[16px] h-[54px] w-full shrink-0 cursor-pointer rounded-full text-[15.5px] font-bold disabled:cursor-default disabled:opacity-40">
          {passo === 0 ? "Iniziamo" : passo === PASSI - 1 ? "Entra" : "Continua"}
        </motion.button>
      </div>
    </Telefono>
  );
}
