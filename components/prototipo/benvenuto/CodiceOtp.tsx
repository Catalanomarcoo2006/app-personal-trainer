"use client";

import { ClipboardEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { EASE_OUT } from "@/components/ui/motion";
import { CIFRE_CODICE, codiceGiusto, pulisciCodice } from "@/libs/prototipo/benvenuto";
import { Entra, Tasto } from "./ui";

// Le 4 caselle del codice via email. La verifica segue il video scelto da Marco il 24/10
// ("ANIMAZIONE CODICE OTP FIGA .mp4", Glassy OTP):
// 1. all'ultima cifra una scia di luce gira sul bordo di ogni casella e il tasto dice "Verifico…";
// 2. le caselle lasciano la riga e si dispongono a croce (prima sopra, seconda a sinistra, terza sotto, quarta a destra);
// 3. la croce fa un giro intero su sé stessa;
// 4. le caselle si stringono al centro e si fondono in una sola, vuota;
// 5. il bordo si accende, un anello verde si allarga intorno con una corona di puntini, la casella diventa verde
//    e disegna la spunta; tutto il riquadro si tinge di verde e il tasto diventa "Email verificata".
// Codice sbagliato o scaduto: scia sulle caselle in riga per un attimo, poi tremano in rosso e si svuotano.

const N = CIFRE_CODICE;
const LATO = 74;
const ALTO = 68;
const SPAZIO = 16;
const VERIFICA_MS = 900; // codice sbagliato: quanto dura il "Verifico…" prima del rosso

// La croce: caselle rimpicciolite e distanza dal centro, altezza dello spazio che si apre per contenerla.
const SCALA_CROCE = 0.8;
const RAGGIO = 56;
const ALTO_CROCE = 172;
const CROCE: [number, number][] = [
  [0, -RAGGIO], // prima cifra: sopra
  [-RAGGIO, 0], // seconda: a sinistra
  [0, RAGGIO], // terza: sotto
  [RAGGIO, 0], // quarta: a destra
];
// fondendosi le caselle restano un attimo sfalsate, come carte (fotogrammi 2,4–2,5 s del video)
const SFALSA: [number, number][] = [
  [3, -4],
  [-4, 2],
  [2, 5],
  [5, -1],
];

// Momenti della verifica giusta, in secondi da quando si scrive l'ultima cifra (misurati sul video).
const T = {
  croce: 0.2, // le caselle partono verso la croce
  croceFatta: 0.65,
  giroFine: 2.05, // fine del giro intero
  fondi: 2.4, // caselle quasi al centro, le cifre sono sparite
  unica: 2.5, // resta una sola casella vuota
  accende: 2.7, // bordo acceso, compare l'anello
  verde: 2.85, // casella verde, puntini, tasto verde
  spunta: 3.0, // la spunta si disegna
  fine: 3.4,
};
const DURATA_CARTE = T.unica + 0.05;
const t = (s: number) => s / DURATA_CARTE; // istante → frazione della corsa delle carte

const VERDE = "var(--color-ok)";
const verde = (p: number) => `color-mix(in srgb, var(--color-ok) ${p}%, transparent)`;

// Bordo luminoso: maschera che lascia vedere solo una cornice di 2 px (contenuto escluso).
const SOLO_BORDO = {
  padding: 2,
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
} as const;

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
  const timer = useRef<number[]>([]);

  useEffect(() => {
    caselle.current[0]?.focus();
    const t = timer.current;
    return () => t.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    if (fase === "giusto" || resto <= 0) return;
    const t = window.setTimeout(() => setResto((r) => r - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resto, fase]);

  const dopo = (s: number, fn: () => void) => timer.current.push(window.setTimeout(fn, s * 1000));

  const verifica = (codice: string) => {
    if (fase === "verifico" || fase === "giusto") return;
    caselle.current.forEach((c) => c?.blur());
    if (resto > 0 && codiceGiusto(codice, atteso)) {
      // giusto: parte subito la coreografia; il passo viene avvisato quando la casella diventa verde
      setFase("giusto");
      dopo(reduce ? 0.3 : T.verde, () => {
        setTastoVerde(true);
        onGiusto();
      });
      return;
    }
    setFase("verifico");
    dopo(VERIFICA_MS / 1000, () => sbaglia(resto <= 0 ? "Il codice è scaduto: chiedine uno nuovo" : "Codice non corretto, riprova"));
  };

  const sbaglia = (motivo: string) => {
    setFase("errore");
    setErrore(motivo);
    onSbagliato();
    dopo(0.48, () => {
      setCifre(Array(N).fill(""));
      setFase("scrivo");
      caselle.current[0]?.focus();
    });
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
        {/* con la verifica giusta lo spazio si apre per contenere la croce */}
        <motion.div
          className="relative mx-auto mt-[28px]"
          style={{ width: larghezza }}
          initial={false}
          animate={{ height: giusto && !reduce ? ALTO_CROCE : ALTO }}
          transition={{ duration: 0.5, ease: EASE_OUT, delay: giusto ? T.croce : 0 }}
        >
          {/* alone verde che tinge il riquadro a verifica fatta */}
          <AnimatePresence>
            {giusto && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 size-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: `radial-gradient(closest-side, ${verde(16)}, ${verde(7)} 45%, transparent 100%)` }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, ease: EASE_OUT, delay: reduce ? 0 : T.verde }}
              />
            )}
          </AnimatePresence>

          {giusto ? (
            <>
              {!reduce && <Carte cifre={cifre} />}
              <Unica reduce={!!reduce} />
            </>
          ) : (
            <motion.div
              className="flex"
              style={{ gap: SPAZIO }}
              animate={fase === "errore" && !reduce ? { x: [0, -10, 10, -8, 8, -4, 0] } : { x: 0 }}
              transition={{ duration: 0.42 }}
            >
              {cifre.map((c, i) => (
                <div key={i} className="relative">
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
                    className={`block rounded-[14px] border-[1.5px] bg-card text-center text-[26px] font-semibold caret-[var(--trainer)] outline-none transition-[border-color,box-shadow,background-color,color] duration-200 disabled:cursor-default ${
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
                  {fase === "verifico" && !reduce && <Scia ritardo={i * 0.12} />}
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
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </Entra>

      <Entra i={4}>
        <motion.div className="mt-[12px] flex h-[22px] items-center justify-between text-[12.5px]" animate={{ opacity: giusto ? 0 : 1 }} transition={{ duration: 0.3 }}>
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
        <Tasto onClick={() => verifica(cifre.join(""))} spento={!cifre.every(Boolean)} occupato={fermo && !tastoVerde ? "Verifico…" : undefined} verde={tastoVerde}>
          {tastoVerde ? "Email verificata" : "Verifica e continua"}
        </Tasto>
      </Entra>
    </div>
  );
}

// Scia di luce che gira sul bordo di una casella (nel colore del trainer, con la punta chiara).
function Scia({ ritardo = 0, raggio = 14 }: { ritardo?: number; raggio?: number }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-[-1px] overflow-hidden" style={{ ...SOLO_BORDO, borderRadius: raggio + 1 }}>
      <motion.span
        className="absolute inset-[-45%]"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0 58%, color-mix(in srgb, var(--trainer) 35%, transparent) 72%, var(--trainer) 86%, #fff 91%, transparent 93%)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.15, repeat: Infinity, ease: "linear", delay: ritardo }}
      />
    </span>
  );
}

// Le 4 caselle durante la verifica giusta: dalla riga alla croce, un giro intero, poi al centro a fondersi.
function Carte({ cifre }: { cifre: string[] }) {
  const riga = (i: number) => (i - (N - 1) / 2) * (LATO + SPAZIO);
  const tempi = [0, t(T.croce), t(T.croceFatta), t(T.giroFine), t(T.fondi), t(T.unica), 1];
  return (
    <motion.div
      className="absolute left-1/2 top-1/2 size-0"
      // il giro intero della croce (le cifre girano con lei, come nel video)
      initial={{ rotate: 0 }}
      animate={{ rotate: [0, 0, 360, 360] }}
      transition={{ duration: DURATA_CARTE, times: [0, t(T.croceFatta), t(T.giroFine), 1], ease: ["linear", [0.65, 0, 0.35, 1], "linear"] }}
    >
      {cifre.map((c, i) => {
        const [cx, cy] = CROCE[i];
        const [sx, sy] = SFALSA[i];
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ width: LATO, height: ALTO, left: -LATO / 2, top: -ALTO / 2, zIndex: i === 0 ? 4 : 4 - i }}
            initial={{ x: riga(i), y: 0, scale: 1, opacity: 1 }}
            animate={{
              x: [riga(i), riga(i), cx, cx, sx, 0, 0],
              y: [0, 0, cy, cy, sy, 0, 0],
              scale: [1, 1, SCALA_CROCE, SCALA_CROCE, SCALA_CROCE, SCALA_CROCE, SCALA_CROCE],
              opacity: [1, 1, 1, 1, 1, 1, 0],
            }}
            transition={{ duration: DURATA_CARTE, times: tempi, ease: [EASE_OUT, [0.5, 0, 0.2, 1], "linear", [0.55, 0, 0.6, 1], EASE_OUT, "linear"] }}
          >
            <div className="relative grid size-full place-items-center rounded-[14px] border-[1.5px] border-[color-mix(in_srgb,var(--trainer)_40%,var(--color-line))] bg-card shadow-[0_10px_24px_-14px_color-mix(in_srgb,var(--trainer)_70%,transparent)]">
              <motion.span
                className="text-[26px] font-semibold text-ink"
                animate={{ opacity: [1, 1, 0] }}
                transition={{ duration: T.fondi, times: [0, (T.giroFine + 0.1) / T.fondi, 1] }}
              >
                {c}
              </motion.span>
              <Scia ritardo={i * 0.1} />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// La casella che resta: si accende, diventa verde con la spunta; intorno l'anello che si allarga e i puntini.
function Unica({ reduce }: { reduce: boolean }) {
  const L = Math.round(ALTO * SCALA_CROCE); // quadrata, grande come le caselle della croce
  const da = (s: number) => (reduce ? 0 : s); // con "riduci movimento" tutto subito, solo dissolvenze
  const PUNTINI = 8;
  return (
    <div className="absolute left-1/2 top-1/2 size-0">
      {/* anello verde: compare sottile, si allarga brillando e svanisce */}
      {!reduce && (
        <motion.span
          aria-hidden
          className="absolute rounded-full border-2"
          style={{ width: L, height: L, left: -L / 2, top: -L / 2, borderColor: VERDE, boxShadow: `0 0 18px ${verde(55)}, inset 0 0 14px ${verde(30)}` }}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: [1.3, 1.55, 2.35, 3.3], opacity: [0, 0.75, 1, 0] }}
          transition={{ duration: T.fine + 0.15 - T.accende, times: [0, 0.18, 0.45, 1], ease: "easeOut", delay: T.accende }}
        />
      )}

      {/* corona di puntini intorno alla casella */}
      {!reduce &&
        Array.from({ length: PUNTINI }, (_, k) => {
          const a = (k / PUNTINI) * Math.PI * 2;
          return (
            <motion.span
              key={k}
              aria-hidden
              className="absolute size-[4px] rounded-full"
              style={{ left: -2, top: -2, background: VERDE, boxShadow: `0 0 6px ${verde(80)}` }}
              initial={{ x: Math.cos(a) * L * 0.85, y: Math.sin(a) * L * 0.85, opacity: 0 }}
              animate={{ x: Math.cos(a) * L * 1.25, y: Math.sin(a) * L * 1.25, opacity: [0, 1, 0] }}
              transition={{ duration: 0.55, ease: "easeOut", delay: T.verde + (k % 2) * 0.04 }}
            />
          );
        })}

      {/* la casella */}
      <motion.span
        className="absolute grid place-items-center rounded-[14px] bg-card"
        style={{ width: L, height: L, left: -L / 2, top: -L / 2, borderStyle: "solid" }}
        initial={{ opacity: 0, scale: 1, borderWidth: 1.5, borderColor: "color-mix(in srgb, var(--trainer) 40%, var(--color-line))", boxShadow: "0 0 0 rgba(0,0,0,0)" }}
        animate={
          reduce
            ? { opacity: 1, borderWidth: 2, borderColor: VERDE, boxShadow: `0 0 22px ${verde(45)}` }
            : {
                opacity: [0, 1, 1, 1, 1],
                scale: [1, 1, 1.1, 1.04, 1],
                borderWidth: [1.5, 1.5, 2.5, 2, 2],
                borderColor: [
                  "color-mix(in srgb, var(--trainer) 40%, var(--color-line))",
                  "color-mix(in srgb, var(--trainer) 55%, var(--color-line))",
                  "var(--trainer)",
                  VERDE,
                  VERDE,
                ],
                boxShadow: [
                  "0 0 0 rgba(0,0,0,0)",
                  "0 0 0 rgba(0,0,0,0)",
                  "0 0 22px color-mix(in srgb, var(--trainer) 55%, transparent)",
                  `0 0 26px ${verde(60)}`,
                  `0 0 20px ${verde(45)}`,
                ],
              }
        }
        transition={{ duration: T.fine - T.fondi, times: [0, t2(T.unica), t2(T.accende), t2(T.verde), 1], ease: "easeOut", delay: da(T.fondi) }}
      >
        {/* puntino al centro, da cui nasce la spunta */}
        {!reduce && (
          <motion.span
            aria-hidden
            className="absolute size-[4px] rounded-full"
            style={{ background: VERDE }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: T.spunta + 0.1 - T.verde, times: [0, 0.2, 0.75, 1], delay: T.verde }}
          />
        )}
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden>
          <motion.path
            d="M5.5 12.5l4.2 4.2L18.5 8"
            fill="none"
            stroke={VERDE}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ pathLength: { duration: 0.3, ease: "easeOut", delay: da(T.spunta) }, opacity: { duration: 0.01, delay: da(T.spunta) } }}
          />
        </svg>
      </motion.span>
    </div>
  );
}

// istante → frazione dell'animazione della casella unica (che parte a T.fondi)
function t2(s: number) {
  return (s - T.fondi) / (T.fine - T.fondi);
}
