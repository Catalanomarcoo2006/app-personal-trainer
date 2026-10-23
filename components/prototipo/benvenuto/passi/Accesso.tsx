"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Eye, EyeOff, Lock } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { trainer } from "@/libs/prototipo/dati-finti";
import { aggiornaBenvenuto, benvenutoAttuale, CIFRE_CODICE, nuovoCodice, passwordValida, regolePassword } from "@/libs/prototipo/benvenuto";
import type { PropsPasso } from "../Benvenuto";
import { useScena } from "../scena";
import { CodiceOtp } from "../CodiceOtp";
import { CLASSE_CAMPO, Campo, Entra, Tasto, TestaPasso } from "../ui";

// Passo 1: il trainer arriva dall'email d'invito, sceglie la password e conferma l'email con un codice.
// Poi la sveglia: compare la casetta di Leo e parte il video (Leo dorme, si sveglia ed esce), sotto una frase
// che si scrive lettera per lettera; a fine video la frase lascia il posto al pannello "Iniziamo".

const EMAIL = "marco.rossi@esempio.it";
const NOME = trainer.name.split(" ")[0];
const SCADENZA = 60;

const CASA = "/prototipo/coach/casa.webp"; // IMMAGINI APP/VIDEO CASETTA.mp4 senza sfondo, 192 fotogrammi a 20 al secondo
const CASA_FERMA = "/prototipo/coach/casa-fermo.webp"; // ultimo fotogramma
const PRONTO_MS = 8700; // Leo sorride in piedi (il video dura 9,6 s): si passa al pannello "Iniziamo"
const FRASE = "Shhh… l'abbiamo svegliato! 😴";

type Fase = "password" | "codice" | "sveglia";

export function Accesso({ avanti }: PropsPasso) {
  const [fase, setFase] = useState<Fase>(() => (benvenutoAttuale().verificato ? "sveglia" : "password"));
  const [subito] = useState(() => benvenutoAttuale().verificato); // ricaricando dopo la verifica: niente video, Leo è già fuori
  const [codice, setCodice] = useState("");
  const [verificata, setVerificata] = useState(false);
  const scena = useScena();
  const timer = useRef<number | undefined>(undefined);
  // indirizzo nuovo a ogni visita: la WebP animata riparte dal primo fotogramma
  const casa = useMemo(() => `${CASA}?t=${Date.now()}`, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const mandaCodice = () => {
    const nuovo = nuovoCodice();
    setCodice(nuovo);
    scena.setEmail(null);
    window.clearTimeout(timer.current);
    // l'email "arriva" un attimo dopo, come quella vera
    timer.current = window.setTimeout(() => {
      scena.setEmail(nuovo);
      playSound("open");
    }, 1200);
  };

  const vaiAlCodice = () => {
    mandaCodice();
    setFase("codice");
    // la casetta si scarica mentre il trainer legge il codice, così dopo la verifica parte senza attese
    fetch(casa).catch(() => {});
  };

  const tornaAllaPassword = () => {
    window.clearTimeout(timer.current);
    scena.setEmail(null);
    setFase("password");
  };

  const giusto = () => {
    playSound("complete");
    setVerificata(true);
    aggiornaBenvenuto({ verificato: true });
    timer.current = window.setTimeout(() => {
      scena.setEmail(null);
      setFase("sveglia");
    }, 1900);
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={fase} exit={{ opacity: 0, filter: "blur(4px)", y: -6 }} transition={{ duration: 0.22, ease: EASE_OUT }}>
        {fase === "password" && <Password onFatto={vaiAlCodice} />}
        {fase === "codice" && (
          <div>
            {/* verificata: come nel riferimento titolo e testo sfumano, e il titolo diventa "Ci sei!" */}
            <motion.div animate={verificata ? { opacity: 0.28, filter: "blur(1.5px)" } : { opacity: 1, filter: "blur(0px)" }} transition={{ duration: 0.5, delay: verificata ? 0.55 : 0 }}>
              <TestaPasso
                titolo={verificata ? "Ci sei!" : "Controlla la tua email"}
                sotto={
                  <>
                    Ti abbiamo mandato un codice di {CIFRE_CODICE} cifre a <b className="font-semibold text-ink">{EMAIL}</b>. Scrivilo qui sotto per continuare.
                  </>
                }
              />
            </motion.div>
            <CodiceOtp key={codice} atteso={codice} scadenza={SCADENZA} onGiusto={giusto} onSbagliato={() => {}} onRimanda={mandaCodice} />
            <Entra i={6}>
              <motion.p className="mt-[18px] text-center text-[12.5px] text-muted" animate={{ opacity: verificata ? 0 : 1 }} transition={{ duration: 0.3 }}>
                Email sbagliata?{" "}
                <button type="button" onClick={tornaAllaPassword} className="min-h-[36px] cursor-pointer font-semibold text-[var(--trainer)] hover:underline">
                  Torna indietro
                </button>
              </motion.p>
            </Entra>
          </div>
        )}
        {fase === "sveglia" && <Sveglia casa={casa} subito={subito} avanti={avanti} />}
      </motion.div>
    </AnimatePresence>
  );
}

function Password({ onFatto }: { onFatto: () => void }) {
  const [password, setPassword] = useState("");
  const [vedi, setVedi] = useState(false);
  const [invio, setInvio] = useState(false);
  const regole = regolePassword(password);
  const valida = passwordValida(password);

  const continua = () => {
    if (!valida || invio) return;
    setInvio(true);
    window.setTimeout(onFatto, 900);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        continua();
      }}
    >
      <TestaPasso titolo={`Ciao ${NOME}, benvenuto`} sotto="Il tuo account è pronto. Scegli una password per entrare nella tua app." />
      <div className="mt-[26px] flex flex-col gap-[16px]">
        <Entra i={3}>
          <Campo etichetta="La tua email">
            <span className="relative block">
              <input value={EMAIL} readOnly aria-readonly className={`${CLASSE_CAMPO} cursor-default bg-soft text-ink/70`} />
              <Lock size={14} className="absolute right-[14px] top-1/2 -translate-y-1/2 text-muted" />
            </span>
          </Campo>
        </Entra>
        <Entra i={4}>
          <Campo etichetta="Scegli una password">
            <span className="relative block">
              <input
                type={vedi ? "text" : "password"}
                value={password}
                autoFocus
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Almeno 8 caratteri"
                className={`${CLASSE_CAMPO} pr-[46px]`}
              />
              <button
                type="button"
                onClick={() => setVedi((v) => !v)}
                aria-label={vedi ? "Nascondi la password" : "Mostra la password"}
                className="absolute right-[4px] top-1/2 grid size-[40px] -translate-y-1/2 cursor-pointer place-items-center rounded-[9px] text-muted transition-colors hover:text-ink"
              >
                {vedi ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </Campo>
        </Entra>
        <Entra i={5}>
          <ul className="flex flex-wrap gap-x-[14px] gap-y-[6px] text-[12.5px]">
            <Regola ok={regole.lunghezza}>8 caratteri</Regola>
            <Regola ok={regole.lettera}>una lettera</Regola>
            <Regola ok={regole.numero}>un numero</Regola>
          </ul>
        </Entra>
      </div>
      <Entra i={6} className="mt-[26px]">
        <Tasto onClick={continua} spento={!valida} occupato={invio ? "Invio il codice…" : undefined}>
          Continua
        </Tasto>
      </Entra>
      <button type="submit" hidden />
    </form>
  );
}

