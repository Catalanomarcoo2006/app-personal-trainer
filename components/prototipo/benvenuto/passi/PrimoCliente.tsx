"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Copy, Link2, Sparkles, UserPlus } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound, suonoNotifica } from "@/libs/ui/sound";
import { aggiornaBenvenuto, emailValida, linkApp, useBenvenuto, useNomeTrainer } from "@/libs/prototipo/benvenuto";
import type { PropsPasso } from "../Benvenuto";
import { useScena } from "../scena";
import { CLASSE_CAMPO, Campo, Entra, Tasto, TastoTesto, TestaPasso } from "../ui";

// Passo 4 del benvenuto: il primo cliente (si può saltare). Nome ed email, oppure il cliente di esempio che si
// scrive da solo; poi il link dell'app e "Invia invito" (finto). Il telefono della vetrina mostra l'invito che
// riceve il cliente, con il nome che cambia mentre si scrive (useScena().invito).

const ESEMPIO = { nome: "Giulia Bianchi", email: "giulia@esempio.it" };

export function PrimoCliente({ avanti }: PropsPasso) {
  const reduce = useReducedMotion();
  const b = useBenvenuto();
  const { setInvito } = useScena();
  const [nome, setNome] = useState(b.primoCliente?.nome ?? "");
  const [email, setEmail] = useState(b.primoCliente?.email ?? "");
  const [esempio, setEsempio] = useState(b.primoCliente?.esempio ?? false);
  const [inviato, setInviato] = useState(b.primoCliente !== null);
  const [fase, setFase] = useState<"libero" | "invio" | "fatto">("libero");
  const [scrive, setScrive] = useState(false); // il cliente di esempio si sta scrivendo da solo
  const timer = useRef<number[]>([]);

  const pronto = nome.trim() !== "" && emailValida(email);
  const primoNome = nome.trim().split(/\s+/)[0] ?? "";

  useEffect(() => setInvito({ nome: nome.trim(), inviato }), [nome, inviato, setInvito]);
  useEffect(() => () => timer.current.forEach(clearTimeout), []);

  // Toccando i campi dopo l'invio l'invito va rifatto.
  const cambia = (n: string, e: string) => {
    setNome(n);
    setEmail(e);
    setEsempio(false);
    if (inviato) {
      setInviato(false);
      aggiornaBenvenuto({ primoCliente: null });
    }
  };

  // Il cliente di esempio si scrive lettera per lettera, prima il nome poi l'email.
  const provaEsempio = () => {
    if (scrive) return;
    playSound("tap");
    timer.current.forEach(clearTimeout);
    setInviato(false);
    aggiornaBenvenuto({ primoCliente: null });
    if (reduce) {
      setNome(ESEMPIO.nome);
      setEmail(ESEMPIO.email);
      setEsempio(true);
      return;
    }
    setScrive(true);
    setNome("");
    setEmail("");
    const passo = 38;
    const lettere = [...ESEMPIO.nome].map((_, i) => () => setNome(ESEMPIO.nome.slice(0, i + 1)));
    const pausa = lettere.length * passo + 160;
    const chiocciole = [...ESEMPIO.email].map((_, i) => () => setEmail(ESEMPIO.email.slice(0, i + 1)));
    timer.current = [
      ...lettere.map((f, i) => window.setTimeout(f, i * passo)),
      ...chiocciole.map((f, i) => window.setTimeout(f, pausa + i * (passo - 10))),
      window.setTimeout(() => {
        setEsempio(true);
        setScrive(false);
      }, pausa + chiocciole.length * (passo - 10)),
    ];
  };

  const invia = () => {
    if (!pronto || fase !== "libero") return;
    playSound("confirm");
    setFase("invio");
    timer.current.push(
      window.setTimeout(() => {
        aggiornaBenvenuto({ primoCliente: { nome: nome.trim(), email: email.trim(), esempio } });
        setInviato(true);
        setFase("fatto");
        suonoNotifica();
      }, 950),
      window.setTimeout(() => setFase("libero"), 950 + 1300),
    );
  };

  return (
    <div>
      <TestaPasso icona={UserPlus} titolo="Il tuo primo cliente" sotto="Invitalo adesso: riceverà l'app con il tuo marchio. Puoi farlo anche dopo." />

      <div className="mt-[22px] space-y-[14px]">
        <Entra i={3}>
          <Campo etichetta="Nome e cognome">
            <input
              value={nome}
              onChange={(e) => cambia(e.target.value, email)}
              placeholder="Es. Giulia Bianchi"
              autoComplete="off"
              readOnly={scrive}
              className={CLASSE_CAMPO}
            />
          </Campo>
        </Entra>
        <Entra i={4}>
          <Campo
            etichetta="Email"
            destra={
              email.trim() !== "" && !scrive && !emailValida(email) ? <span className="text-[11.5px] font-medium text-muted">Manca qualcosa</span> : undefined
            }
          >
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => cambia(nome, e.target.value)}
              placeholder="nome@email.it"
              autoComplete="off"
              readOnly={scrive}
              className={CLASSE_CAMPO}
            />
          </Campo>
        </Entra>
        <Entra i={5}>
          <button
            type="button"
            onClick={provaEsempio}
            disabled={scrive}
            className="flex min-h-[40px] cursor-pointer items-center gap-[7px] text-[13px] font-semibold text-[var(--trainer)] hover:underline disabled:cursor-wait"
          >
            <Sparkles size={15} /> Prova con un cliente di esempio
          </button>
        </Entra>
      </div>

      {/* il link compare quando nome ed email sono a posto */}
      <AnimatePresence initial={false}>
        {pronto && !scrive && (
          <motion.div
            key="link"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.38, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <LinkApp />
          </motion.div>
        )}
      </AnimatePresence>

      <Entra i={6}>
        <div className="mt-[16px] flex flex-col items-center gap-[4px]">
          {inviato && fase === "libero" ? (
            <Tasto
              onClick={() => {
                playSound("confirm");
                avanti();
              }}
            >
              Avanti
            </Tasto>
          ) : (
            <Tasto spento={!pronto || scrive} occupato={fase === "invio" ? "Preparo l'invito…" : undefined} verde={fase === "fatto"} onClick={invia}>
              {fase === "fatto" ? "Invito pronto!" : primoNome && pronto ? `Invia l'invito a ${primoNome}` : "Invia l'invito"}
            </Tasto>
          )}

          <AnimatePresence initial={false}>
            {inviato && (
              <motion.p
                key="pronto"
                initial={{ opacity: 0, y: reduce ? 0 : 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE_OUT }}
                className="mt-[6px] text-center text-[12px] leading-[1.45] text-muted"
              >
                Invito pronto! Nel prodotto vero parte un&apos;email a <span className="font-semibold text-ink">{email.trim()}</span>.
              </motion.p>
            )}
          </AnimatePresence>

          {!inviato && <TastoTesto onClick={avanti}>Salta, lo aggiungo dopo</TastoTesto>}
        </div>
      </Entra>
    </div>
  );
}

