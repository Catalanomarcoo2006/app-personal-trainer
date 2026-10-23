"use client";

import { useEffect, useRef, useState } from "react";
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

// IMMAGINI APP/VIDEO CASETTA.mp4 pulito (IMMAGINI APP/pulisci-casa.py): fondo al bianco esatto, ombre e fumo sfumati
// verso il bianco vicino ai bordi, risoluzione piena (960 × 720). Si vede su fondo bianco senza bordi né ritagli.
const CASA = "/prototipo/coach/casa.mp4";
const CASA_FINE = "/prototipo/coach/casa-fine.webp"; // ultimo fotogramma
// momenti del video (dura 9,6 s): Leo esce dalla porta, si appoggia alla casa, sorride in piedi
const ESCE_S = 3.0;
const APPOGGIATO_S = 5.2;
const SORRIDE_S = 8.2;
// la casa e Leo stanno un po' a sinistra nel fotogramma: il video si sposta per centrarli
const LARGO = 392;
const SPOSTA = Math.round(LARGO / 2 - (426 / 960) * LARGO);
// i bordi del video sfumano nel trasparente: anche il grigio di un livello che la compressione lascia sulle prime
// colonne non può disegnare una riga sul bianco della pagina
const BORDI_SFUMATI = {
  WebkitMaskImage: "linear-gradient(90deg, transparent 0, #000 18px, #000 calc(100% - 18px), transparent 100%), linear-gradient(180deg, transparent 0, #000 12px, #000 calc(100% - 12px), transparent 100%)",
  WebkitMaskComposite: "source-in",
  maskImage: "linear-gradient(90deg, transparent 0, #000 18px, #000 calc(100% - 18px), transparent 100%), linear-gradient(180deg, transparent 0, #000 12px, #000 calc(100% - 12px), transparent 100%)",
  maskComposite: "intersect",
} as const;

type Fase = "password" | "codice" | "sveglia";

export function Accesso({ avanti }: PropsPasso) {
  const [fase, setFase] = useState<Fase>(() => (benvenutoAttuale().verificato ? "sveglia" : "password"));
  const [subito] = useState(() => benvenutoAttuale().verificato); // ricaricando dopo la verifica: niente video, Leo è già fuori
  const [codice, setCodice] = useState("");
  const [verificata, setVerificata] = useState(false);
  const scena = useScena();
  const timer = useRef<number | undefined>(undefined);

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
    fetch(CASA).catch(() => {});
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
        {fase === "sveglia" && <Sveglia subito={subito} avanti={avanti} />}
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

// La sveglia: la casetta con Leo che dorme, si sveglia ed esce. La casetta resta ferma al suo posto e sotto lo
// spazio è già riservato: quando Leo esce compare il saluto parola per parola, quando si appoggia alla casa
// il testo, quando sorride il tasto "Iniziamo". I tempi seguono il video stesso (timeupdate), non dei timer.
function Sveglia({ subito, avanti }: { subito: boolean; avanti: () => void }) {
  const reduce = useReducedMotion();
  const fermo = subito || !!reduce;
  const [partito, setPartito] = useState(false);
  // 0 = ancora dentro casa, 1 = è uscito (saluto), 2 = appoggiato (testo), 3 = sorride ("Iniziamo")
  const [momento, setMomento] = useState(fermo ? 3 : 0);
  const ultimo = useRef(momento);
  const avanza = (m: number) => {
    if (m <= ultimo.current) return;
    ultimo.current = m;
    if (m === 3) playSound("confirm");
    setMomento(m);
  };

  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        className="relative -mt-[24px] overflow-hidden rounded-[22px] bg-white"
        style={{ width: LARGO, height: Math.round((LARGO * 720) / 960) }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: partito || fermo ? 1 : 0, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
      >
        {fermo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={CASA_FINE} alt="Leo accanto alla sua casetta" className="absolute top-0 h-full max-w-none select-none" style={{ left: SPOSTA, width: LARGO, ...BORDI_SFUMATI }} draggable={false} />
        ) : (
          <video
            src={CASA}
            muted
            playsInline
            autoPlay
            preload="auto"
            disablePictureInPicture
            aria-label="Leo si sveglia ed esce dalla sua casetta"
            className="absolute top-0 h-full max-w-none"
            style={{ left: SPOSTA, width: LARGO, ...BORDI_SFUMATI }}
            onPlaying={() => {
              if (!partito) playSound("open");
              setPartito(true);
            }}
            onTimeUpdate={(e) => {
              const t = e.currentTarget.currentTime;
              avanza(t >= SORRIDE_S ? 3 : t >= APPOGGIATO_S ? 2 : t >= ESCE_S ? 1 : 0);
            }}
            onEnded={() => avanza(3)}
            onError={() => {
              setPartito(true);
              avanza(3);
            }}
          />
        )}
      </motion.div>

      {/* spazio riservato: i testi compaiono senza spostare la casetta */}
      <div className="mt-[14px] flex min-h-[186px] w-full flex-col items-center">
        <Saluto testo={`Ciao ${NOME}, eccomi!`} visibile={momento >= 1} />
        <motion.p
          className="mx-auto mt-[10px] max-w-[340px] text-[14.5px] leading-[1.5] text-muted"
          initial={false}
          animate={momento >= 2 ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 8, filter: "blur(4px)" }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          Sono Leo, il tuo assistente. Ti accompagno nei primi passi: in 2 minuti la tua app è pronta.
        </motion.p>
        <div className="mt-[22px] h-[48px] w-full">
          <AnimatePresence>
            {momento >= 3 && (
              <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 320, damping: 24 }}>
                <Tasto
                  onClick={() => {
                    playSound("confirm");
                    avanti();
                  }}
                >
                  Iniziamo
                </Tasto>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Il saluto compare parola per parola, ognuna che sale e si mette a fuoco.
function Saluto({ testo, visibile }: { testo: string; visibile: boolean }) {
  const parole = testo.split(" ");
  return (
    <h1 className="text-[30px] font-bold leading-[1.15] tracking-[-0.02em]" aria-label={testo}>
      {parole.map((p, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block whitespace-pre"
          initial={false}
          animate={visibile ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 10, filter: "blur(6px)" }}
          transition={{ duration: 0.45, ease: EASE_OUT, delay: visibile ? i * 0.11 : 0 }}
        >
          {p}
          {i < parole.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </h1>
  );
}
