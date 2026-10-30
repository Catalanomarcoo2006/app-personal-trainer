"use client";

// La scheda intera del cliente: i giorni (Giorno A, B, C) a segmenti con la goccia, sotto gli esercizi del giorno
// scelto. Quello di oggi si spunta esercizio per esercizio (le spunte si vedono anche in Home); gli altri si
// guardano, con la data della prossima seduta in cui toccano. Si parte dal giorno dell'allenamento di oggi (o del prossimo).

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarClock, Check, FileText, Play } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { trainer } from "@/libs/prototipo/dati-finti";
import { useStato } from "@/libs/prototipo/stato";
import { apriFile, pdfScheda } from "./apri-file";
import { useSpunte } from "./spunte";
import { quandoSeduta, useScheda } from "./scheda";

// il nome del trainer (nella versione vera quello collegato): si legge a ogni uso
const nomeTrainer = () => trainer.name.split(" ")[0];

export function Allenamento() {
  const { giorni, prossimo, prossimaDi, esercizio } = useScheda();
  const delGiorno = prossimo?.giorno ?? 0;
  const [scelto, setScelto] = useState(delGiorno);
  const [pdf, setPdf] = useState(false);
  const videos = useStato((s) => s.videos);
  const qui = Math.min(scelto, Math.max(0, giorni.length - 1)); // se Marco toglie un giorno dalla scheda
  const oggi = !!prossimo?.oggi && qui === prossimo.giorno;
  const giorno = giorni[qui];
  const [fatte, cambia] = useSpunte(oggi && giorno ? giorno.rows.length : 0);
  const quante = fatte.filter(Boolean).length;
  const tutte = oggi && quante === fatte.length && fatte.length > 0;
  const quando = prossimaDi(qui);

  if (!giorno)
    return <p className="panel mt-[16px] rounded-[24px] px-[18px] py-[24px] text-center text-[13.5px] text-muted">{nomeTrainer()} non ti ha ancora mandato la scheda.</p>;

  // la scheda intera in PDF (apri-file.ts)
  const apriPdf = async () => {
    playSound("tap");
    setPdf(true);
    await apriFile(pdfScheda(giorni, videos));
    setPdf(false);
  };

  const spunta = (i: number) => {
    const dopo = cambia(i);
    if (dopo.every(Boolean)) playSound("complete");
    else playSound(dopo[i] ? "confirm" : "tap");
  };

  return (
    <div className="mt-[16px]">
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => void apriPdf()}
        disabled={pdf}
        className="glass mb-[10px] flex h-[42px] w-full cursor-pointer items-center justify-center gap-[7px] rounded-full text-[13.5px] font-bold disabled:opacity-60"
      >
        <FileText size={15} style={{ color: "var(--trainer)" }} /> {pdf ? "Preparo il PDF…" : "Vedi la scheda in PDF"}
      </motion.button>

      {/* i giorni della scheda: la goccia scivola sotto quello scelto */}
      <div role="tablist" aria-label="Giorni della scheda" className="glass grid gap-[3px] rounded-full p-[4px]" style={{ gridTemplateColumns: `repeat(${giorni.length}, 1fr)` }}>
        {giorni.map((g, i) => {
          const attivo = i === qui;
          return (
            <button
              key={g.label + i}
              type="button"
              role="tab"
              aria-selected={attivo}
              onClick={() => {
                if (!attivo) playSound("tap");
                setScelto(i);
              }}
              className="relative flex h-[46px] cursor-pointer flex-col items-center justify-center rounded-full leading-none"
            >
              {attivo && <motion.span layoutId="giorno-scheda" aria-hidden className="glass-drop absolute inset-0 rounded-full" transition={{ type: "spring", stiffness: 520, damping: 40 }} />}
              <span className={`relative text-[13px] ${attivo ? "font-extrabold" : "font-semibold text-ink/60"}`} style={attivo ? { color: "var(--trainer)" } : undefined}>
                {g.label}
              </span>
              {prossimo?.giorno === i && <span className="relative mt-[3px] text-[9.5px] font-semibold text-muted">{prossimo.oggi ? "Oggi" : "Il prossimo"}</span>}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.section key={qui} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2, ease: EASE_OUT }} className="mt-[12px]">
          {/* Come le altre schermate (Marco, 30/10: troppo arancio in troppe tonalità e scatole una dentro l'altra):
              una scheda per il giorno con il numero in evidenza, poi una scheda per esercizio. L'arancio solo dove
              conta: la barra dei fatti e le spunte. */}
          <div className="panel rounded-[24px] px-[16px] pt-[15px] pb-[14px]">
            <div className="flex items-start justify-between gap-[10px]">
              <div className="min-w-0 leading-none">
                <p className="text-[19px] font-extrabold tracking-[-0.02em]">{giorno.focus || giorno.label}</p>
                <p className="mt-[6px] text-[12.5px] text-muted">
                  {giorno.label} · {giorno.rows.length} esercizi
                </p>
              </div>
              {oggi && (
                <p className="shrink-0 text-right leading-none">
                  <motion.span key={quante} initial={{ scale: 0.85 }} animate={{ scale: 1 }} className="inline-block text-[26px] font-extrabold tracking-[-0.03em] tabular-nums">
                    {quante}
                    <span className="text-[15px] text-muted">/{fatte.length}</span>
                  </motion.span>
                  <span className="mt-[3px] block text-[11px] text-muted">fatti</span>
                </p>
              )}
            </div>
            {oggi && (
              <div className="mt-[12px] h-[6px] overflow-hidden rounded-full bg-ink/8" aria-hidden>
                <motion.div className="h-full rounded-full" style={{ background: "var(--trainer)" }} initial={false} animate={{ width: `${(quante / Math.max(1, fatte.length)) * 100}%` }} transition={{ duration: 0.45, ease: EASE_OUT }} />
              </div>
            )}
            <p className="mt-[12px] flex items-center gap-[6px] text-[12px] text-ink/70">
              <CalendarClock size={13} className="text-muted" />
              {quando ? `${quandoSeduta(quando)} con ${nomeTrainer()}` : "Nessuna seduta in programma per questo giorno"}
            </p>
          </div>

          <ol className="mt-[10px] flex flex-col gap-[8px]">
            {giorno.rows.map((r, i) => {
              const e = esercizio(r);
              const fatta = oggi && fatte[i];
              return (
                <motion.li
                  key={r.key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.35, ease: EASE_OUT }}
                  className="panel flex items-center gap-[12px] rounded-[20px] py-[12px] pr-[12px] pl-[14px]"
                >
                  {/* fatti: barrati e smorzati, con la spunta piena; da fare: a piena intensità con la spunta vuota */}
                  <span className={`w-[16px] shrink-0 text-[14px] font-extrabold tabular-nums transition-opacity duration-300 ${fatta ? "opacity-30" : "text-ink/35"}`}>{i + 1}</span>
                  <div className={`min-w-0 flex-1 leading-none transition-opacity duration-300 ${fatta ? "opacity-45" : ""}`}>
                    <p className={`truncate text-[15px] font-bold ${fatta ? "line-through decoration-2" : ""}`}>{e.nome}</p>
                    <p className={`mt-[5px] truncate text-[12.5px] text-ink/60 ${fatta ? "line-through" : ""}`}>{e.dettaglio}</p>
                    {e.video && (
                      <a
                        href={e.video}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => playSound("tap")}
                        className="mt-[8px] inline-flex items-center gap-[5px] text-[12px] font-semibold text-ink/70"
                      >
                        <span className="grid size-[18px] place-items-center rounded-full bg-ink/8">
                          <Play size={8} strokeWidth={2.6} fill="currentColor" />
                        </span>
                        Guarda l&apos;esecuzione
                      </a>
                    )}
                  </div>
                  {oggi && (
                    <motion.button
                      type="button"
                      aria-label={fatta ? `Togli la spunta a ${e.nome}` : `Segna ${e.nome} come fatto`}
                      aria-pressed={fatta}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => spunta(i)}
                      className={`grid size-[40px] shrink-0 cursor-pointer place-items-center rounded-full border-2 transition-colors duration-300 ${fatta ? "btn-trainer border-transparent" : "border-ink/15 text-ink/25"}`}
                    >
                      <motion.span animate={{ scale: fatta ? [1, 1.25, 1] : 1 }} transition={{ duration: 0.3 }}>
                        <Check size={17} strokeWidth={2.8} />
                      </motion.span>
                    </motion.button>
                  )}
                </motion.li>
              );
            })}
          </ol>

          <AnimatePresence>
            {tutte && (
              <motion.p
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ type: "spring", stiffness: 380, damping: 24 }}
                className="btn-trainer mt-[10px] rounded-[18px] px-[14px] py-[12px] text-center text-[13px] font-bold"
              >
                Allenamento completato! 🎉 {nomeTrainer()} lo vedrà nella tua scheda.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.section>
      </AnimatePresence>
    </div>
  );
}