// Il link dell'app del trainer, da copiare e mandare anche su WhatsApp.
function LinkApp() {
  const link = linkApp(useNomeTrainer());
  const reduce = useReducedMotion();
  const [copiato, setCopiato] = useState(false);
  const via = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(via.current), []);

  const copia = async () => {
    playSound("tap");
    try {
      await navigator.clipboard.writeText(`https://${link}`);
    } catch {
      // senza permesso per gli appunti: il link resta comunque visibile
    }
    setCopiato(true);
    clearTimeout(via.current);
    via.current = window.setTimeout(() => setCopiato(false), 1600);
  };

  return (
    <div className="mt-[14px] flex items-center gap-[11px] rounded-[14px] border border-line bg-soft/60 py-[8px] pl-[12px] pr-[8px]">
      <span
        className="grid size-[34px] shrink-0 place-items-center rounded-[10px]"
        style={{ background: "color-mix(in srgb, var(--trainer) 13%, var(--color-card))", color: "var(--trainer)" }}
      >
        <Link2 size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold text-muted">Il link della tua app</span>
        <span className="block truncate text-[13.5px] font-semibold">{link}</span>
      </span>
      <button
        type="button"
        onClick={copia}
        className="relative flex h-[36px] min-w-[92px] cursor-pointer items-center justify-center gap-[6px] overflow-hidden rounded-[10px] border border-line bg-card px-[12px] text-[12.5px] font-semibold transition-colors hover:border-[var(--trainer)]"
        style={{ color: copiato ? "var(--color-ok)" : undefined }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={copiato ? "si" : "no"}
            className="flex items-center gap-[6px]"
            initial={{ y: reduce ? 0 : 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: reduce ? 0 : -14, opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
          >
            {copiato ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
            {copiato ? "Copiato!" : "Copia"}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  );
}