function Regola({ ok, children }: { ok: boolean; children: string }) {
  return (
    <li className={`flex items-center gap-[6px] transition-colors duration-300 ${ok ? "font-semibold text-ok" : "text-muted"}`}>
      <span className={`grid size-[16px] place-items-center rounded-full transition-colors duration-300 ${ok ? "bg-ok text-white" : "border border-line"}`}>
        <AnimatePresence>
          {ok && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 600, damping: 20 }}>
              <Check size={10} strokeWidth={3.5} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      {children}
    </li>
  );
}

// La sveglia: la casetta con Leo che dorme, si sveglia ed esce. Sotto, un pannello che scrive la frase lettera
// per lettera mentre Leo esce; quando Leo sorride il pannello diventa quello di inizio, con "Iniziamo".
function Sveglia({ casa, subito, avanti }: { casa: string; subito: boolean; avanti: () => void }) {
  const reduce = useReducedMotion();
  const fermo = subito || !!reduce;
  const [partito, setPartito] = useState(false);
  const [pronto, setPronto] = useState(fermo);
  const [lettere, setLettere] = useState(0);
  const caratteri = useMemo(() => Array.from(FRASE), []);

  // il tempo parte quando la casetta è davvero comparsa (immagine caricata)
  useEffect(() => {
    if (!partito || fermo) return;
    const t: number[] = [];
    caratteri.forEach((_, i) => t.push(window.setTimeout(() => setLettere(i + 1), 500 + i * 85)));
    t.push(
      window.setTimeout(() => {
        setPronto(true);
        playSound("confirm");
      }, PRONTO_MS),
    );
    return () => t.forEach(window.clearTimeout);
  }, [partito, fermo, caratteri]);

  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        className="relative -mt-[34px]"
        style={{ width: 380, height: 323 }}
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: partito || fermo ? 1 : 0, scale: partito || fermo ? 1 : 0.94, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fermo ? CASA_FERMA : casa}
          alt="La casetta di Leo"
          className="absolute inset-0 size-full select-none object-contain"
          draggable={false}
          onLoad={() => {
            if (!partito) playSound("open");
            setPartito(true);
          }}
        />
      </motion.div>

      <motion.div layout transition={{ layout: { duration: 0.45, ease: EASE_OUT } }} className="mt-[6px] w-full overflow-hidden rounded-[22px] bg-soft px-[24px] py-[20px]">
        <AnimatePresence mode="wait" initial={false}>
          {!pronto ? (
            <motion.p
              key="sveglia"
              exit={{ opacity: 0, filter: "blur(4px)", y: -6 }}
              transition={{ duration: 0.25 }}
              className="min-h-[34px] text-[22px] font-bold tracking-[-0.015em]"
              aria-label={FRASE}
            >
              {caratteri.slice(0, lettere).join("")}
              <motion.span
                aria-hidden
                className="ml-[2px] inline-block h-[22px] w-[2.5px] translate-y-[3px] rounded-full bg-[var(--trainer)]"
                animate={{ opacity: [1, 1, 0, 0] }}
                transition={{ duration: 0.9, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
              />
            </motion.p>
          ) : (
            <motion.div key="pronto" initial={{ opacity: 0, y: 10, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.45, ease: EASE_OUT }}>
              <h1 className="text-[28px] font-bold leading-[1.15] tracking-[-0.02em]">Benvenuto, {NOME}!</h1>
              <p className="mx-auto mt-[8px] max-w-[330px] text-[14px] leading-[1.5] text-muted">Sono Leo, il tuo assistente. In 2 minuti prepariamo insieme l&apos;app che riceveranno i tuoi clienti.</p>
              <div className="mt-[20px]">
                <Tasto
                  onClick={() => {
                    playSound("confirm");
                    avanti();
                  }}
                >
                  Iniziamo
                </Tasto>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
