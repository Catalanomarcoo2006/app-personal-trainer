"use client";

import { ClipboardEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CIFRE_CODICE, codiceGiusto, pulisciCodice } from "@/libs/prototipo/benvenuto";
import { Entra, Tasto } from "./ui";

// Le 4 caselle del codice via email, fedeli al riferimento (docs/riferimenti/animazione-login.mp4):
// - verifica: il bordo delle caselle si scalda nel colore del trainer e pulsa, il tasto gira ("Verifico…");
// - giusto: le cifre sfumano e le caselle scivolano al centro impilandosi come carte, un po' storte; resta
//   una casella bianca inclinata che diventa un quadrato verde, oscilla fino a raddrizzarsi e disegna la spunta;
//   il tasto diventa verde "Email verificata";
// - sbagliato: le caselle tremano in rosso e si svuotano.

const N = CIFRE_CODICE;
const LATO = 74;
const ALTO = 68;
const SPAZIO = 16;
const VERIFICA_MS = 900;
// inclinazione di ogni casella mentre si impila (come le carte nel riferimento)
const STORTE = [-7, 4, -3, 6];

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
  const [tastoVerde, setTastoVerde] = useState(false);
  const caselle = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    caselle.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (fase === "giusto" || resto <= 0) return;
    const t = window.setTimeout(() => setResto((r) => r - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resto, fase]);

  const verifica = (codice: string) => {
    if (fase === "verifico" || fase === "giusto") return;
    setFase("verifico");
    caselle.current.forEach((c) => c?.blur());
    window.setTimeout(() => {
      if (resto <= 0) return sbaglia("Il codice è scaduto: chiedine uno nuovo");
      if (!codiceGiusto(codice, atteso)) return sbaglia("Codice non corretto, riprova");
      setFase("giusto");
      onGiusto();
      // il tasto diventa verde insieme al quadrato (come nel riferimento)
      window.setTimeout(() => setTastoVerde(true), reduce ? 0 : 620);
    }, VERIFICA_MS);
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

  const metti = (da: number, testo: string) => {
    const nuove = [...cifre];
    const pulito = pulisciCodice(testo);
    for (let k = 0; k < pulito.length && da + k < N; k++) nuove[da + k] = pulito[k];
    setCifre(nuove);
    setErrore(null);
    caselle.current[Math.min(da + pulito.length, N - 1)]?.focus();
    if (nuove.every(Boolean)) verifica(nuove.join(""));
  };

  const cancella = (i: number) => {
    const nuove = [...cifre];
    nuove[i] = "";
    setCifre(nuove);
  };

  const tasto = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !cifre[i] && i > 0) {
      e.preventDefault();
      cancella(i - 1);
      caselle.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) caselle.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < N - 1) caselle.current[i + 1]?.focus();
  };

  const incolla = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    metti(i, e.clipboardData.getData("text"));
  };

  const fermo = fase === "verifico" || fase === "giusto";
  const giusto = fase === "giusto";
  const mm = Math.floor(Math.max(resto, 0) / 60);
  const ss = String(Math.max(resto, 0) % 60).padStart(2, "0");
  const larghezza = N * LATO + (N - 1) * SPAZIO;

  return (
    <div>
      <Entra i={3}>
        <div className="relative mx-auto mt-[28px]" style={{ width: larghezza, height: ALTO }}>
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
                  className="relative"
                  animate={
                    giusto && !reduce
                      ? { x: centro, rotate: [0, STORTE[i], STORTE[i] * 0.6], scale: [1, 0.97, 0.94], opacity: [1, 1, 0] }
                      : { x: 0, rotate: 0, scale: 1, opacity: giusto ? 0 : 1 }
                  }
                  transition={giusto ? { duration: 0.42, times: [0, 0.75, 1], ease: [0.55, 0, 0.35, 1] } : { duration: 0.2 }}
                  style={{ zIndex: N - Math.abs(Math.round((N - 1) / 2 - i)) }}
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
                    className={`block rounded-[14px] border-[1.5px] bg-card text-center text-[26px] font-semibold caret-[var(--trainer)] outline-none transition-[border-color,box-shadow,background-color,color] disabled:cursor-default ${giusto ? "!text-transparent duration-100" : "duration-200"} ${
                      fase === "errore"
                        ? "border-[#e5484d] bg-[#fff1f1] text-[#c8282d] dark:bg-[#3a1c1e]"
                        : fase === "verifico"
                          ? "border-[color-mix(in_srgb,var(--trainer)_45%,var(--color-line))] text-ink"
                          : attiva === i && !fermo
                            ? "border-[var(--trainer)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--trainer)_16%,transparent)]"
                            : c
                              ? "border-ink/30"
                              : "border-line"
                    }`}
                    style={{ width: LATO, height: ALTO }}
                  />
                  {/* verifica: un alone caldo pulsa sulle caselle, una dopo l'altra */}
                  <AnimatePresence>
                    {fase === "verifico" && (
                      <motion.span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 rounded-[14px]"
                        style={{ boxShadow: "0 0 0 4px color-mix(in srgb, var(--trainer) 20%, transparent), 0 6px 18px -6px color-mix(in srgb, var(--trainer) 50%, transparent)" }}
                        initial={{ opacity: 0 }}
                        animate={reduce ? { opacity: 0.6 } : { opacity: [0.15, 1, 0.15] }}
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                        transition={{ duration: 0.75, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
                      />
                    )}
                  </AnimatePresence>
                  {/* la cifra appena scritta entra con uno scatto */}
                  <AnimatePresence>
                    {c && !reduce && fase === "scrivo" && (
                      <motion.span
                        key={c + i}
                        aria-hidden
                        className="pointer-events-none absolute inset-0 rounded-[14px] border-[1.5px] border-[var(--trainer)]"
                        initial={{ opacity: 0.8, scale: 1 }}
                        animate={{ opacity: 0, scale: 1.15 }}
                        transition={{ duration: 0.35 }}
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>

          {/* l'unica casella che resta: bianca e inclinata, poi verde con la spunta, oscillando fino a raddrizzarsi */}
          <AnimatePresence>
            {giusto && (
              <motion.span
                className="absolute left-1/2 top-1/2 grid place-items-center rounded-[16px] border-[1.5px]"
                style={{ width: ALTO, height: ALTO, marginLeft: -ALTO / 2, marginTop: -ALTO / 2 }}
                initial={{ opacity: 0, rotate: -6, scale: 0.94, backgroundColor: "#ffffff", borderColor: "#e6e6e8" }}
                animate={
                  reduce
                    ? { opacity: 1, rotate: 0, scale: 1, backgroundColor: "#2f9e55", borderColor: "#2f9e55" }
                    : {
                        opacity: [0, 1, 1, 1, 1, 1],
                        rotate: [-6, -9, 9, -4, 2, 0],
                        scale: [0.94, 1, 1.12, 1.02, 1, 1],
                        backgroundColor: ["#ffffff", "#ffffff", "#2f9e55", "#2f9e55", "#2f9e55", "#2f9e55"],
                        borderColor: ["#e6e6e8", "#e6e6e8", "#2f9e55", "#2f9e55", "#2f9e55", "#2f9e55"],
                        boxShadow: [
                          "0 0 0 rgba(47,158,85,0)",
                          "0 4px 10px -4px rgba(0,0,0,0.15)",
                          "0 18px 34px -12px rgba(47,158,85,0.75)",
                          "0 16px 30px -12px rgba(47,158,85,0.6)",
                          "0 16px 30px -12px rgba(47,158,85,0.6)",
                          "0 16px 30px -12px rgba(47,158,85,0.6)",
                        ],
                      }
                }
                transition={{ duration: 0.85, times: [0, 0.2, 0.26, 0.55, 0.8, 1], ease: "easeOut", delay: 0.3 }}
              >
                <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden>
                  <motion.path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.32, ease: "easeOut", delay: reduce ? 0 : 0.85 }}
                  />
                </svg>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </Entra>

      <Entra i={4}>
        <motion.div className="mt-[12px] flex h-[22px] items-center justify-between text-[12.5px]" animate={{ opacity: giusto ? 0 : 1 }} transition={{ duration: 0.3, delay: giusto ? 0.5 : 0 }}>
          <AnimatePresence mode="wait" initial={false}>
            {errore ? (
              <motion.span key="errore" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="font-semibold text-[#d0363b]">
                {errore}
              </motion.span>
            ) : (
              <motion.span key="tempo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-muted">
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
        </motion.div>
      </Entra>

      <Entra i={5} className="mt-[20px]">
        <Tasto onClick={() => verifica(cifre.join(""))} spento={!cifre.every(Boolean)} occupato={fase === "verifico" || (giusto && !tastoVerde) ? "Verifico…" : undefined} verde={tastoVerde}>
          {tastoVerde ? "Email verificata" : "Verifica e continua"}
        </Tasto>
      </Entra>
    </div>
  );
}
