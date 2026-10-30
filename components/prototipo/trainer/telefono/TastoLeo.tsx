"use client";

// La faccia di Leo in basso a destra, nelle app da telefono: trainer (dal 30/10) e cliente (dal 30/10, al posto del
// riquadro "Chiedi a Leo": stesso Leo, stesso gesto).
// Un tocco apre la chat. Tenendola premuta si parla a Leo senza aprire la chat (Marco, 30/10): lasciando, il testo parte
// da solo e sopra la faccia un fumetto dice cosa hai detto e cosa risponde Leo. Nel trainer Leo fa: azioni e conferme
// stanno nel fumetto, il viaggio si vede nell'app (TastoLeoTrainer). Nel cliente risponde (cliente/ClientApp.tsx).
//
// Il microfono è suo (non quello della chat): si parla quando il browser dice che sta ascoltando ("Parla adesso",
// con una vibrazione); lasciando, si ascolta ancora un attimo prima di chiudere, così le ultime parole non si perdono
// (con lo stop immediato la dettatura del telefono spesso restituiva un testo vuoto: "Non ho sentito niente").
// All'apertura dell'app la faccia arriva dall'animazione d'ingresso (cliente/IngressoLeo.tsx): fino ad allora è nascosta.

import { ReactNode, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Clock, Loader2, Mic, X } from "lucide-react";
import { playSound } from "@/libs/ui/sound";
import { ID_FACCIA_LEO, TestaLeo, useFaseIngresso } from "@/components/prototipo/cliente/IngressoLeo";
import { useVoceLeo } from "../MicrofonoLeo";
import type { Chat } from "../leo/useChatLeo";

const TIENI_MS = 300; // da qui un tocco diventa "tieni premuto"
const CODA_MS = 700; // quanto si ascolta ancora dopo aver lasciato
const RESTA_MS = 7000; // il fumetto della risposta sparisce dopo, se non c'è più niente in arrivo o da confermare
const NEON = "conic-gradient(from 0deg, var(--trainer), #ffcf5c, #7cf0d0, #7cc4ff, var(--trainer))";

let consiglioVisto = false;

// Il contenuto del fumetto dopo un comando: lo decide chi usa la faccia. resta: non sparire ancora.
export type RispostaFumetto = { nodo: ReactNode; resta: boolean };

type Fumetto = { tipo: "consiglio" } | { tipo: "errore"; testo: string } | { tipo: "comando"; detto: string; da: number } | null;

