"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FileSignature, Server, ShieldCheck, X } from "lucide-react";
import { EASE_OUT } from "@/components/ui/motion";
import { playSound } from "@/libs/ui/sound";
import { aggiornaBenvenuto, useBenvenuto } from "@/libs/prototipo/benvenuto";
import type { PropsPasso } from "../Benvenuto";
import { useScena } from "../scena";
import { Entra, Tasto, TestaPasso } from "../ui";

// Passo 3 del benvenuto: privacy e accordi (obbligatorio). Tre schede in parole semplici, i termini in un foglio
// laterale, una casella da spuntare. La casella spunta anche il consenso sul telefono della vetrina (useScena).

const SCHEDE = [
  { Icona: ShieldCheck, titolo: "I dati dei tuoi clienti sono tuoi", testo: "Sei il titolare del trattamento: decidi tu cosa raccogliere e perché." },
  { Icona: FileSignature, titolo: "Noi li custodiamo per te", testo: "Con un accordo scritto sul trattamento dei dati (DPA), firmato una volta sola." },
  { Icona: Server, titolo: "Server in Unione Europea", testo: "I dati sulla salute restano in UE, protetti e mai venduti a nessuno." },
];

// Testo segnaposto: la versione vera la scrive un professionista (PROGRESS, problemi noti).
const TERMINI = [
  "Tu sei il titolare del trattamento dei dati dei tuoi clienti; noi siamo il responsabile e li trattiamo solo per conto tuo.",
  "Raccogliamo solo quello che serve al percorso: allenamenti, misure, foto dei progressi, messaggi.",
  "I dati stanno su server in Unione Europea, cifrati durante il trasferimento e a riposo.",
  "Ogni cliente dà il suo consenso esplicito prima di inserire dati sulla salute, e può ritirarlo quando vuole.",
  "Se un cliente chiede di cancellare i suoi dati, li eliminiamo entro 30 giorni.",
  "Alla fine del contratto puoi scaricare tutti i dati; poi vengono cancellati.",
];

export function Accordi({ avanti }: PropsPasso) {
  const b = useBenvenuto();
  const { consenso: accetto, setConsenso } = useScena();
  const [foglio, setFoglio] = useState(false);

  // tornando su questo passo dopo aver accettato, la casella è già spuntata
  useEffect(() => {
    setConsenso(b.accordi !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cambia = () => {
    playSound("tap");
    const si = !accetto;
    setConsenso(si);
    if (!si && b.accordi) aggiornaBenvenuto({ accordi: null });
  };

  return (
    <div>
      <TestaPasso icona={ShieldCheck} titolo="Privacy, in parole semplici" sotto="Tre cose da sapere prima di aggiungere i tuoi clienti." />

      <div className="mt-[22px] space-y-[9px]">
        {SCHEDE.map(({ Icona, titolo, testo }, i) => (
          <Entra key={titolo} i={3 + i}>
            <div className="flex items-start gap-[12px] rounded-[16px] border border-line bg-card px-[14px] py-[12px]">
              <span
                className="grid size-[38px] shrink-0 place-items-center rounded-[12px]"
                style={{ background: "color-mix(in srgb, var(--trainer) 13%, var(--color-card))", color: "var(--trainer)" }}
              >
                <Icona size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-bold leading-[1.3]">{titolo}</span>
                <span className="mt-[2px] block text-[12.5px] leading-[1.45] text-muted">{testo}</span>
              </span>
            </div>
          </Entra>
        ))}
      </div>

      <Entra i={6}>
        <button
          type="button"
          onClick={() => {
            playSound("open");
            setFoglio(true);
          }}
          className="mt-[10px] flex min-h-[40px] cursor-pointer items-center gap-[6px] text-[13px] font-semibold text-[var(--trainer)] hover:underline"
        >
          Leggi termini e accordo
        </button>
      </Entra>

      <Entra i={7}>
        <Casella spuntata={accetto} onCambia={cambia} />
      </Entra>

      <Entra i={8}>
        <div className="mt-[16px]">
          <Tasto
            spento={!accetto}
            onClick={() => {
              playSound("confirm");
              aggiornaBenvenuto({ accordi: { quando: new Date().toISOString() } });
              avanti();
            }}
          >
            Avanti
          </Tasto>
          <p className="mt-[8px] text-center text-[11.5px] text-muted">Serve per poter seguire i dati sulla salute dei tuoi clienti</p>
        </div>
      </Entra>

      <FoglioTermini aperto={foglio} onChiudi={() => setFoglio(false)} />
    </div>
  );
}

// Casella grande (tutta la riga è cliccabile, alta almeno 44 px); la spunta si disegna.
function Casella({ spuntata, onCambia }: { spuntata: boolean; onCambia: () => void }) {
  const reduce = useReducedMotion();
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={spuntata}
      onClick={onCambia}
      className="mt-[6px] flex min-h-[44px] w-full cursor-pointer items-start gap-[11px] rounded-[14px] border px-[13px] py-[11px] text-left transition-[border-color,background-color,box-shadow] duration-300"
      style={{
        borderColor: spuntata ? "var(--trainer)" : "var(--color-line)",
        background: spuntata ? "color-mix(in srgb, var(--trainer) 6%, var(--color-card))" : "var(--color-card)",
        boxShadow: spuntata ? "0 0 0 4px color-mix(in srgb, var(--trainer) 12%, transparent)" : "none",
      }}
    >
      <motion.span
        className="mt-[1px] grid size-[22px] shrink-0 place-items-center rounded-[7px] border-[1.5px] transition-colors duration-200"
        style={{ borderColor: spuntata ? "var(--trainer)" : "var(--color-line)", background: spuntata ? "var(--trainer)" : "transparent" }}
        animate={{ scale: spuntata && !reduce ? [1, 0.86, 1.06, 1] : 1 }}
        transition={{ duration: 0.35, ease: EASE_OUT }}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
          <motion.path
            d="M2.5 6.8 5.2 9.4 10.6 3.6"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: spuntata ? 1 : 0, opacity: spuntata ? 1 : 0 }}
            transition={{ duration: reduce ? 0 : 0.28, ease: EASE_OUT, delay: spuntata && !reduce ? 0.06 : 0 }}
          />
        </svg>
      </motion.span>
      <span className="text-[13px] leading-[1.45]">
        Ho letto e accetto i <span className="font-semibold">termini di servizio</span> e l&apos;
        <span className="font-semibold">accordo sul trattamento dei dati (DPA)</span>
      </span>
    </button>
  );
}

