"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Eye, EyeOff, Lock } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { trainer } from "@/libs/prototipo/dati-finti";
import { aggiornaBenvenuto, benvenutoAttuale, nuovoCodice, passwordValida, regolePassword } from "@/libs/prototipo/benvenuto";
import type { PropsPasso } from "../Benvenuto";
import { usePallina } from "../Pallina";
import { useScena } from "../scena";
import { CodiceOtp } from "../CodiceOtp";
import { CLASSE_CAMPO, Campo, Entra, Tasto, TestaPasso } from "../ui";

// Passo 1: il trainer arriva dall'email d'invito, sceglie la password e conferma l'email con un codice.
// Poi Leo esce dalla pallina e lo saluta (fase "saluto").

const EMAIL = "marco.rossi@esempio.it";
const NOME = trainer.name.split(" ")[0];
const SCADENZA = 60;

type Fase = "password" | "codice" | "saluto";

export function Accesso({ avanti }: PropsPasso) {
  const [fase, setFase] = useState<Fase>(() => (benvenutoAttuale().verificato ? "saluto" : "password"));
  const [codice, setCodice] = useState("");
  const [verificata, setVerificata] = useState(false);
  const pallina = usePallina();
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
    pallina.mostra({ dove: "modulo", scritta: "Inserisci il codice" });
  };

  const tornaAllaPassword = () => {
    window.clearTimeout(timer.current);
    scena.setEmail(null);
    setFase("password");
    pallina.mostra({ dove: "vetrina" });
  };

  const giusto = () => {
    playSound("complete");
    setVerificata(true);
    pallina.mostra({ dove: "modulo", umore: "contento" });
    aggiornaBenvenuto({ verificato: true });
    timer.current = window.setTimeout(() => {
      scena.setEmail(null);
      setFase("saluto");
    }, 1500);
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={fase} exit={{ opacity: 0, filter: "blur(4px)", y: -6 }} transition={{ duration: 0.2, ease: EASE_OUT }}>
        {fase === "password" && <Password onFatto={vaiAlCodice} />}
        {fase === "codice" && (
          <div>
            {/* verificata: come nel riferimento, titolo e testo sfumano e resta il quadrato verde */}
            <motion.div animate={verificata ? { opacity: 0.25, filter: "blur(2px)" } : { opacity: 1, filter: "blur(0px)" }} transition={{ duration: 0.5 }}>
              <TestaPasso
                titolo="Controlla la tua email"
                sotto={
                  <>
                    Ti abbiamo mandato un codice di 6 cifre a <b className="font-semibold text-ink">{EMAIL}</b>. Scrivilo qui sotto per continuare.
                  </>
                }
              />
            </motion.div>
            <CodiceOtp key={codice} atteso={codice} scadenza={SCADENZA} onGiusto={giusto} onSbagliato={() => pallina.umore("no")} onRimanda={mandaCodice} />
            <Entra i={6}>
              <p className="mt-[18px] text-center text-[12.5px] text-muted">
                Email sbagliata?{" "}
                <button type="button" onClick={tornaAllaPassword} className="min-h-[36px] cursor-pointer font-semibold text-[var(--trainer)] hover:underline">
                  Torna indietro
                </button>
              </p>
            </Entra>
          </div>
        )}
        {fase === "saluto" && <Saluto avanti={avanti} />}
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
  const pallina = usePallina();

  useEffect(() => {
    pallina.mostra({ dove: "vetrina" });
  }, [pallina]);

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

function Saluto({ avanti }: { avanti: () => void }) {
  return (
    <div>
      <TestaPasso titolo={`Benvenuto, ${NOME}!`} sotto="Sono Leo, il tuo assistente. In 2 minuti prepariamo insieme l'app che riceveranno i tuoi clienti." />
      <Entra i={3} className="mt-[28px]">
        <Tasto
          onClick={() => {
            playSound("confirm");
            avanti();
          }}
        >
          Iniziamo
        </Tasto>
      </Entra>
    </div>
  );
}
