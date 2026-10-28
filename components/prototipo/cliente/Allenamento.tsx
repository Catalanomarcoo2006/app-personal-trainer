"use client";

// La scheda intera del cliente: i giorni (Giorno A, B, C) a segmenti con la goccia, sotto gli esercizi del giorno
// scelto. Quello di oggi si spunta esercizio per esercizio (le spunte si vedono anche in Home); gli altri si
// guardano, con la data della prossima seduta in cui toccano. Si parte dal giorno dell'allenamento di oggi (o del prossimo).

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarClock, Check, Play } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { trainer } from "@/libs/prototipo/dati-finti";
import { useSpunte } from "./spunte";
import { quandoSeduta, useScheda } from "./scheda";

const nomeTrainer = trainer.name.split(" ")[0];

export function Allenamento() {
  const { giorni, prossimo, prossimaDi, esercizio } = useScheda();
  const delGiorno = prossimo?.giorno ?? 0;
  const [scelto, setScelto] = useState(delGiorno);
  const qui = Math.min(scelto, Math.max(0, giorni.length - 1)); // se Marco toglie un giorno dalla scheda
  const oggi = !!prossimo?.oggi && qui === prossimo.giorno;
  const giorno = giorni[qui];
  const [fatte, cambia] = useSpunte(oggi && giorno ? giorno.rows.length : 0);
  const quante = fatte.filter(Boolean).length;
  const tutte = oggi && quante === fatte.length && fatte.length > 0;
  const quando = prossimaDi(qui);

  if (!giorno)
    return <p className="panel mt-[16px] rounded-[24px] px-[18px] py-[24px] text-center text-[13.5px] text-muted">{nomeTrainer} non ti ha ancora mandato la scheda.</p>;

  const spunta = (i: number) => {
    const dopo = cambia(i);
    if (dopo.every(Boolean)) playSound("complete");
    else playSound(dopo[i] ? "confirm" : "tap");
  };

  return (
    <div className="mt-[16px]">
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
        <motion.section key={qui} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2, ease: EASE_OUT }} className="panel mt-[12px] overflow-hidden rounded-[24px]">
          <div className="px-[16px] pt-[14px] pb-[12px]" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--trainer) 20%, transparent), color-mix(in srgb, var(--trainer) 5%, transparent))" }}>
            <div className="flex items-start justify-between gap-[10px]">
              <div className="min-w-0 leading-none">
                <p className="text-[18px] font-extrabold tracking-[-0.02em]">{giorno.focus || giorno.label}</p>
                <p className="mt-[6px] text-[12.5px] text-ink/70">
                  {giorno.label} · {giorno.rows.length} esercizi
                </p>
              </div>
              {oggi && (
                <motion.span key={quante} initial={{ scale: 0.85 }} animate={{ scale: 1 }} className="btn-trainer shrink-0 rounded-full px-[11px] py-[6px] text-[12px] font-bold tabular-nums">
                  {quante}/{fatte.length}
                </motion.span>
              )}
            </div>
            <p className="mt-[10px] inline-flex items-center gap-[5px] rounded-full bg-card/70 px-[9px] py-[5px] text-[11.5px] text-ink/75">
              <CalendarClock size={12} />
              {quando ? `${quandoSeduta(quando)} con ${nomeTrainer}` : "Nessuna seduta in programma per questo giorno"}
            </p>
          </div>

          <ol className="flex flex-col gap-[7px] px-[12px] pt-[12px] pb-[14px]">
            {giorno.rows.map((r, i) => {
              const e = esercizio(r);
              const fatta = oggi && fatte[i];
              return (
                <motion.li
                  key={r.key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.35, ease: EASE_OUT }}
                  className="glass-row flex items-center gap-[11px] rounded-[16px] py-[10px] pr-[10px] pl-[12px]"
                >
                  <span className="grid size-[26px] shrink-0 place-items-center rounded-full bg-ink/6 text-[11.5px] font-bold tabular-nums text-ink/60">{i + 1}</span>
                  <div className="min-w-0 flex-1 leading-none">
                    <p className={`truncate text-[14px] font-bold transition-opacity ${fatta ? "opacity-45" : ""}`}>{e.nome}</p>
                    <p className="mt-[5px] truncate text-[11.5px] text-muted">{e.dettaglio}</p>
                    {e.video && (
                      <a
                        href={e.video}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => playSound("tap")}
                        className="mt-[7px] inline-flex items-center gap-[4px] rounded-full px-[8px] py-[4px] text-[11px] font-semibold"
                        style={{ color: "var(--trainer)", background: "color-mix(in srgb, var(--trainer) 12%, transparent)" }}
                      >
                        <Play size={9} strokeWidth={2.6} fill="currentColor" /> Guarda l&apos;esecuzione
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
                      className={`grid size-[40px] shrink-0 cursor-pointer place-items-center rounded-full transition-colors duration-300 ${fatta ? "btn-trainer" : "glass text-ink/30"}`}
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
                className="btn-trainer mx-[12px] mb-[14px] rounded-[16px] px-[14px] py-[12px] text-center text-[13px] font-bold"
              >
                Allenamento completato! 🎉 {nomeTrainer} lo vedrà nella tua scheda.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.section>
      </AnimatePresence>
    </div>
  );
}
