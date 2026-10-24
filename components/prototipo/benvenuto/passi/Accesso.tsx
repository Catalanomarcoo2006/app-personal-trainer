"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Eye, EyeOff, KeyRound, Lock, Mail, MailCheck } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound, suonoTonfo } from "@/libs/ui/sound";
import { aggiornaBenvenuto, benvenutoAttuale, CIFRE_CODICE, nuovoCodice, passwordValida, regolePassword, useNomeTrainer } from "@/libs/prototipo/benvenuto";
import type { PropsPasso } from "../Benvenuto";
import { useScena } from "../scena";
import { CodiceOtp } from "../CodiceOtp";
import { CLASSE_CAMPO, Campo, Entra, Tasto, TestaPasso } from "../ui";

// Passo 1: il trainer arriva dall'email d'invito, sceglie la password e conferma l'email con un codice.
// Poi la sveglia: Leo fa uno stacco da terra (video), sotto compare il saluto; quando il bilanciere gli scivola
// e tocca terra, il video sobbalza e sotto il saluto scende il pannello "Iniziamo".

const EMAIL = "marco.rossi@esempio.it";
const SCADENZA = 60;

// IMMAGINI APP/LEO STACCO DA TERRA.mp4 ritagliato a 960 × 720 (primi 8,6 s) e pulito (IMMAGINI APP/pulisci-stacco.py):
// fondo al bianco esatto, ombre sfumate verso il bianco vicino ai bordi. Si vede su fondo bianco senza bordi né ritagli.
const STACCO = "/prototipo/coach/stacco.mp4";
const STACCO_FINE = "/prototipo/coach/stacco-fine.webp"; // ultimo fotogramma
// momenti del video (dura 8,6 s, tempo del video): il saluto compare appena parte, poi il testo; il bilanciere
// tocca terra a 6,5 s. Rivisto il 24/10 (Marco: troppo lungo e troppo tempo senza scritte): le scritte arrivano
// subito e il video corre più veloce, di più mentre Leo sta fermo in piedi col bilanciere (vedi velocita).
const SALUTO_S = 0.3;
const TESTO_S = 1.6;
const TOCCA_S = 6.5;
// velocità del video nei suoi tratti: lo stacco, Leo fermo in piedi, il bilanciere che scivola e cade
function velocita(t: number): number {
  if (t < 3.2) return 1.6;
  if (t < 5.9) return 2.2;
  return 1.3;
}
const LARGO = 392;
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
  const [subito] = useState(() => benvenutoAttuale().verificato); // ricaricando dopo la verifica: niente video, tutto già visibile
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
    // il video si scarica mentre il trainer legge il codice, così dopo la verifica parte senza attese
    fetch(STACCO).catch(() => {});
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
    }, 1800);
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={fase} exit={{ opacity: 0, filter: "blur(4px)", y: -6 }} transition={{ duration: 0.22, ease: EASE_OUT }}>
        {fase === "password" && <Password onFatto={vaiAlCodice} />}
        {fase === "codice" && (
          <div>
            {/* verificata: come nel video di riferimento il titolo cambia, con la parola chiave in verde */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={verificata ? "fatto" : "codice"} exit={{ opacity: 0, filter: "blur(3px)" }} transition={{ duration: 0.2 }}>
                {verificata ? (
                  <TestaPasso
                    icona={MailCheck}
                    titolo={
                      <>
                        Email <span className="text-ok">verificata</span>
                      </>
                    }
                    sotto="Il codice è giusto: il tuo account è al sicuro."
                  />
                ) : (
                  <TestaPasso
                    icona={Mail}
                    titolo="Controlla la tua email"
                    sotto={
                      <>
                        Ti abbiamo mandato un codice di {CIFRE_CODICE} cifre a <b className="font-semibold text-ink">{EMAIL}</b>. Scrivilo qui sotto per continuare.
                      </>
                    }
                  />
                )}
              </motion.div>
            </AnimatePresence>
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
  const nome = useNomeTrainer().split(" ")[0];
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
      <TestaPasso icona={KeyRound} titolo={`Ciao ${nome}, benvenuto`} sotto="Il tuo account è pronto. Scegli una password per entrare nella tua app." />
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

// La sveglia: Leo fa uno stacco da terra. Il video resta fermo al suo posto e sotto lo spazio è già riservato:
// appena parte compare il saluto parola per parola, poi il testo; quando il bilanciere tocca terra il video
// sobbalza, si sente il tonfo e sotto scende il pannello "Iniziamo". I tempi seguono il video, non dei timer: fotogramma per
// fotogramma (requestVideoFrameCallback) perché il tonfo cada insieme al bilanciere; timeupdate fa da riserva.
function Sveglia({ subito, avanti }: { subito: boolean; avanti: () => void }) {
  const nome = useNomeTrainer().split(" ")[0];
  const reduce = useReducedMotion();
  const fermo = subito || !!reduce;
  const [partito, setPartito] = useState(false);
  // 0 = non ancora partito, 1 = saluto, 2 = testo, 3 = il bilanciere tocca terra ("Iniziamo")
  const [momento, setMomento] = useState(fermo ? 3 : 0);
  const ultimo = useRef(momento);
  const avanza = (m: number) => {
    if (m <= ultimo.current) return;
    ultimo.current = m;
    if (m === 3) suonoTonfo();
    setMomento(m);
  };
  const tonfo = momento >= 3 && !fermo;
  const video = useRef<HTMLVideoElement>(null);
  const daTempo = (t: number) => {
    const v = video.current;
    if (v && v.playbackRate !== velocita(t)) v.playbackRate = velocita(t);
    avanza(t >= TOCCA_S ? 3 : t >= TESTO_S ? 2 : t >= SALUTO_S ? 1 : 0);
  };

  useEffect(() => {
    const v = video.current;
    if (!v || !("requestVideoFrameCallback" in v)) return;
    let id = 0;
    const passo = (_: number, info: { mediaTime: number }) => {
      daTempo(info.mediaTime);
      if (ultimo.current < 3) id = v.requestVideoFrameCallback(passo);
    };
    id = v.requestVideoFrameCallback(passo);
    return () => v.cancelVideoFrameCallback(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        className="relative -mt-[24px] overflow-hidden rounded-[22px] bg-white"
        style={{ width: LARGO, height: Math.round((LARGO * 720) / 960) }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: partito || fermo ? 1 : 0, y: tonfo ? [0, 3, -1.5, 0.5, 0] : 0 }}
        transition={tonfo ? { y: { duration: 0.32, ease: "easeOut" }, opacity: { duration: 0.4 } } : { duration: 0.4, ease: EASE_OUT }}
      >
        {fermo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={STACCO_FINE} alt="Leo accanto al bilanciere" className="absolute inset-0 h-full w-full select-none" style={BORDI_SFUMATI} draggable={false} />
        ) : (
          <video
            ref={video}
            src={STACCO}
            muted
            playsInline
            autoPlay
            preload="auto"
            disablePictureInPicture
            aria-label="Leo fa uno stacco da terra e il bilanciere gli scivola"
            className="absolute inset-0 h-full w-full"
            style={BORDI_SFUMATI}
            onLoadedMetadata={(e) => {
              e.currentTarget.playbackRate = velocita(0);
            }}
            onPlaying={() => {
              if (!partito) playSound("open");
              setPartito(true);
            }}
            onTimeUpdate={(e) => daTempo(e.currentTarget.currentTime)}
            onEnded={() => avanza(3)}
            onError={() => {
              setPartito(true);
              avanza(3);
            }}
          />
        )}
      </motion.div>

      {/* spazio riservato: i pannelli compaiono senza spostare il video */}
      <div className="mt-[14px] flex min-h-[204px] w-full flex-col items-center">
        <Saluto testo={`Ciao ${nome}, eccomi!`} visibile={momento >= 1} />
        <motion.p
          className="mx-auto mt-[10px] max-w-[340px] text-[14.5px] leading-[1.5] text-muted"
          initial={false}
          animate={momento >= 2 ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 8, filter: "blur(4px)" }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          Sono Leo, il tuo assistente. Ti accompagno nei primi passi: in 2 minuti la tua app è pronta.
        </motion.p>
        {/* il secondo pannello scende da sotto il primo, come spinto giù dal bilanciere */}
        <div className="mt-[18px] w-full overflow-hidden pb-[6px]">
          <AnimatePresence>
            {momento >= 3 && (
              <motion.div
                initial={fermo ? false : { opacity: 0, y: -28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 22, mass: 0.9 }}
              >
                <p className="mb-[10px] text-[13px] font-semibold text-ink">Prima cosa: il tuo marchio.</p>
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