// Foglio laterale con i termini: velo sopra tutta la pagina, si chiude con il velo, Esc o la ✕.
function FoglioTermini({ aperto, onChiudi }: { aperto: boolean; onChiudi: () => void }) {
  const reduce = useReducedMotion();
  const [montato, setMontato] = useState(false);
  useEffect(() => setMontato(true), []);

  const chiudi = () => {
    playSound("close");
    onChiudi();
  };

  useEffect(() => {
    if (!aperto) return;
    const tasto = (e: KeyboardEvent) => e.key === "Escape" && chiudi();
    window.addEventListener("keydown", tasto);
    return () => window.removeEventListener("keydown", tasto);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aperto]);

  if (!montato) return null;
  return createPortal(
    <AnimatePresence>
      {aperto && (
        <motion.div key="termini" className="fixed inset-0 z-[80]" initial={{ opacity: 1 }} exit={{ opacity: 1 }}>
          <motion.button
            type="button"
            aria-label="Chiudi"
            onClick={chiudi}
            className="absolute inset-0 cursor-default bg-[#16161a]/30 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="termini-titolo"
            className="absolute inset-y-[12px] right-[12px] flex w-[min(440px,calc(100vw-24px))] flex-col overflow-hidden rounded-[24px] bg-card shadow-[0_30px_80px_-30px_rgba(0,0,0,0.5)]"
            initial={{ x: reduce ? 0 : "104%", opacity: reduce ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: reduce ? 0 : "104%", opacity: reduce ? 0 : 1 }}
            transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 320, damping: 34 }}
          >
            <div className="flex items-start justify-between gap-[12px] border-b border-line px-[22px] pb-[16px] pt-[20px]">
              <div>
                <span className="inline-block rounded-full bg-soft px-[9px] py-[3px] text-[11px] font-semibold text-muted">Bozza da far rivedere a un professionista</span>
                <h2 id="termini-titolo" className="mt-[10px] text-[20px] font-bold tracking-[-0.01em]">
                  Termini di servizio e DPA
                </h2>
              </div>
              <button
                type="button"
                onClick={chiudi}
                aria-label="Chiudi"
                className="grid size-[40px] shrink-0 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-soft hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>
            <ol className="flex-1 space-y-[14px] overflow-y-auto px-[22px] py-[18px]">
              {TERMINI.map((t, i) => (
                <motion.li
                  key={i}
                  className="flex gap-[12px] text-[13.5px] leading-[1.55]"
                  initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: EASE_OUT, delay: reduce ? 0 : 0.12 + i * 0.04 }}
                >
                  <span
                    className="grid size-[24px] shrink-0 place-items-center rounded-full text-[11.5px] font-bold"
                    style={{ background: "color-mix(in srgb, var(--trainer) 13%, var(--color-card))", color: "var(--trainer)" }}
                  >
                    {i + 1}
                  </span>
                  <span>{t}</span>
                </motion.li>
              ))}
            </ol>
            <div className="border-t border-line px-[22px] py-[14px]">
              <Tasto onClick={chiudi}>Ho capito</Tasto>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