export function FacciaLeo({
  occupato,
  quanti,
  chiedi,
  mostra,
  consiglio,
  onApri,
}: {
  occupato: boolean; // Leo sta già rispondendo: tenere premuto non parte
  quanti: number; // messaggi nella chat adesso: la risposta al comando è dopo questi
  chiedi: (testo: string) => void;
  mostra: (da: number, apriChat: () => void) => RispostaFumetto;
  consiglio: ReactNode;
  onApri: () => void;
}) {
  const reduce = useReducedMotion();
  const fase = useFaseIngresso(); // 0 nascosta, 1 contenitore vuoto, 2 con la testa (IngressoLeo)
  const arrivata = fase === 2;
  const [bozza, setBozza] = useState("");
  const [fumetto, setFumetto] = useState<Fumetto>(null);
  const voce = useVoceLeo({
    bloccato: occupato,
    draft: bozza,
    setDraft: setBozza,
    sempreInvia: true,
    invia: (t) => {
      setFumetto({ tipo: "comando", detto: t, da: quanti });
      chiedi(t);
    },
  });
  const timer = useRef(0);
  const [tenuto, setTenuto] = useState(false);
  const [finisco, setFinisco] = useState(false);
  const tenutoRef = useRef(false);
  const ascolta = voce.fase === "in-ascolto";

  // il consiglio compare una volta per scheda del browser, poco dopo che Leo è arrivato al suo posto
  useEffect(() => {
    if (!arrivata || !voce.disponibile || consiglioVisto) return;
    consiglioVisto = true;
    const su = window.setTimeout(() => setFumetto((f) => f ?? { tipo: "consiglio" }), 700);
    const giu = window.setTimeout(() => setFumetto((f) => (f?.tipo === "consiglio" ? null : f)), 6000);
    return () => {
      window.clearTimeout(su);
      window.clearTimeout(giu);
    };
  }, [arrivata, voce.disponibile]);

  // il microfono è davvero acceso: vibrazione, da qui si parla
  useEffect(() => {
    if (ascolta && tenutoRef.current) navigator.vibrate?.(25);
  }, [ascolta]);

  // errori del microfono (permesso, niente voce…) nel fumetto, non in una chat chiusa
  useEffect(() => {
    if (voce.errore) {
      setFinisco(false);
      setFumetto({ tipo: "errore", testo: voce.errore });
    }
  }, [voce.errore]);

  const giu = () => {
    window.clearTimeout(timer.current);
    if (!voce.disponibile || voce.bloccato || finisco) return;
    timer.current = window.setTimeout(() => {
      tenutoRef.current = true;
      setTenuto(true);
      setFumetto(null);
      voce.tasto.onClick(); // inizia
    }, TIENI_MS);
  };
  const su = () => {
    window.clearTimeout(timer.current);
    if (!tenutoRef.current) return;
    tenutoRef.current = false;
    setTenuto(false);
    if (voce.fase !== "in-ascolto") {
      // lasciato mentre il microfono si accendeva: non ha ancora ascoltato niente
      voce.annulla();
      setFumetto({ tipo: "errore", testo: "Tieni premuto finché non vedi “Parla adesso”, poi parla" });
      return;
    }
    setFinisco(true);
    window.setTimeout(() => {
      voce.tasto.onClick(); // finisce: il testo parte da solo (invia, qui sopra)
      setFinisco(false);
    }, CODA_MS);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const apriChat = () => {
    setFumetto(null);
    playSound("open");
    onApri();
  };
  const risposta = fumetto?.tipo === "comando" ? mostra(fumetto.da, apriChat) : null;
  const resta = !!risposta?.resta;

  // finito tutto il fumetto se ne va da solo
  useEffect(() => {
    if (!fumetto || fumetto.tipo === "consiglio" || resta) return;
    const t = window.setTimeout(() => setFumetto(null), fumetto.tipo === "errore" ? 4500 : RESTA_MS);
    return () => window.clearTimeout(t);
  }, [fumetto, resta]);

  const inAscolto = tenuto || finisco;

  return (
    <>
      <AnimatePresence>
        {(inAscolto || fumetto) && (
          <motion.div
            key={inAscolto ? "ascolto" : fumetto?.tipo}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className={`glass glass-3d absolute right-[14px] z-40 origin-bottom-right rounded-[20px] rounded-br-[6px] px-[14px] py-[11px] text-[13px] leading-snug ${fumetto?.tipo === "consiglio" ? "w-[min(232px,calc(100%-28px))]" : "w-[min(300px,calc(100%-28px))]"} ${fumetto?.tipo === "comando" && !inAscolto ? "" : "pointer-events-none"}`}
            style={{ bottom: "calc(max(14px, env(safe-area-inset-bottom)) + 74px)" }}
          >
            {inAscolto ? (
              <>
                <p className="flex items-center gap-[7px] font-bold" style={{ color: ascolta || finisco ? "var(--trainer)" : undefined }}>
                  {ascolta || finisco ? (
                    <span className="size-[8px] animate-pulse rounded-full" style={{ background: "var(--trainer)" }} />
                  ) : (
                    <Loader2 size={14} className={reduce ? "" : "animate-spin"} />
                  )}
                  {finisco ? "Ho capito, ci penso io…" : ascolta ? "Parla adesso · lascia per mandare" : "Accendo il microfono… aspetta"}
                </p>
                {bozza && <p className="mt-[5px] line-clamp-3 text-ink/80">{bozza}</p>}
              </>
            ) : fumetto?.tipo === "consiglio" ? (
              <p>{consiglio}</p>
            ) : fumetto?.tipo === "errore" ? (
              <p className="font-semibold text-[#d43b4f]">{fumetto.testo}</p>
            ) : fumetto?.tipo === "comando" ? (
              <>
                <div className="flex items-start gap-[8px]">
                  <p className="min-w-0 flex-1 text-[12px] text-muted">
                    Tu: <span className="text-ink/80">«{fumetto.detto}»</span>
                  </p>
                  <button type="button" aria-label="Chiudi" onClick={() => setFumetto(null)} className="-mt-[3px] -mr-[6px] grid size-[24px] shrink-0 cursor-pointer place-items-center rounded-full hover:bg-soft">
                    <X size={13} />
                  </button>
                </div>
                {risposta?.nodo}
              </>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-label="Leo: tocca per scrivere, tieni premuto per parlargli"
        initial={false}
        animate={{ scale: tenuto && !reduce ? 1.15 : fase === 0 ? 0.55 : 1, opacity: fase === 0 ? 0 : 1 }}
        transition={{ scale: { type: "spring", stiffness: 420, damping: fase === 1 ? 18 : 24 }, opacity: { duration: 0.2 } }}
        onPointerDown={giu}
        onPointerUp={su}
        onPointerCancel={su}
        onPointerLeave={() => tenutoRef.current || window.clearTimeout(timer.current)}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => {
          if (tenuto || finisco) return;
          setFumetto(null);
          playSound("open");
          onApri();
        }}
        className="absolute right-[14px] z-40 grid size-[64px] cursor-pointer touch-none place-items-center rounded-full select-none [-webkit-touch-callout:none]"
        style={{
          // sulla stessa riga della barra in basso (Shell.tsx le lascia il posto a destra)
          bottom: "max(14px, env(safe-area-inset-bottom))",
          boxShadow: "0 0 0 1px color-mix(in srgb, var(--trainer) 35%, transparent), 0 12px 30px -6px color-mix(in srgb, var(--trainer) 75%, transparent), 0 0 30px -2px color-mix(in srgb, var(--trainer) 60%, transparent)",
        }}
      >
        {/* l'alone che pulsa, più forte mentre ascolta */}
        {!reduce && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--trainer) 75%, transparent) 45%, transparent 72%)" }}
            animate={{ scale: ascolta ? [1, 1.9] : [1, 1.45], opacity: [0.7, 0] }}
            transition={{ duration: ascolta ? 1 : 1.9, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        {/* il bordo al neon che gira */}
        <span className="absolute inset-0 overflow-hidden rounded-full">
          <motion.span aria-hidden className="absolute top-1/2 left-1/2 aspect-square w-[150%] -translate-x-1/2 -translate-y-1/2" style={{ background: NEON }} animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} />
        </span>
        {/* la testa di Leo (la stessa dell'animazione d'apertura); prima che arrivi, il contenitore vuoto e colorato.
            Quando arriva fa un piccolo colpo, come appoggiata (initial false: aprendo una sezione dopo, niente colpo) */}
        <motion.span
          id={ID_FACCIA_LEO}
          initial={false}
          animate={arrivata && !reduce ? { scale: [1, 1.09, 1] } : { scale: 1 }}
          transition={{ duration: 0.34, ease: "easeOut" }}
          className="relative size-[58px] rounded-full"
          style={arrivata ? undefined : { background: "radial-gradient(circle at 40% 35%, color-mix(in srgb, var(--trainer) 35%, white), var(--trainer))" }}
        >
          {arrivata && <TestaLeo size={58} />}
        </motion.span>
        {(ascolta || finisco) && (
          <span className="absolute -top-[1px] -right-[1px] grid size-[22px] place-items-center rounded-full text-white ring-2 ring-white" style={{ background: "var(--trainer)" }}>
            <Mic size={12} strokeWidth={2.6} />
          </span>
        )}
      </motion.button>
    </>
  );
}

// ——— Il trainer: Leo fa le azioni, il fumetto le mostra e chiede le conferme ———

export function TastoLeo({ chat, onApri }: { chat: Chat; onApri: () => void }) {
  const reduce = useReducedMotion();
  return (
    <FacciaLeo
      occupato={chat.typing}
      quanti={chat.messages.length}
      chiedi={(t) => chat.ask(t)}
      onApri={onApri}
      consiglio={
        <>
          <b>Tocca</b> per scrivere a Leo, <b>tieni premuto</b> e dimmi cosa fare: lo faccio io
        </>
      }
      mostra={(da, apriChat) => {
        const risposta = chat.messages.slice(da).find((m) => m.from === "coach");
        const schede = risposta?.schede ?? [];
        const daConfermare = schede.filter((s) => s.stato === "da-confermare");
        const inCorso = chat.typing || schede.some((s) => s.stato === "in-corso");
        return {
          resta: !risposta || inCorso || daConfermare.length > 0,
          nodo: (
            <>
              <button type="button" onClick={apriChat} className="mt-[6px] block w-full cursor-pointer text-left">
                {risposta?.text ? (
                  <span className="line-clamp-4 font-medium">{risposta.text}</span>
                ) : (
                  <span className="flex items-center gap-[6px] text-muted">
                    <Loader2 size={13} className={reduce ? "" : "animate-spin"} /> Leo ci sta pensando…
                  </span>
                )}
              </button>
              {schede.length > 0 && (
                <ul className="mt-[8px] flex flex-col gap-[5px] border-t border-line/60 pt-[8px]">
                  {schede.map((s) => (
                    <li key={s.key} className="flex items-start gap-[7px] text-[12px] leading-snug">
                      <span className="mt-[1px] shrink-0">
                        {s.stato === "fatto" ? (
                          <Check size={13} strokeWidth={2.8} className="text-[#2f9e5b]" />
                        ) : s.stato === "in-corso" ? (
                          <Loader2 size={13} className={reduce ? "" : "animate-spin"} style={{ color: "var(--trainer)" }} />
                        ) : s.stato === "da-confermare" ? (
                          <Clock size={13} style={{ color: "var(--trainer)" }} />
                        ) : (
                          <X size={13} strokeWidth={2.8} className="text-[#d43b4f]" />
                        )}
                      </span>
                      <span className={`min-w-0 ${s.stato === "annullato" || s.stato === "rifiutato" || s.stato === "errore" ? "text-muted" : ""}`}>
                        {s.titolo}
                        {(s.stato === "rifiutato" || s.stato === "errore") && <span className="block text-[11px] text-[#d43b4f]">{s.motivo ?? "Non si può fare"}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {daConfermare.length > 0 && risposta && (
                <div className="mt-[10px] flex gap-[6px]">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => (daConfermare.length === 1 ? chat.conferma(risposta.id, daConfermare[0].key) : chat.confermaTutte(risposta.id))}
                    className="btn-trainer flex h-[34px] flex-1 cursor-pointer items-center justify-center gap-[5px] rounded-full text-[12.5px] font-semibold"
                  >
                    <Check size={14} /> {daConfermare.length === 1 ? "Conferma" : `Conferma tutte (${daConfermare.length})`}
                  </motion.button>
                  <button type="button" onClick={apriChat} className="glass h-[34px] cursor-pointer rounded-full px-[12px] text-[12.5px] font-semibold">
                    Rivedi
                  </button>
                </div>
              )}
            </>
          ),
        };
      }}
    />
  );
}
