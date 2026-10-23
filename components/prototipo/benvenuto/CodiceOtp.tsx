"use client";

import { ClipboardEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { codiceGiusto, pulisciCodice } from "@/libs/prototipo/benvenuto";
import { Entra, Tasto } from "./ui";

// Le 6 caselle del codice via email, come nel riferimento: la casella attiva in evidenza, le cifre entrano
// con uno scatto, a codice completo parte da solo "Verifico…"; se è giusto le caselle si fondono in un unico
// quadrato verde con la spunta, se è sbagliato tremano in rosso e si svuotano.

const N = 6;
const LATO = 50;
const SPAZIO = 10;

type Fase = "scrivo" | "verifico" | "errore" | "giusto";

export function CodiceOtp({
  atteso,
  scadenza,
  onGiusto,
  onSbagliato,
  onRimanda,
}: {
  atteso: string;
  scadenza: number; // secondi di validità
  onGiusto: () => void;
  onSbagliato: () => void;
  onRimanda: () => void;
}) {
  const reduce = useReducedMotion();
  const [cifre, setCifre] = useState<string[]>(Array(N).fill(""));
  const [fase, setFase] = useState<Fase>("scrivo");
  const [attiva, setAttiva] = useState(0);
  const [resto, setResto] = useState(scadenza);
  const [errore, setErrore] = useState<string | null>(null);
  const caselle = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    caselle.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (fase === "giusto" || resto <= 0) return;
    const t = window.setTimeout(() => setResto((r) => r - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resto, fase]);

  const metti = (da: number, testo: string) => {
    const nuove = [...cifre];
    const pulito = pulisciCodice(testo);
    for (let k = 0; k < pulito.length && da + k < N; k++) nuove[da + k] = pulito[k];
    setCifre(nuove);
    setErrore(null);
    const prossima = Math.min(da + pulito.length, N - 1);
    caselle.current[prossima]?.focus();
    if (nuove.every(Boolean)) verifica(nuove.join(""));
  };

  const cancella = (i: number) => {
    const nuove = [...cifre];
    nuove[i] = "";
    setCifre(nuove);
  };

  const verifica = (codice: string) => {
    setFase("verifico");
    window.setTimeout(() => {
      if (resto <= 0) return sbaglia("Il codice è scaduto: chiedine uno nuovo");
      if (!codiceGiusto(codice, atteso)) return sbaglia("Codice non corretto, riprova");
      setFase("giusto");
      onGiusto();
    }, 700);
  };

  const sbaglia = (motivo: string) => {
    setFase("errore");
    setErrore(motivo);
    onSbagliato();
    window.setTimeout(() => {
      setCifre(Array(N).fill(""));
      setFase("scrivo");
      caselle.current[0]?.focus();
    }, 480);
  };

  const tasto = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !cifre[i] && i > 0) {
      e.preventDefault();
      const nuove = [...cifre];
      nuove[i - 1] = "";
      setCifre(nuove);
      caselle.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) caselle.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < N - 1) caselle.current[i + 1]?.focus();
  };

  const incolla = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    metti(i, e.clipboardData.getData("text"));
  };

  const fermo = fase === "verifico" || fase === "giusto";
  const mm = Math.floor(Math.max(resto, 0) / 60);
  const ss = String(Math.max(resto, 0) % 60).padStart(2, "0");
  const larghezza = N * LATO + (N - 1) * SPAZIO;

  return (
    <div>
      <Entra i={3}>
        <div className="relative mx-auto mt-[26px] h-[56px]" style={{ width: larghezza }}>
          <motion.div
            className="flex"
            style={{ gap: SPAZIO }}
            animate={fase === "errore" && !reduce ? { x: [0, -10, 10, -8, 8, -4, 0] } : { x: 0 }}
            transition={{ duration: 0.42 }}
          >
            {cifre.map((c, i) => {
              const centro = ((N - 1) / 2 - i) * (LATO + SPAZIO);
              return (
                <motion.div
                  key={i}
                  animate={fase === "giusto" ? { x: centro, scale: 0.7, opacity: 0 } : { x: 0, scale: 1, opacity: 1 }}
                  transition={fase === "giusto" ? { duration: 0.42, ease: [0.6, 0, 0.3, 1], delay: Math.abs(centro) / 2400 } : { duration: 0.2 }}
                  className="relative"
                >
                  <input
                    ref={(el) => {
                      caselle.current[i] = el;
                    }}
                    value={c}
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    aria-label={`Cifra ${i + 1} di ${N}`}
                    disabled={fermo}
                    onFocus={(e) => {
                      setAttiva(i);
                      e.target.select();
                    }}
                    onChange={(e) => {
                      const v = e.target.value;
                      // cifra scritta a mano: vale l'ultima battuta; incollato o suggerito dal telefono: tutto
                      const scritta = (e.nativeEvent as InputEvent).inputType === "insertText";
                      if (!pulisciCodice(v)) return cancella(i);
                      metti(i, scritta ? v.slice(-1) : v);
                    }}
                    onKeyDown={(e) => tasto(i, e)}
                    onPaste={(e) => incolla(i, e)}
                    className={`block h-[56px] rounded-[12px] border-[1.5px] bg-card text-center text-[22px] font-semibold caret-[var(--trainer)] outline-none transition-[border-color,box-shadow,background-color] duration-200 ${
                      fase === "errore"
                        ? "border-[#e5484d] bg-[#fff1f1] text-[#c8282d] dark:bg-[#3a1c1e]"
                        : attiva === i && !fermo
                          ? "border-[var(--trainer)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--trainer)_16%,transparent)]"
                          : c
                            ? "border-ink/25"
                            : "border-line"
                    }`}
                    style={{ width: LATO }}
                  />
                  {/* la cifra appena scritta entra con uno scatto */}
                  <AnimatePresence>
                    {c && !reduce && (
                      <motion.span
                        key={c + i}
                        aria-hidden
                        className="pointer-events-none absolute inset-0 rounded-[12px] border-[1.5px] border-[var(--trainer)]"
                        initial={{ opacity: 0.8, scale: 1 }}
                        animate={{ opacity: 0, scale: 1.18 }}
                        transition={{ duration: 0.35 }}
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
          <AnimatePresence>
            {fase === "giusto" && (
              <motion.span
                className="absolute left-1/2 top-1/2 grid size-[60px] place-items-center rounded-[16px] bg-ok text-white shadow-[0_16px_34px_-12px_rgba(47,158,85,0.75)]"
                initial={{ x: "-50%", y: "-50%", scale: 0.2, rotate: -20, opacity: 0 }}
                animate={{ x: "-50%", y: "-50%", scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.32 }}
              >
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 16, delay: 0.55 }}>
                  <Check size={28} strokeWidth={3.2} />
                </motion.span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </Entra>

      <Entra i={4}>
        <div className="mt-[10px] flex h-[20px] items-center justify-between text-[12.5px]">
          <AnimatePresence mode="wait" initial={false}>
            {errore ? (
              <motion.span key="errore" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="font-semibold text-[#d0363b]">
                {errore}
              </motion.span>
            ) : (
              <motion.span key="tempo" initial={{ opacity: 0 }} animate={{ opacity: fase === "giusto" ? 0 : 1 }} exit={{ opacity: 0 }} className="text-muted">
                {resto > 0 ? (
                  <>
                    Il codice scade tra <b className="tabular-nums text-ink">{mm}:{ss}</b>
                  </>
                ) : (
                  "Codice scaduto"
                )}
              </motion.span>
            )}
          </AnimatePresence>
          <button
            type="button"
            disabled={resto > 0 || fermo}
            onClick={onRimanda}
            className={`min-h-[36px] font-semibold transition-colors ${resto > 0 || fermo ? "cursor-default text-muted/60" : "cursor-pointer text-[var(--trainer)] hover:underline"}`}
          >
            Rimanda il codice
          </button>
        </div>
      </Entra>

      <Entra i={5} className="mt-[22px]">
        <Tasto
          onClick={() => verifica(cifre.join(""))}
          spento={!cifre.every(Boolean)}
          occupato={fase === "verifico" ? "Verifico…" : undefined}
          verde={fase === "giusto"}
        >
          {fase === "giusto" ? "Email verificata" : "Verifica e continua"}
        </Tasto>
      </Entra>
    </div>
  );
}
